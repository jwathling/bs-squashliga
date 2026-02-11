import { Trophy, Zap, TrendingUp, Target, Shield, Skull } from "lucide-react";
import { BADGE_DEFINITIONS, type BadgeType } from "@/lib/badges";
import { cn } from "@/lib/utils";

const iconMap = {
  Trophy,
  Zap,
  TrendingUp,
  Target,
  Shield,
  Skull,
};

interface BadgeDisplayProps {
  badgeType: string;
  badgeLabel: string;
  badgeValue?: string | null;
  playerName?: string;
  tournamentName?: string;
  className?: string;
}

export function BadgeDisplay({
  badgeType,
  badgeLabel,
  badgeValue,
  playerName,
  tournamentName,
  className,
}: BadgeDisplayProps) {
  const def = BADGE_DEFINITIONS[badgeType as BadgeType];
  const IconComponent = def ? iconMap[def.icon] : Trophy;
  const colorClasses = def?.color ?? "bg-muted text-muted-foreground border-border";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 transition-colors",
        colorClasses,
        className
      )}
    >
      <div className="mt-0.5 shrink-0">
        <IconComponent className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm leading-tight">{badgeLabel}</p>
        {playerName && (
          <p className="text-xs opacity-80 mt-0.5">{playerName}</p>
        )}
        {badgeValue && (
          <p className="text-xs opacity-70 mt-0.5">{badgeValue}</p>
        )}
        {tournamentName && (
          <p className="text-xs opacity-60 mt-0.5">{tournamentName}</p>
        )}
      </div>
    </div>
  );
}
