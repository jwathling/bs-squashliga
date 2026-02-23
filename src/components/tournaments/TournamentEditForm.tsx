import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Search, CalendarIcon, Play, Save, Plus } from "lucide-react";
import { MatchSchedulePreview } from "@/components/tournaments/MatchSchedulePreview";
import { usePlayers } from "@/hooks/usePlayers";
import {
  useUpdateTournamentName,
  useUpdateTournamentPlayers,
  useUpdateTournamentDate,
  useStartTournament,
  TournamentPlayer,
} from "@/hooks/useTournaments";
import { CreatePlayerDialog } from "@/components/players/CreatePlayerDialog";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  scheduledDate,
  tournamentPlayers,
  onStarted,
}: TournamentEditFormProps) {
  const [name, setName] = useState(tournamentName);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    scheduledDate ? parseISO(scheduledDate) : new Date()
  );

  const { data: allPlayers = [], isLoading } = usePlayers();
  const updateName = useUpdateTournamentName();
  const updatePlayers = useUpdateTournamentPlayers();
  const updateDate = useUpdateTournamentDate();
  const startTournament = useStartTournament();

  // Initialize selected players from tournament players
  useEffect(() => {
    setSelectedPlayers(tournamentPlayers.map((tp) => tp.player_id));
  }, [tournamentPlayers]);

  const filteredPlayers = allPlayers.filter((p) =>
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

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error("Turniername darf nicht leer sein");
      return;
    }
    try {
      await updateName.mutateAsync({ tournamentId, name: name.trim() });
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

  const handleDateChange = async (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    try {
      await updateDate.mutateAsync({
        tournamentId,
        scheduledDate: format(date, "yyyy-MM-dd"),
      });
      toast.success("Datum gespeichert!");
    } catch (error) {
      toast.error("Fehler beim Speichern des Datums");
    }
  };

  const handleStart = async () => {
    if (selectedPlayers.length < 2) {
      toast.error("Mindestens 2 Spieler erforderlich");
      return;
    }
    
    // First save any pending player changes
    const currentPlayerIds = tournamentPlayers.map(tp => tp.player_id);
    const playersChanged = selectedPlayers.length !== currentPlayerIds.length ||
      !selectedPlayers.every(id => currentPlayerIds.includes(id));
    
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

  const hasNameChanged = name.trim() !== tournamentName;
  const currentPlayerIds = tournamentPlayers.map((tp) => tp.player_id);
  const hasPlayersChanged =
    selectedPlayers.length !== currentPlayerIds.length ||
    !selectedPlayers.every((id) => currentPlayerIds.includes(id));

  return (
    <>
      <div className="space-y-6">
        {/* Tournament Name */}
        <div className="space-y-2">
          <Label htmlFor="tournamentName">Turniername</Label>
          <div className="flex gap-2">
            <Input
              id="tournamentName"
              placeholder="z.B. Freitagsturnier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            {hasNameChanged && (
              <Button
                onClick={handleSaveName}
                disabled={updateName.isPending}
                size="icon"
                variant="outline"
              >
                <Save className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tournament Date */}
        <div className="space-y-2">
          <Label>Turnierdatum</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate
                  ? format(selectedDate, "dd. MMMM yyyy", { locale: de })
                  : "Datum wählen"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Player Selection */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Spieler auswählen ({selectedPlayers.length})
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
          Beim Starten werden die Matches generiert und können nicht mehr geändert werden.
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
