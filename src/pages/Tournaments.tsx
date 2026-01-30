import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { useTournaments, useTournamentPlayers } from "@/hooks/useTournaments";
import { Plus, Search, Trophy, ArrowLeft } from "lucide-react";

const TournamentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: tournaments = [], isLoading } = useTournaments();

  const activeTournaments = tournaments.filter(t => t.status === "active");
  const completedTournaments = tournaments.filter(t => t.status === "completed");

  const filterTournaments = (list: typeof tournaments) =>
    list.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Turniere</h1>
            <p className="text-muted-foreground">{tournaments.length} Turniere insgesamt</p>
          </div>
        </div>
        <Link to="/tournaments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neues Turnier
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Turnier suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="active" className="flex-1">
            Aktiv ({activeTournaments.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Beendet ({completedTournaments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <TournamentList
            tournaments={filterTournaments(activeTournaments)}
            isLoading={isLoading}
            emptyMessage="Keine aktiven Turniere"
            emptyAction={
              <Link to="/tournaments/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Turnier erstellen
                </Button>
              </Link>
            }
          />
        </TabsContent>

        <TabsContent value="completed">
          <TournamentList
            tournaments={filterTournaments(completedTournaments)}
            isLoading={isLoading}
            emptyMessage="Keine beendeten Turniere"
          />
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

interface TournamentListProps {
  tournaments: Array<{
    id: string;
    name: string;
    status: "active" | "completed";
    created_at: string;
    completed_at: string | null;
    scheduled_date: string;
  }>;
  isLoading: boolean;
  emptyMessage: string;
  emptyAction?: React.ReactNode;
}

function TournamentList({ tournaments, isLoading, emptyMessage, emptyAction }: TournamentListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Lade Turniere...</p>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-12 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{emptyMessage}</h3>
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {tournaments.map((tournament) => (
        <TournamentCardWithPlayers key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
}

function TournamentCardWithPlayers({ tournament }: { tournament: { id: string; name: string; status: "active" | "completed"; created_at: string; completed_at: string | null; scheduled_date: string } }) {
  const { data: players = [] } = useTournamentPlayers(tournament.id);
  
  return (
    <TournamentCard
      id={tournament.id}
      name={tournament.name}
      status={tournament.status}
      playerCount={players.length}
      createdAt={tournament.created_at}
      completedAt={tournament.completed_at}
      scheduledDate={tournament.scheduled_date}
    />
  );
}

export default TournamentsPage;
