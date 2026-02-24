import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/ui/stat-card";
import { usePlayer } from "@/hooks/usePlayers";
import { HeadToHeadStats, usePlayerOpponents, useHeadToHead } from "@/hooks/useHeadToHead";
import { ArrowLeft, Users, Search, ThumbsUp, ThumbsDown, Gamepad2, Swords, Target } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const StatBar = ({
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
  }) => {
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
  };

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

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-medium">Punkte</span>
          </div>
          <StatBar
            leftValue={opponent.playerPoints}
            rightValue={opponent.opponentPoints}
            leftLabel={playerName}
            rightLabel={opponent.opponentName}
          />
        </div>
      </div>

      {matches && matches.length > 0 && (
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

const PlayerOpponents = () => {
  const { id } = useParams<{ id: string }>();
  const { data: player, isLoading: playerLoading } = usePlayer(id);
  const { data: opponents = [], isLoading } = usePlayerOpponents(id);
  const [search, setSearch] = useState("");
  const [selectedOpponent, setSelectedOpponent] = useState<HeadToHeadStats | null>(null);

  const filtered = useMemo(
    () =>
      opponents.filter((o) =>
        o.opponentName.toLowerCase().includes(search.toLowerCase())
      ),
    [opponents, search]
  );

  // Stats
  const totalOpponents = opponents.length;
  const bestOpponent = opponents.length > 0
    ? opponents.reduce((best, o) => {
        const bestRate = best.totalGames > 0 ? best.playerWins / best.totalGames : 0;
        const oRate = o.totalGames > 0 ? o.playerWins / o.totalGames : 0;
        return oRate > bestRate ? o : best;
      })
    : null;
  const hardestOpponent = opponents.length > 0
    ? opponents.reduce((worst, o) => {
        const worstRate = worst.totalGames > 0 ? worst.playerWins / worst.totalGames : 0;
        const oRate = o.totalGames > 0 ? o.playerWins / o.totalGames : 0;
        return oRate < worstRate ? o : worst;
      })
    : null;
  const mostPlayed = opponents.length > 0
    ? opponents.reduce((most, o) => (o.totalGames > most.totalGames ? o : most))
    : null;

  if (isLoading || playerLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lade Gegner...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/players/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gegner-Übersicht</h1>
          {player && (
            <p className="text-sm text-muted-foreground">{player.name}</p>
          )}
        </div>
      </div>

      {/* Fakten */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Gegner" value={totalOpponents} icon={Users} />
        <StatCard
          title="Bester Gegner"
          value={bestOpponent ? `${Math.round((bestOpponent.playerWins / bestOpponent.totalGames) * 100)}%` : "–"}
          icon={ThumbsUp}
          trend={bestOpponent?.opponentName}
        />
        <StatCard
          title="Schwierigster"
          value={hardestOpponent ? `${Math.round((hardestOpponent.playerWins / hardestOpponent.totalGames) * 100)}%` : "–"}
          icon={ThumbsDown}
          trend={hardestOpponent?.opponentName}
        />
        <StatCard
          title="Meistgespielt"
          value={mostPlayed?.totalGames ?? 0}
          icon={Gamepad2}
          trend={mostPlayed?.opponentName}
        />
      </div>

      {/* Suche */}
      {!selectedOpponent && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Gegner suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Liste / Detail */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {selectedOpponent ? "Head-to-Head" : `Alle Gegner (${filtered.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedOpponent ? (
            <HeadToHeadDetail
              playerId={id!}
              playerName={player?.name ?? ""}
              opponent={selectedOpponent}
              onBack={() => setSelectedOpponent(null)}
            />
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {search ? "Keine Gegner gefunden" : "Noch keine Spiele gegen andere Spieler"}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((opponent) => {
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
                    <div>
                      <h4 className="font-medium">{opponent.opponentName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {opponent.totalGames} Spiele • {opponent.playerWins} Siege
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={winRate >= 50 ? "default" : "secondary"}
                        className={winRate >= 50 ? "bg-success text-success-foreground" : ""}
                      >
                        {winRate}%
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default PlayerOpponents;
