import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/ui/stat-card";
import { usePlayer } from "@/hooks/usePlayers";
import { usePlayerTournaments } from "@/hooks/useTournaments";
import { ArrowLeft, Trophy, TrendingUp, Star, Search, Percent } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const PlayerTournaments = () => {
  const { id } = useParams<{ id: string }>();
  const { data: player, isLoading: playerLoading } = usePlayer(id);
  const { data: tournaments = [], isLoading } = usePlayerTournaments(id);
  const [search, setSearch] = useState("");

  const sortedTournaments = useMemo(
    () =>
      [...tournaments].sort(
        (a, b) =>
          new Date(b.tournament.created_at).getTime() -
          new Date(a.tournament.created_at).getTime()
      ),
    [tournaments]
  );

  const filtered = useMemo(
    () =>
      sortedTournaments.filter((tp) =>
        tp.tournament.name.toLowerCase().includes(search.toLowerCase())
      ),
    [sortedTournaments, search]
  );

  // Stats
  const totalTournaments = tournaments.length;
  const avgEloChange =
    totalTournaments > 0
      ? Math.round(
          tournaments.reduce((sum, tp) => sum + tp.elo_change, 0) / totalTournaments
        )
      : 0;
  const bestTournament = tournaments.length > 0
    ? tournaments.reduce((best, tp) => (tp.elo_change > best.elo_change ? tp : best))
    : null;
  const totalWins = tournaments.reduce((s, tp) => s + tp.wins, 0);
  const totalGames = tournaments.reduce((s, tp) => s + tp.games_played, 0);
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  if (isLoading || playerLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lade Turnierhistorie...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/players/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turnierhistorie</h1>
          {player && (
            <p className="text-sm text-muted-foreground">{player.name}</p>
          )}
        </div>
      </div>

      {/* Fakten */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Turniere" value={totalTournaments} icon={Trophy} />
        <StatCard title="Ø ELO-Änderung" value={avgEloChange >= 0 ? `+${avgEloChange}` : avgEloChange} icon={TrendingUp} />
        <StatCard
          title="Bestes Turnier"
          value={bestTournament ? `+${bestTournament.elo_change}` : "–"}
          icon={Star}
          trend={bestTournament?.tournament.name}
        />
        <StatCard title="Siegquote" value={`${winRate}%`} icon={Percent} />
      </div>

      {/* Suche */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Turnier suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Liste */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Alle Turniere ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {search ? "Keine Turniere gefunden" : "Noch keine Turniere gespielt"}
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((tp) => {
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
                          <span className="text-sm">
                            {tp.wins}/{tp.games_played} Siege
                          </span>
                          <Badge
                            variant={tp.elo_change >= 0 ? "default" : "destructive"}
                            className={tp.elo_change >= 0 ? "bg-success text-success-foreground" : ""}
                          >
                            {tp.elo_change >= 0 ? "+" : ""}
                            {tp.elo_change} ELO
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Diff: {pointDiff >= 0 ? "+" : ""}
                          {pointDiff}
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

export default PlayerTournaments;
