import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Search } from "lucide-react";
import { usePlayers } from "@/hooks/usePlayers";
import { useCreateTournament } from "@/hooks/useTournaments";
import { generateRoundSchedule } from "@/lib/matchScheduler";
import { CreatePlayerDialog } from "@/components/players/CreatePlayerDialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CreateTournamentFormProps {
  onCancel?: () => void;
}

export function CreateTournamentForm({ onCancel }: CreateTournamentFormProps) {
  const [name, setName] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);

  const { data: players = [], isLoading } = usePlayers();
  const createTournament = useCreateTournament();
  const navigate = useNavigate();

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handlePlayerCreated = (playerId: string) => {
    setSelectedPlayers((prev) => [...prev, playerId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Bitte gib einen Turniernamen ein");
      return;
    }

    if (selectedPlayers.length < 2) {
      toast.error("Mindestens 2 Spieler erforderlich");
      return;
    }

    try {
      const matches = generateRoundSchedule(selectedPlayers, 1);
      const tournament = await createTournament.mutateAsync({
        name: name.trim(),
        playerIds: selectedPlayers,
        matches,
      });

      toast.success(`Turnier "${tournament.name}" erstellt!`);
      navigate(`/tournaments/${tournament.id}`);
    } catch (error) {
      toast.error("Fehler beim Erstellen des Turniers");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="tournamentName">Turniername</Label>
          <Input
            id="tournamentName"
            placeholder="z.B. Freitagsturnier"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Spieler auswählen ({selectedPlayers.length})
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCreatePlayerOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Neuer Spieler
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Spieler suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <p className="text-muted-foreground text-center py-4">Lade Spieler...</p>
            ) : filteredPlayers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {players.length === 0
                  ? "Noch keine Spieler vorhanden"
                  : "Keine Spieler gefunden"}
              </p>
            ) : (
              <div className="grid gap-2 max-h-60 overflow-y-auto">
              {filteredPlayers.map((player) => (
                  <label
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedPlayers.includes(player.id)}
                      onCheckedChange={() => togglePlayer(player.id)}
                    />
                    <div className="flex-1">
                      <span className="font-medium">{player.name}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        ({player.elo})
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Abbrechen
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={createTournament.isPending || selectedPlayers.length < 2}
          >
            {createTournament.isPending ? "Erstelle..." : "Letz Fetz"}
          </Button>
        </div>
      </form>

      <CreatePlayerDialog
        open={createPlayerOpen}
        onOpenChange={setCreatePlayerOpen}
        onCreated={handlePlayerCreated}
      />
    </>
  );
}
