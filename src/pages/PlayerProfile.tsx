import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/ui/stat-card";
import { OpponentStats } from "@/components/players/OpponentStats";
import { usePlayer, useUpdatePlayer, useDeletePlayer } from "@/hooks/usePlayers";
import { usePlayerTournaments } from "@/hooks/useTournaments";
import { ArrowLeft, Edit2, Check, X, Trophy, Gamepad2, TrendingUp, Medal, Trash2 } from "lucide-react";
import { EloChart } from "@/components/players/EloChart";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
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

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: player, isLoading } = usePlayer(id);
  const { data: tournaments = [] } = usePlayerTournaments(id);
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();

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

  const handleDelete = async () => {
    try {
      await deletePlayer.mutateAsync(player.id);
      toast.success("Spieler gelöscht");
      navigate("/players");
    } catch (error) {
      toast.error("Fehler beim Löschen");
    }
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Spieler löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten des Spielers werden gelöscht.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

      {/* Opponents */}
      <div className="mb-8">
        <OpponentStats playerId={player.id} playerName={player.name} />
      </div>

      {/* Tournament History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Turnierhistorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedTournaments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Noch keine Turniere gespielt
            </p>
          ) : (
            <div className="space-y-3">
              {sortedTournaments.map((tp) => {
                const pointDiff = tp.points_for - tp.points_against;
                
                return (
                  <Link key={tp.id} to={`/tournaments/${tp.tournament.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
                      <div>
                        <h4 className="font-medium">{tp.tournament.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(tp.tournament.created_at), "dd. MMMM yyyy", { locale: de })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{tp.wins}/{tp.games_played} Siege</span>
                          <Badge 
                            variant={tp.elo_change >= 0 ? "default" : "destructive"}
                            className={tp.elo_change >= 0 ? "bg-success text-success-foreground" : ""}
                          >
                            {tp.elo_change >= 0 ? "+" : ""}{tp.elo_change} ELO
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Diff: {pointDiff >= 0 ? "+" : ""}{pointDiff}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default PlayerProfile;
