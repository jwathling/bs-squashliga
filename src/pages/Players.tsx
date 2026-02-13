import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { PlayerCard } from "@/components/players/PlayerCard";
import { CreatePlayerDialog } from "@/components/players/CreatePlayerDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePlayers } from "@/hooks/usePlayers";
import { useInactivePlayers } from "@/hooks/useInactivePlayers";
import { Plus, Search, Users, ArrowLeft } from "lucide-react";

const PlayersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: players = [], isLoading } = usePlayers();
  const { data: inactiveIds = new Set<string>() } = useInactivePlayers();

  const inactiveCount = players.filter((p) => inactiveIds.has(p.id)).length;

  const filteredPlayers = players
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((p) => showInactive || !inactiveIds.has(p.id));

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
            <h1 className="text-2xl font-bold text-foreground">Spieler</h1>
            <p className="text-muted-foreground">
              {players.length} Spieler registriert{inactiveCount > 0 && ` (${inactiveCount} inaktiv)`}
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Spieler
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Spieler suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive" className="text-sm text-muted-foreground whitespace-nowrap">
            Inaktive anzeigen
          </Label>
        </div>
      </div>

      {/* Player List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lade Spieler...</p>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {players.length === 0 ? "Noch keine Spieler" : "Keine Spieler gefunden"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {players.length === 0
                ? "Erstelle deinen ersten Spieler, um loszulegen."
                : "Versuche einen anderen Suchbegriff."}
            </p>
            {players.length === 0 && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Spieler erstellen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredPlayers.map((player, index) => (
            <PlayerCard
              key={player.id}
              id={player.id}
              name={player.name}
              elo={player.elo}
              rank={index + 1}
              wins={player.total_wins}
              games={player.total_games}
              showRank
              inactive={inactiveIds.has(player.id)}
            />
          ))}
        </div>
      )}

      <CreatePlayerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </Layout>
  );
};

export default PlayersPage;
