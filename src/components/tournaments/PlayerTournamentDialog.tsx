import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TournamentPlayer, Match } from "@/hooks/useTournaments";

interface PlayerTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: TournamentPlayer | null;
  matches: Match[];
}

export function PlayerTournamentDialog({ open, onOpenChange, player, matches }: PlayerTournamentDialogProps) {
  if (!player) return null;

  const playerName = player.player?.name || "Unknown";
  const playerId = player.player_id;

  // Filter matches involving this player
  const playerMatches = matches
    .filter((m) => m.player1_id === playerId || m.player2_id === playerId)
    .sort((a, b) => a.match_order - b.match_order);

  const completedMatches = playerMatches.filter((m) => m.status === "completed");
  const pointDiff = player.points_for - player.points_against;
  const winRate = player.games_played > 0 ? Math.round((player.wins / player.games_played) * 100) : 0;
  const currentElo = player.elo_at_start + player.elo_change;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {playerName}
            <Badge variant="secondary" className="font-mono text-xs">{currentElo}</Badge>
            {player.elo_change !== 0 && (
              <span className={cn(
                "text-sm font-medium",
                player.elo_change > 0 ? "text-success" : "text-destructive"
              )}>
                {player.elo_change > 0 ? "+" : ""}{player.elo_change}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-3">
          <StatBox label="Spiele" value={player.games_played} />
          <StatBox label="Siege" value={player.wins} />
          <StatBox label="Siegquote" value={`${winRate}%`} />
          <StatBox label="Diff." value={`${pointDiff > 0 ? "+" : ""}${pointDiff}`} className={cn(
            pointDiff > 0 && "text-success",
            pointDiff < 0 && "text-destructive"
          )} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Pkt. +" value={player.points_for} />
          <StatBox label="Pkt. -" value={player.points_against} />
        </div>

        {/* Match List */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Runde</TableHead>
                <TableHead className="text-xs">Gegner</TableHead>
                <TableHead className="text-xs text-center">Ergebnis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerMatches.map((match) => {
                const isPlayer1 = match.player1_id === playerId;
                const opponent = isPlayer1 ? match.player2 : match.player1;
                const ownScore = isPlayer1 ? match.player1_score : match.player2_score;
                const oppScore = isPlayer1 ? match.player2_score : match.player1_score;
                const isWinner = match.winner_id === playerId;
                const isPending = match.status === "pending";

                return (
                  <TableRow key={match.id}>
                    <TableCell className="text-xs text-muted-foreground">R{match.round}</TableCell>
                    <TableCell className="text-sm">{opponent?.name || "?"}</TableCell>
                    <TableCell className="text-center">
                      {isPending ? (
                        <span className="text-xs text-muted-foreground">Ausstehend</span>
                      ) : (
                        <span className={cn(
                          "font-mono text-sm font-medium",
                          isWinner ? "text-success" : "text-destructive"
                        )}>
                          {ownScore}:{oppScore}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {playerMatches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground text-sm">
                    Keine Spiele
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-lg font-bold", className)}>{value}</div>
    </div>
  );
}
