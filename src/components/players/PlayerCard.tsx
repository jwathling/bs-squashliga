import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

interface PlayerCardProps {
  id: string;
  name: string;
  elo: number;
  rank?: number;
  wins: number;
  games: number;
  showRank?: boolean;
}

export function PlayerCard({ id, name, elo, rank, wins, games, showRank = false }: PlayerCardProps) {
  const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;
  
  return (
    <Link to={`/players/${id}`}>
      <Card className="shadow-card hover:shadow-button transition-all duration-300 cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {showRank && rank && (
              <div className="flex-shrink-0">
                {rank <= 3 ? (
                  <div className={`
                    flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm
                    ${rank === 1 ? "bg-warning text-warning-foreground" : ""}
                    ${rank === 2 ? "bg-muted text-muted-foreground" : ""}
                    ${rank === 3 ? "bg-warning/50 text-foreground" : ""}
                  `}>
                    <Trophy className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-sm">
                    {rank}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {name}
                </h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {elo}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>{wins}/{games} Siege</span>
                <span className="flex items-center gap-1">
                  {winRate >= 50 ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                  {winRate}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
