import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface TournamentCardProps {
  id: string;
  name: string;
  status: "active" | "completed";
  playerCount: number;
  createdAt: string;
  completedAt?: string | null;
}

export function TournamentCard({ id, name, status, playerCount, createdAt, completedAt }: TournamentCardProps) {
  const dateToShow = status === "completed" && completedAt ? completedAt : createdAt;
  
  return (
    <Link to={`/tournaments/${id}`}>
      <Card className="shadow-card hover:shadow-button transition-all duration-300 cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {name}
                </h3>
                <Badge 
                  variant={status === "active" ? "default" : "secondary"}
                  className={status === "active" ? "bg-success text-success-foreground" : ""}
                >
                  {status === "active" ? "Aktiv" : "Beendet"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {playerCount} Spieler
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(dateToShow), "dd. MMM yyyy", { locale: de })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
