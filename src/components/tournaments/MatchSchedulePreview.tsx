import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateRoundSchedule } from "@/lib/matchScheduler";
import { ListOrdered, Info } from "lucide-react";
import { Player } from "@/hooks/usePlayers";

interface MatchSchedulePreviewProps {
  selectedPlayerIds: string[];
  allPlayers: Player[];
}

export function MatchSchedulePreview({ selectedPlayerIds, allPlayers }: MatchSchedulePreviewProps) {
  const schedule = useMemo(() => {
    if (selectedPlayerIds.length < 2) return [];
    return generateRoundSchedule(selectedPlayerIds, 1);
  }, [selectedPlayerIds]);

  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allPlayers.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [allPlayers]);

  if (selectedPlayerIds.length < 2) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ListOrdered className="h-4 w-4" />
          Spielplan-Vorschau
        </CardTitle>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Aktualisiert sich automatisch bei Spieleränderung
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {schedule.map((match) => (
            <div
              key={match.matchOrder}
              className="flex items-center gap-3 p-2 rounded-md bg-secondary/50 text-sm"
            >
              <span className="text-muted-foreground font-mono w-6 text-right shrink-0">
                {match.matchOrder}.
              </span>
              <span className="font-medium">
                {playerNameMap.get(match.player1Id) ?? "?"}
              </span>
              <span className="text-muted-foreground">vs</span>
              <span className="font-medium">
                {playerNameMap.get(match.player2Id) ?? "?"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
