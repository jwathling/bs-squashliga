import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight, ArrowLeft, Swords, Target } from "lucide-react";
import { HeadToHeadStats, usePlayerOpponents, useHeadToHead } from "@/hooks/useHeadToHead";
import { cn } from "@/lib/utils";

interface OpponentStatsProps {
  playerId: string;
  playerName: string;
}

function StatBar({
  leftValue,
  rightValue,
  leftLabel,
  rightLabel,
  leftColor = "bg-primary",
  rightColor = "bg-accent",
}: {
  leftValue: number;
  rightValue: number;
  leftLabel: string;
  rightLabel: string;
  leftColor?: string;
  rightColor?: string;
}) {
  const total = leftValue + rightValue;
  const leftPercent = total > 0 ? (leftValue / total) * 100 : 50;
  const rightPercent = total > 0 ? (rightValue / total) * 100 : 50;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{leftLabel}</span>
        <span className="font-medium">{rightLabel}</span>
      </div>
      <div className="flex h-6 rounded-full overflow-hidden bg-muted">
        <div
          className={cn("flex items-center justify-end pr-2 text-xs font-bold text-primary-foreground transition-all", leftColor)}
          style={{ width: `${leftPercent}%` }}
        >
          {leftValue > 0 && leftValue}
        </div>
        <div
          className={cn("flex items-center justify-start pl-2 text-xs font-bold text-accent-foreground transition-all", rightColor)}
          style={{ width: `${rightPercent}%` }}
        >
          {rightValue > 0 && rightValue}
        </div>
      </div>
    </div>
  );
}

function HeadToHeadDetail({
  playerId,
  playerName,
  opponent,
  onBack,
}: {
  playerId: string;
  playerName: string;
  opponent: HeadToHeadStats;
  onBack: () => void;
}) {
  const { data: matches = [] } = useHeadToHead(playerId, opponent.opponentId);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Zurück
      </Button>

      <div className="text-center pb-4 border-b border-border">
        <h3 className="text-lg font-bold">
          {playerName} vs {opponent.opponentName}
        </h3>
        <p className="text-sm text-muted-foreground">
          {opponent.totalGames} Spiele gegeneinander
        </p>
      </div>

      <div className="space-y-6 pt-2">
        {/* Wins Bar */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Swords className="h-4 w-4 text-primary" />
            <span className="font-medium">Siege</span>
          </div>
          <StatBar
            leftValue={opponent.playerWins}
            rightValue={opponent.opponentWins}
            leftLabel={playerName}
            rightLabel={opponent.opponentName}
          />
        </div>

        {/* Points Bar */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-medium">Punkte</span>
          </div>
          <StatBar
            leftValue={opponent.playerPoints}
            rightValue={opponent.opponentPoints}
            leftLabel={`${opponent.playerPoints}`}
            rightLabel={`${opponent.opponentPoints}`}
          />
        </div>
      </div>

      {/* Match History */}
      {matches.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h4 className="font-medium mb-3 text-sm text-muted-foreground">Letzte Begegnungen</h4>
          <div className="space-y-2">
            {matches.slice(0, 5).map((match) => {
              const isPlayer1 = match.player1_id === playerId;
              const playerScore = isPlayer1 ? match.player1_score : match.player2_score;
              const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;
              const won = match.winner_id === playerId;

              return (
                <div
                  key={match.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    won ? "bg-success/10" : "bg-destructive/10"
                  )}
                >
                  <span className={cn("font-medium", won ? "text-success" : "text-destructive")}>
                    {won ? "Sieg" : "Niederlage"}
                  </span>
                  <span className="font-mono font-bold">
                    {playerScore} : {opponentScore}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function OpponentStats({ playerId, playerName }: OpponentStatsProps) {
  const { data: opponents = [], isLoading } = usePlayerOpponents(playerId);
  const [selectedOpponent, setSelectedOpponent] = useState<HeadToHeadStats | null>(null);

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Lade Gegner...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Gegner
        </CardTitle>
      </CardHeader>
      <CardContent>
        {opponents.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Noch keine Spiele gegen andere Spieler
          </p>
        ) : selectedOpponent ? (
          <HeadToHeadDetail
            playerId={playerId}
            playerName={playerName}
            opponent={selectedOpponent}
            onBack={() => setSelectedOpponent(null)}
          />
        ) : (
          <div className="space-y-2">
            {opponents.map((opponent) => {
              const winRate =
                opponent.totalGames > 0
                  ? Math.round((opponent.playerWins / opponent.totalGames) * 100)
                  : 0;

              return (
                <button
                  key={opponent.opponentId}
                  onClick={() => setSelectedOpponent(opponent)}
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{opponent.opponentName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {opponent.totalGames} Spiele • {opponent.playerWins} Siege
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={winRate >= 50 ? "default" : "secondary"}
                      className={winRate >= 50 ? "bg-success text-success-foreground" : ""}
                    >
                      {winRate}%
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
