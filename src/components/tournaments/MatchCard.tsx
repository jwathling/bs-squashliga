import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { Match } from "@/hooks/useTournaments";
import { isValidScore, getWinner } from "@/lib/elo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MatchCardProps {
  match: Match;
  onScoreSubmit: (matchId: string, player1Score: number, player2Score: number, winnerId: string) => void;
  disabled?: boolean;
}

export function MatchCard({ match, onScoreSubmit, disabled }: MatchCardProps) {
  const [score1, setScore1] = useState(match.player1_score?.toString() || "");
  const [score2, setScore2] = useState(match.player2_score?.toString() || "");
  const [isEditing, setIsEditing] = useState(false);

  const isCompleted = match.status === "completed";
  const isDiscarded = match.status === "discarded";
  const player1Name = match.player1?.name || "Spieler 1";
  const player2Name = match.player2?.name || "Spieler 2";

  const handleSubmit = () => {
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);

    if (isNaN(s1) || isNaN(s2)) {
      toast.error("Bitte gib gültige Punktzahlen ein");
      return;
    }

    if (!isValidScore(s1, s2)) {
      toast.error("Ungültiges Ergebnis. Spiel bis 11, bei 10:10 Gewinn mit 2 Punkten Vorsprung.");
      return;
    }

    const winnerId = getWinner(match.player1_id, match.player2_id, s1, s2);
    if (!winnerId) {
      toast.error("Konnte Gewinner nicht ermitteln");
      return;
    }

    onScoreSubmit(match.id, s1, s2, winnerId);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setScore1(match.player1_score?.toString() || "");
    setScore2(match.player2_score?.toString() || "");
    setIsEditing(false);
  };

  return (
    <Card className={cn(
      "transition-all",
      isCompleted && "bg-muted/30",
      isDiscarded && "bg-muted/20 opacity-60",
      !isCompleted && !isDiscarded && "shadow-card"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            Spiel {match.match_order}
          </Badge>
          {isCompleted && (
            <Badge variant="secondary" className="bg-success/20 text-success">
              Beendet
            </Badge>
          )}
          {isDiscarded && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30">
              Verworfen
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Player 1 */}
          <div className={cn(
            "flex-1 text-right",
            isCompleted && match.winner_id === match.player1_id && "font-bold"
          )}>
            <span className="truncate block">{player1Name}</span>
          </div>

          {/* Score Inputs */}
          <div className="flex items-center gap-2">
            {isDiscarded ? (
              <div className="flex items-center gap-2 p-2">
                <span className="text-2xl font-bold w-8 text-center text-muted-foreground line-through">
                  {match.player1_score ?? "-"}
                </span>
                <span className="text-muted-foreground">:</span>
                <span className="text-2xl font-bold w-8 text-center text-muted-foreground line-through">
                  {match.player2_score ?? "-"}
                </span>
              </div>
            ) : isCompleted && !isEditing ? (
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-secondary rounded-lg p-2 transition-colors"
                onClick={() => !disabled && setIsEditing(true)}
              >
                <span className={cn(
                  "text-2xl font-bold w-8 text-center",
                  match.winner_id === match.player1_id ? "text-success" : "text-muted-foreground"
                )}>
                  {match.player1_score}
                </span>
                <span className="text-muted-foreground">:</span>
                <span className={cn(
                  "text-2xl font-bold w-8 text-center",
                  match.winner_id === match.player2_id ? "text-success" : "text-muted-foreground"
                )}>
                  {match.player2_score}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="15"
                  value={score1}
                  onChange={(e) => setScore1(e.target.value)}
                  className="w-14 text-center font-bold text-lg"
                  disabled={disabled}
                />
                <span className="text-muted-foreground font-bold">:</span>
                <Input
                  type="number"
                  min="0"
                  max="15"
                  value={score2}
                  onChange={(e) => setScore2(e.target.value)}
                  className="w-14 text-center font-bold text-lg"
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          {/* Player 2 */}
          <div className={cn(
            "flex-1",
            isCompleted && match.winner_id === match.player2_id && "font-bold"
          )}>
            <span className="truncate block">{player2Name}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {(!isCompleted || isEditing) && (
          <div className="flex justify-center gap-2 mt-3">
            {isEditing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={disabled || !score1 || !score2}
            >
              <Check className="h-4 w-4 mr-1" />
              {isEditing ? "Aktualisieren" : "Eintragen"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
