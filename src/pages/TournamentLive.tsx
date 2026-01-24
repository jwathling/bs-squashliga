import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Layout } from "@/components/layout/Layout";
import { LiveTable } from "@/components/tournaments/LiveTable";
import { MatchCard } from "@/components/tournaments/MatchCard";
import {
  useTournament,
  useTournamentPlayers,
  useTournamentMatches,
  useUpdateMatch,
  useUpdateTournamentPlayer,
  useCompleteTournament,
  useAddRound,
  useDeleteTournament,
} from "@/hooks/useTournaments";
import { useUpdatePlayerStats, usePlayers } from "@/hooks/usePlayers";
import { calculateMatchEloChanges } from "@/lib/elo";
import { generateAdditionalRound, calculateTotalMatches } from "@/lib/matchScheduler";
import { ArrowLeft, Trophy, Plus, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const TournamentLive = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { data: tournament, isLoading: tournamentLoading } = useTournament(id);
  const { data: tournamentPlayers = [], isLoading: playersLoading } = useTournamentPlayers(id);
  const { data: matches = [], isLoading: matchesLoading } = useTournamentMatches(id);
  const { data: allPlayers = [] } = usePlayers();
  
  const updateMatch = useUpdateMatch();
  const updateTournamentPlayer = useUpdateTournamentPlayer();
  const updatePlayerStats = useUpdatePlayerStats();
  const completeTournament = useCompleteTournament();
  const addRound = useAddRound();
  const deleteTournament = useDeleteTournament();

  // Set up realtime subscription
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`tournament-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["matches", id] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournament_players', filter: `tournament_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tournament_players", id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  const isLoading = tournamentLoading || playersLoading || matchesLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lade Turnier...</p>
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Turnier nicht gefunden</p>
          <Link to="/tournaments">
            <Button variant="outline">Zurück zur Übersicht</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isCompleted = tournament.status === "completed";
  const completedMatches = matches.filter((m) => m.status === "completed").length;
  const totalMatches = matches.length;
  const allMatchesPlayed = completedMatches === totalMatches && totalMatches > 0;

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, typeof matches>);

  const handleScoreSubmit = async (
    matchId: string,
    player1Score: number,
    player2Score: number,
    winnerId: string
  ) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    try {
      // Get current player data
      const tp1 = tournamentPlayers.find((tp) => tp.player_id === match.player1_id);
      const tp2 = tournamentPlayers.find((tp) => tp.player_id === match.player2_id);
      const p1 = allPlayers.find((p) => p.id === match.player1_id);
      const p2 = allPlayers.find((p) => p.id === match.player2_id);

      if (!tp1 || !tp2 || !p1 || !p2) {
        toast.error("Spielerdaten nicht gefunden");
        return;
      }

      // Check if this is updating an existing match
      const wasCompleted = match.status === "completed";
      const previousWinnerId = match.winner_id;

      // Calculate ELO changes
      const eloChanges = calculateMatchEloChanges(
        p1.elo,
        p2.elo,
        player1Score,
        player2Score
      );

      // Prepare updates
      let p1GamesPlayed = tp1.games_played;
      let p1Wins = tp1.wins;
      let p1PointsFor = tp1.points_for;
      let p1PointsAgainst = tp1.points_against;
      let p1EloChange = tp1.elo_change;

      let p2GamesPlayed = tp2.games_played;
      let p2Wins = tp2.wins;
      let p2PointsFor = tp2.points_for;
      let p2PointsAgainst = tp2.points_against;
      let p2EloChange = tp2.elo_change;

      // If updating existing match, revert previous stats
      if (wasCompleted && match.player1_score !== null && match.player2_score !== null) {
        p1GamesPlayed--;
        p2GamesPlayed--;
        p1PointsFor -= match.player1_score;
        p1PointsAgainst -= match.player2_score;
        p2PointsFor -= match.player2_score;
        p2PointsAgainst -= match.player1_score;
        
        if (previousWinnerId === match.player1_id) {
          p1Wins--;
        } else {
          p2Wins--;
        }

        // Revert ELO (simplified - would need to track actual change)
        const prevEloChanges = calculateMatchEloChanges(
          p1.elo,
          p2.elo,
          match.player1_score,
          match.player2_score
        );
        p1EloChange -= prevEloChanges.player1.change;
        p2EloChange -= prevEloChanges.player2.change;
      }

      // Apply new stats
      p1GamesPlayed++;
      p2GamesPlayed++;
      p1PointsFor += player1Score;
      p1PointsAgainst += player2Score;
      p2PointsFor += player2Score;
      p2PointsAgainst += player1Score;
      p1EloChange += eloChanges.player1.change;
      p2EloChange += eloChanges.player2.change;

      if (winnerId === match.player1_id) {
        p1Wins++;
      } else {
        p2Wins++;
      }

      // Update match
      await updateMatch.mutateAsync({
        matchId,
        player1Score,
        player2Score,
        winnerId,
      });

      // Update tournament players
      await Promise.all([
        updateTournamentPlayer.mutateAsync({
          tournamentId: tournament.id,
          playerId: match.player1_id,
          games_played: p1GamesPlayed,
          wins: p1Wins,
          points_for: p1PointsFor,
          points_against: p1PointsAgainst,
          elo_change: p1EloChange,
        }),
        updateTournamentPlayer.mutateAsync({
          tournamentId: tournament.id,
          playerId: match.player2_id,
          games_played: p2GamesPlayed,
          wins: p2Wins,
          points_for: p2PointsFor,
          points_against: p2PointsAgainst,
          elo_change: p2EloChange,
        }),
      ]);

      // Update global player stats and ELO
      await Promise.all([
        updatePlayerStats.mutateAsync({
          id: match.player1_id,
          elo: eloChanges.player1.newElo,
          total_games: wasCompleted ? p1.total_games : p1.total_games + 1,
          total_wins: winnerId === match.player1_id 
            ? (wasCompleted && previousWinnerId === match.player1_id ? p1.total_wins : p1.total_wins + 1)
            : (wasCompleted && previousWinnerId === match.player1_id ? p1.total_wins - 1 : p1.total_wins),
        }),
        updatePlayerStats.mutateAsync({
          id: match.player2_id,
          elo: eloChanges.player2.newElo,
          total_games: wasCompleted ? p2.total_games : p2.total_games + 1,
          total_wins: winnerId === match.player2_id 
            ? (wasCompleted && previousWinnerId === match.player2_id ? p2.total_wins : p2.total_wins + 1)
            : (wasCompleted && previousWinnerId === match.player2_id ? p2.total_wins - 1 : p2.total_wins),
        }),
      ]);

      toast.success("Ergebnis gespeichert!");
    } catch (error) {
      console.error("Error updating match:", error);
      toast.error("Fehler beim Speichern");
    }
  };

  const handleAddRound = async () => {
    try {
      const playerIds = tournamentPlayers.map((tp) => tp.player_id);
      const newRound = tournament.current_round + 1;
      const startingOrder = totalMatches;

      // Find the last match of the current round to avoid consecutive games
      const currentRoundMatches = matches.filter(m => m.round === tournament.current_round);
      const lastMatch = currentRoundMatches.length > 0
        ? currentRoundMatches.reduce((prev, curr) => 
            curr.match_order > prev.match_order ? curr : prev
          )
        : undefined;

      const lastMatchPlayers = lastMatch 
        ? { player1Id: lastMatch.player1_id, player2Id: lastMatch.player2_id }
        : undefined;

      const newMatches = generateAdditionalRound(playerIds, newRound, startingOrder, lastMatchPlayers);

      await addRound.mutateAsync({
        tournamentId: tournament.id,
        matches: newMatches,
        newRound,
      });

      toast.success(`Runde ${newRound} hinzugefügt!`);
    } catch (error) {
      toast.error("Fehler beim Hinzufügen der Runde");
    }
  };

  const handleCompleteTournament = async () => {
    try {
      await completeTournament.mutateAsync(tournament.id);
      toast.success("Turnier beendet!");
    } catch (error) {
      toast.error("Fehler beim Beenden");
    }
  };

  const handleDeleteTournament = async () => {
    try {
      await deleteTournament.mutateAsync(id!);
      toast.success("Turnier gelöscht! Spielerstatistiken wurden korrigiert.");
      navigate("/tournaments");
    } catch (error) {
      console.error("Error deleting tournament:", error);
      toast.error("Fehler beim Löschen des Turniers");
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link to="/tournaments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{tournament.name}</h1>
              <Badge 
                variant={isCompleted ? "secondary" : "default"}
                className={!isCompleted ? "bg-success text-success-foreground" : ""}
              >
                {isCompleted ? "Beendet" : "Live"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {completedMatches}/{totalMatches} Spiele • Runde {tournament.current_round}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isCompleted && (
            <>
              <Button variant="outline" onClick={handleAddRound} disabled={addRound.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Neue Runde
              </Button>
              {allMatchesPlayed && (
                <Button onClick={handleCompleteTournament} disabled={completeTournament.isPending}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Turnier beenden
                </Button>
              )}
            </>
          )}
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Turnier löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dieses Turnier wird unwiderruflich gelöscht. Alle Spielerstatistiken 
                  (ELO, Siege, Spiele, Turnieranzahl) werden auf den Stand vor dem Turnier zurückgesetzt.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTournament}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteTournament.isPending ? "Löschen..." : "Ja, löschen"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Live Table */}
      <Card className="shadow-card mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Live-Tabelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LiveTable players={tournamentPlayers} />
        </CardContent>
      </Card>

      {/* Matches by Round */}
      {Object.entries(matchesByRound)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([round, roundMatches]) => (
          <Card key={round} className="shadow-card mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Runde {round}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roundMatches
                  .sort((a, b) => a.match_order - b.match_order)
                  .map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onScoreSubmit={handleScoreSubmit}
                      disabled={isCompleted}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
    </Layout>
  );
};

export default TournamentLive;
