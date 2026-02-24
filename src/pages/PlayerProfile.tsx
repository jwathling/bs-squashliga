import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/ui/stat-card";
import { usePlayer, useUpdatePlayer } from "@/hooks/usePlayers";
import { usePlayerTournaments } from "@/hooks/useTournaments";
import { usePlayerOpponents } from "@/hooks/useHeadToHead";
import { ArrowLeft, Edit2, Check, X, Trophy, Gamepad2, TrendingUp, Medal, Users, ChevronRight } from "lucide-react";
import { EloChart } from "@/components/players/EloChart";
import { usePlayerBadges } from "@/hooks/useBadges";
import { BadgeSummary } from "@/components/badges/BadgeSummary";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: player, isLoading } = usePlayer(id);
  const { data: tournaments = [] } = usePlayerTournaments(id);
  const { data: playerBadges = [] } = usePlayerBadges(id);
  const { data: opponents = [] } = usePlayerOpponents(id);
  const updatePlayer = useUpdatePlayer();
  

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lade Spielerprofil...</p>
        </div>
      </Layout>
    );
  }

  if (!player) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Spieler nicht gefunden</p>
          <Link to="/players">
            <Button variant="outline">Zurück zur Übersicht</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const winRate = player.total_games > 0 
    ? Math.round((player.total_wins / player.total_games) * 100) 
    : 0;

  const handleEditStart = () => {
    setEditName(player.name);
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    if (!editName.trim()) {
      toast.error("Name darf nicht leer sein");
      return;
    }

    try {
      await updatePlayer.mutateAsync({ id: player.id, name: editName.trim() });
      toast.success("Name aktualisiert!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditName("");
  };


  // Sort tournaments by date (newest first)
  const sortedTournaments = [...tournaments].sort((a, b) => 
    new Date(b.tournament.created_at).getTime() - new Date(a.tournament.created_at).getTime()
  );

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/players">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="max-w-xs text-lg font-bold"
                autoFocus
              />
              <Button size="icon" onClick={handleEditSave} disabled={updatePlayer.isPending}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleEditCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{player.name}</h1>
              <Badge variant="secondary" className="font-mono text-lg px-3">
                {player.elo}
              </Badge>
              <Button size="icon" variant="ghost" onClick={handleEditStart}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="ELO Rating" value={player.elo} icon={TrendingUp} />
        <StatCard title="Spiele" value={player.total_games} icon={Gamepad2} />
        <StatCard title="Siege" value={player.total_wins} icon={Medal} />
        <StatCard title="Siegquote" value={`${winRate}%`} icon={Trophy} />
      </div>

      {/* ELO History Chart */}
      <div className="mb-8">
        <EloChart tournaments={tournaments} currentElo={player.elo} />
      </div>

      {/* Badges / Auszeichnungen */}
      {playerBadges.length > 0 && (
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Medal className="h-5 w-5 text-accent" />
              Auszeichnungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BadgeSummary badges={playerBadges} showTournamentName />
          </CardContent>
        </Card>
      )}

      {/* Turnierhistorie-Vorschau */}
      <Card className="shadow-card mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Turnierhistorie</h3>
                <p className="text-sm text-muted-foreground">
                  {sortedTournaments.length} Turniere
                  {sortedTournaments.length > 0 && (
                    <> • Letztes: {sortedTournaments[0].tournament.name}</>
                  )}
                </p>
              </div>
            </div>
            <Link to={`/players/${id}/tournaments`}>
              <Button variant="outline" size="sm">
                Alle anzeigen
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Gegner-Vorschau */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Gegner</h3>
                <p className="text-sm text-muted-foreground">
                  {opponents.length} Gegner
                  {opponents.length > 0 && (
                    <> • Meistgespielt: {opponents[0].opponentName}</>
                  )}
                </p>
              </div>
            </div>
            <Link to={`/players/${id}/opponents`}>
              <Button variant="outline" size="sm">
                Alle anzeigen
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default PlayerProfile;
