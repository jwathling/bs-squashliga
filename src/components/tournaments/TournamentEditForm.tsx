import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Users, Search, Play, Save, Plus, X, ChevronDown, Pencil } from "lucide-react";
import { usePlayers } from "@/hooks/usePlayers";
import {
  useUpdateTournamentName,
  useUpdateTournamentPlayers,
  useStartTournament,
  TournamentPlayer,
} from "@/hooks/useTournaments";
import { MatchSchedulePreview } from "@/components/tournaments/MatchSchedulePreview";
import { CreatePlayerDialog } from "@/components/players/CreatePlayerDialog";
import { toast } from "sonner";

interface TournamentEditFormProps {
  tournamentId: string;
  tournamentName: string;
  scheduledDate: string;
  tournamentPlayers: TournamentPlayer[];
  onStarted?: () => void;
}

export function TournamentEditForm({
  tournamentId,
  tournamentName,
  tournamentPlayers,
  onStarted,
}: TournamentEditFormProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(tournamentName);

  const { data: allPlayers = [], isLoading } = usePlayers();
  const updateName = useUpdateTournamentName();
  const updatePlayers = useUpdateTournamentPlayers();
  const startTournament = useStartTournament();

  useEffect(() => {
    setSelectedPlayers(tournamentPlayers.map((tp) => tp.player_id));
  }, [tournamentPlayers]);

  const filteredPlayers = allPlayers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPlayerObjects = allPlayers.filter((p) =>
    selectedPlayers.includes(p.id)
  );

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const removePlayer = (playerId: string) => {
    setSelectedPlayers((prev) => prev.filter((id) => id !== playerId));
  };

  const handlePlayerCreated = (playerId: string) => {
    setSelectedPlayers((prev) => [...prev, playerId]);
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error("Turniername darf nicht leer sein");
      return;
    }
    try {
      await updateName.mutateAsync({ tournamentId, name: name.trim() });
      setEditingName(false);
      toast.success("Name gespeichert!");
    } catch (error) {
      toast.error("Fehler beim Speichern des Namens");
    }
  };

  const handleSavePlayers = async () => {
    if (selectedPlayers.length < 2) {
      toast.error("Mindestens 2 Spieler erforderlich");
      return;
    }
    try {
      await updatePlayers.mutateAsync({ tournamentId, playerIds: selectedPlayers });
      toast.success("Spieler gespeichert!");
    } catch (error) {
      toast.error("Fehler beim Speichern der Spieler");
    }
  };

  const handleStart = async () => {
    if (selectedPlayers.length < 2) {
      toast.error("Mindestens 2 Spieler erforderlich");
      return;
    }

    const currentPlayerIds = tournamentPlayers.map((tp) => tp.player_id);
    const playersChanged =
      selectedPlayers.length !== currentPlayerIds.length ||
      !selectedPlayers.every((id) => currentPlayerIds.includes(id));

    try {
      if (playersChanged) {
        await updatePlayers.mutateAsync({ tournamentId, playerIds: selectedPlayers });
      }
      await startTournament.mutateAsync(tournamentId);
      toast.success("Turnier gestartet! Matches wurden generiert.");
      onStarted?.();
    } catch (error) {
      console.error("Error starting tournament:", error);
      toast.error("Fehler beim Starten des Turniers");
    }
  };

  const currentPlayerIds = tournamentPlayers.map((tp) => tp.player_id);
  const hasPlayersChanged =
    selectedPlayers.length !== currentPlayerIds.length ||
    !selectedPlayers.every((id) => currentPlayerIds.includes(id));

  return (
    <>
      <div className="space-y-6">
        {/* Inline editable name */}
        {editingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg font-semibold max-w-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") { setEditingName(false); setName(tournamentName); }
              }}
            />
            <Button size="sm" onClick={handleSaveName} disabled={updateName.isPending}>
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditingName(false); setName(tournamentName); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Namen ändern</span>
          </button>
        )}

        {/* Participants */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Teilnehmer ({selectedPlayers.length})
              </CardTitle>
              <div className="flex gap-2">
                {hasPlayersChanged && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSavePlayers}
                    disabled={updatePlayers.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Speichern
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected players as chips */}
            {selectedPlayerObjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedPlayerObjects.map((player) => (
                  <Badge
                    key={player.id}
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1"
                  >
                    {player.name}
                    <span className="text-muted-foreground ml-1 text-xs">
                      {player.elo}
                    </span>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Noch keine Spieler ausgewählt
              </p>
            )}

            {/* Collapsible player picker */}
            <Collapsible open={pickerOpen} onOpenChange={setPickerOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Spieler hinzufügen
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Spieler suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setCreatePlayerOpen(true)}
                    title="Neuer Spieler"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {isLoading ? (
                  <p className="text-muted-foreground text-center py-4">
                    Lade Spieler...
                  </p>
                ) : filteredPlayers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    {allPlayers.length === 0
                      ? "Noch keine Spieler vorhanden"
                      : "Keine Spieler gefunden"}
                  </p>
                ) : (
                  <div className="grid gap-1 max-h-48 overflow-y-auto">
                    {filteredPlayers.map((player) => (
                      <label
                        key={player.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedPlayers.includes(player.id)}
                          onCheckedChange={() => togglePlayer(player.id)}
                        />
                        <div className="flex-1">
                          <span className="font-medium text-sm">{player.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            ({player.elo})
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Match Schedule Preview */}
        <MatchSchedulePreview
          selectedPlayerIds={selectedPlayers}
          allPlayers={allPlayers}
        />

        {/* Start Tournament Button */}
        <Button
          onClick={handleStart}
          className="w-full"
          size="lg"
          disabled={startTournament.isPending || selectedPlayers.length < 2}
        >
          <Play className="h-5 w-5 mr-2" />
          {startTournament.isPending ? "Starte..." : "Turnier starten"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Beim Starten werden die Matches generiert und können nicht mehr geändert
          werden.
        </p>
      </div>

      <CreatePlayerDialog
        open={createPlayerOpen}
        onOpenChange={setCreatePlayerOpen}
        onCreated={handlePlayerCreated}
      />
    </>
  );
}
