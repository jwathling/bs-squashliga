import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/ui/stat-card";
import { PlayerCard } from "@/components/players/PlayerCard";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { usePlayers } from "@/hooks/usePlayers";
import { useTournaments, useTournamentPlayers } from "@/hooks/useTournaments";
import { Plus, Trophy, Users, Gamepad2, TrendingUp, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

const Index = () => {
  const {
    data: players = [],
    isLoading: playersLoading
  } = usePlayers();
  const {
    data: tournaments = [],
    isLoading: tournamentsLoading
  } = useTournaments();

  // Get recent tournaments (max 3)
  const recentTournaments = tournaments.slice(0, 3);

  // Get top players by ELO (max 5)
  const topPlayers = [...players].sort((a, b) => b.elo - a.elo).slice(0, 5);

  // Calculate stats
  const totalGames = players.reduce((sum, p) => sum + p.total_games, 0) / 2; // Divide by 2 since each game involves 2 players
  const activeTournaments = tournaments.filter(t => t.status === "active").length;
  return <Layout>
      {/* Hero Section with Wave Background */}
      <section className="relative bg-hero-wave overflow-hidden -mx-4 md:-mx-8 px-4 md:px-8 pt-8 md:pt-16 pb-32 mb-8">
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Content */}
            <div className="text-left">
              <img src={logo} alt="Braunschweiger Squashliga Logo" className="w-32 h-32 md:w-48 md:h-48 mb-6" />
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Braunschweiger
                <span className="block text-white/90">Squashliga</span>
              </h1>
              <p className="text-lg text-white/80 max-w-md mb-8">
                Na Champ, heute schon gesquasht?
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/tournaments/new">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-button w-full sm:w-auto">
                    <Plus className="h-5 w-5 mr-2" />
                    Neues Turnier
                  </Button>
                </Link>
                <Link to="/players">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                    <Users className="h-5 w-5 mr-2" />
                    Spieler verwalten
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Spieler" value={players.length} icon={Users} className="bg-white/95 backdrop-blur" />
              <StatCard title="Turniere" value={tournaments.length} icon={Trophy} className="bg-white/95 backdrop-blur" />
              <StatCard title="Spiele" value={Math.round(totalGames)} icon={Gamepad2} className="bg-white/95 backdrop-blur" />
            </div>
          </div>
        </div>
      </section>

      {/* Top Players & Recent Tournaments */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Players */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Spieler
            </CardTitle>
            <Link to="/players">
              <Button variant="ghost" size="sm">
                Alle anzeigen
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {playersLoading ? <p className="text-muted-foreground text-center py-8">Lade Spieler...</p> : topPlayers.length === 0 ? <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Noch keine Spieler vorhanden</p>
                <Link to="/players">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Spieler erstellen
                  </Button>
                </Link>
              </div> : topPlayers.map((player, index) => <PlayerCard key={player.id} id={player.id} name={player.name} elo={player.elo} rank={index + 1} wins={player.total_wins} games={player.total_games} showRank />)}
          </CardContent>
        </Card>

        {/* Recent Tournaments */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Letzte Turniere
            </CardTitle>
            <Link to="/tournaments">
              <Button variant="ghost" size="sm">
                Alle anzeigen
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {tournamentsLoading ? <p className="text-muted-foreground text-center py-8">Lade Turniere...</p> : recentTournaments.length === 0 ? <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Noch keine Turniere vorhanden</p>
                <Link to="/tournaments/new">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Turnier erstellen
                  </Button>
                </Link>
              </div> : recentTournaments.map(tournament => <TournamentCardWithPlayers key={tournament.id} tournament={tournament} />)}
          </CardContent>
        </Card>
      </div>
    </Layout>;
};

// Helper component to fetch player count for each tournament
function TournamentCardWithPlayers({
  tournament
}: {
  tournament: {
    id: string;
    name: string;
    status: "active" | "completed";
    created_at: string;
    completed_at: string | null;
  };
}) {
  const {
    data: players = []
  } = useTournamentPlayers(tournament.id);
  return <TournamentCard id={tournament.id} name={tournament.name} status={tournament.status} playerCount={players.length} createdAt={tournament.created_at} completedAt={tournament.completed_at} />;
}
export default Index;