import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, ReferenceLine } from "recharts";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface TournamentData {
  id: string;
  elo_at_start: number;
  elo_change: number;
  tournament: {
    id: string;
    name: string;
    created_at: string;
  };
}

interface EloChartProps {
  tournaments: TournamentData[];
  currentElo: number;
}

const chartConfig = {
  elo: {
    label: "ELO",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export const EloChart = ({ tournaments, currentElo }: EloChartProps) => {
  if (tournaments.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            ELO-Verlauf
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Noch keine Turnierdaten vorhanden
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort tournaments chronologically (oldest first)
  const sortedTournaments = [...tournaments].sort(
    (a, b) => new Date(a.tournament.created_at).getTime() - new Date(b.tournament.created_at).getTime()
  );

  // Build chart data with cumulative ELO
  const chartData = [
    {
      name: "Start",
      shortName: "Start",
      elo: 1000,
      change: 0,
      date: null,
    },
    ...sortedTournaments.map((tp) => ({
      name: tp.tournament.name,
      shortName: tp.tournament.name.length > 12 
        ? tp.tournament.name.substring(0, 12) + "…" 
        : tp.tournament.name,
      elo: tp.elo_at_start + tp.elo_change,
      change: tp.elo_change,
      date: format(new Date(tp.tournament.created_at), "dd. MMM yyyy", { locale: de }),
    })),
  ];

  // Calculate Y-axis domain with padding
  const eloValues = chartData.map((d) => d.elo);
  const minElo = Math.min(...eloValues);
  const maxElo = Math.max(...eloValues);
  const padding = Math.max(50, Math.round((maxElo - minElo) * 0.2));
  const yMin = Math.floor((minElo - padding) / 50) * 50;
  const yMax = Math.ceil((maxElo + padding) / 50) * 50;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          ELO-Verlauf
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="eloGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="shortName"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickMargin={8}
            />
            <YAxis
              domain={[yMin, yMax]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickMargin={8}
              width={45}
            />
            <ReferenceLine y={1000} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{item.payload.name}</span>
                      {item.payload.date && (
                        <span className="text-muted-foreground text-xs">{item.payload.date}</span>
                      )}
                      <div className="flex items-center gap-2">
                        <span>ELO: {value}</span>
                        {item.payload.change !== 0 && (
                          <span className={item.payload.change > 0 ? "text-success" : "text-destructive"}>
                            ({item.payload.change > 0 ? "+" : ""}{item.payload.change})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="elo"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#eloGradient)"
              dot={{
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
                r: 6,
              }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
