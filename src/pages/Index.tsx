import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
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
  const totalGames = players.reduce((sum, p) => sum + p.total_games, 0) / 2;
  return <Layout>
      {/* Hero Section with Premium Gradient */}
      <section className="relative bg-hero-premium -mx-4 md:-mx-8 -mt-6 md:-mt-8 px-4 md:px-8 pt-12 md:pt-20 pb-28 md:pb-32">
        {/* White wave at bottom */}
        <div className="hero-wave" />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Hero Copy */}
            <div className="text-left">
              <img src={logo} alt="Braunschweiger Squashliga Logo" className="w-24 h-24 md:w-32 md:h-32 mb-6" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                Braunschweiger
                <span className="block text-white/90">Squashliga</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 max-w-md mb-8">
                Na Champ, heute schon gesquasht?
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/tournaments/new">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 shadow-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Neues Turnier
                  </Button>
                </Link>
                <Link to="/players" className="text-white/80 hover:text-white font-medium flex items-center gap-2 transition-colors">
                  <Users className="h-5 w-5" />
                  Spieler verwalten
                </Link>
              </div>
            </div>

            {/* Right Side - KPI Cards */}
            <div className="flex justify-center lg:justify-end">
              <div className="grid grid-cols-3 gap-3 md:gap-4 w-full max-w-md">
                <Card className="bg-white rounded-2xl shadow-xl border-0">
                  <CardContent className="p-4 md:p-5 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{players.length}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">Spieler</p>
                  </CardContent>
                </Card>
                <Card className="bg-white rounded-2xl shadow-xl border-0">
                  <CardContent className="p-4 md:p-5 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{tournaments.length}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">Turniere</p>
                  </CardContent>
                </Card>
                <Card className="bg-white rounded-2xl shadow-xl border-0">
                  <CardContent className="p-4 md:p-5 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Gamepad2 className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{Math.round(totalGames)}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">Spiele</p>
                  </CardContent>
                </Card>
              </div>
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