import { useState } from "react";
import { Trophy, Zap, TrendingUp, Target, Shield, Skull } from "lucide-react";
import { BADGE_DEFINITIONS, type BadgeType } from "@/lib/badges";
import { cn } from "@/lib/utils";
import type { PlayerBadge } from "@/hooks/useBadges";
import { BadgeDisplay } from "./BadgeDisplay";

const iconMap = {
  Trophy,
  Zap,
  TrendingUp,
  Target,
  Shield,
  Skull,
};

interface BadgeSummaryProps {
  badges: PlayerBadge[];
  showTournamentName?: boolean;
}

export function BadgeSummary({ badges, showTournamentName = false }: BadgeSummaryProps) {
  const [expandedType, setExpandedType] = useState<string | null>(null);

  if (badges.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-6 text-sm">
        Noch keine Auszeichnungen
      </p>
    );
  }

  // Group badges by type
  const grouped = badges.reduce<Record<string, PlayerBadge[]>>((acc, badge) => {
    if (!acc[badge.badge_type]) acc[badge.badge_type] = [];
    acc[badge.badge_type].push(badge);
    return acc;
  }, {});

  // Sort by badge type order
  const typeOrder: BadgeType[] = [
    "tournament_winner",
    "highest_win",
    "best_elo",
    "most_points",
    "best_defense",
    "last_place",
  ];

  const sortedTypes = typeOrder.filter((t) => grouped[t]);

  return (
    <div className="space-y-2">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {sortedTypes.map((type) => {
          const def = BADGE_DEFINITIONS[type];
          const Icon = iconMap[def.icon];
          const count = grouped[type].length;
          const isExpanded = expandedType === type;

          return (
            <button
              key={type}
              onClick={() => setExpandedType(isExpanded ? null : type)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all cursor-pointer",
                def.color,
                isExpanded && "ring-2 ring-ring ring-offset-1 ring-offset-background"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{def.label}</span>
              <span className="ml-0.5 rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0 text-xs font-bold min-w-[1.25rem] text-center">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expanded detail list */}
      {expandedType && grouped[expandedType] && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {grouped[expandedType].map((badge) => (
            <BadgeDisplay
              key={badge.id}
              badgeType={badge.badge_type}
              badgeLabel={badge.badge_label}
              badgeValue={badge.badge_value}
              tournamentName={showTournamentName ? badge.tournament?.name : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
