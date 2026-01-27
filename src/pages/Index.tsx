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
  
  return <Layout>
      {/* Hero Section */}
      <section className="relative py-8 md:py-16 mb-8">
        <div className="absolute inset-0 bg-gradient-hero rounded-3xl" />
        <div className="relative text-center px-4">
          <img alt="Braunschweiger Squashliga Logo" className="w-48 h-48 md:w-64 md:h-64 mx-auto mb-6" src="/lovable-uploads/3c3707a3-af89-4662-9b8d-21700999505e.png" />
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Braunschweiger Squashliga 
            <span className="block text-gradient my-[20px]">Squashliga</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8 text-center">
            Hey Champ, heute schon gesquasht?  
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/tournaments/new">
              <Button size="lg" className="shadow-button w-full sm:w-auto">
                <Plus className="h-5 w-5 mr-2" />
                Neues Turnier
              </Button>
            </Link>
            <Link to="/players">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Users className="h-5 w-5 mr-2" />
                Spieler verwalten
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Spieler" value={players.length} icon={Users} />
        <StatCard title="Turniere" value={tournaments.length} icon={Trophy} />
        <StatCard title="Spiele" value={Math.round(totalGames)} icon={Gamepad2} />
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
          <CardContent className="flex flex-col gap-4">
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
          <CardContent className="flex flex-col gap-4">
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