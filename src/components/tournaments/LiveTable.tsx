import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TournamentPlayer } from "@/hooks/useTournaments";
import { cn } from "@/lib/utils";

interface LiveTableProps {
  players: TournamentPlayer[];
}

export function LiveTable({ players }: LiveTableProps) {
  // Sort by wins (desc), then by point difference (desc)
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const aDiff = a.points_for - a.points_against;
    const bDiff = b.points_for - b.points_against;
    return bDiff - aDiff;
  });

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Spieler (ELO)</TableHead>
            <TableHead className="text-center w-20">Spiele</TableHead>
            <TableHead className="text-center w-20">Siege</TableHead>
            <TableHead className="text-center w-24">Diff.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((tp, index) => {
            const pointDiff = tp.points_for - tp.points_against;
            const currentElo = tp.elo_at_start + tp.elo_change;
            
            return (
              <TableRow 
                key={tp.id}
                className={cn(
                  index === 0 && "bg-warning/10",
                  index === 1 && "bg-muted/30",
                  index === 2 && "bg-warning/5"
                )}
              >
                <TableCell className="text-center font-bold">
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tp.player?.name || "Unknown"}</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {currentElo}
                    </Badge>
                    {tp.elo_change !== 0 && (
                      <span className={cn(
                        "text-xs font-medium",
                        tp.elo_change > 0 ? "text-success" : "text-destructive"
                      )}>
                        {tp.elo_change > 0 ? "+" : ""}{tp.elo_change}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">{tp.games_played}</TableCell>
                <TableCell className="text-center font-semibold">{tp.wins}</TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "font-mono",
                    pointDiff > 0 && "text-success",
                    pointDiff < 0 && "text-destructive"
                  )}>
                    {pointDiff > 0 ? "+" : ""}{pointDiff}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
