import { BadgeDisplay } from "./BadgeDisplay";
import type { PlayerBadge } from "@/hooks/useBadges";

interface BadgeGridProps {
  badges: PlayerBadge[];
  playerNames?: Record<string, string>;
  showPlayerName?: boolean;
  showTournamentName?: boolean;
}

export function BadgeGrid({
  badges,
  playerNames,
  showPlayerName = false,
  showTournamentName = false,
}: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-6 text-sm">
        Noch keine Auszeichnungen
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((badge) => (
        <BadgeDisplay
          key={badge.id}
          badgeType={badge.badge_type}
          badgeLabel={badge.badge_label}
          badgeValue={badge.badge_value}
          playerName={showPlayerName ? playerNames?.[badge.player_id] : undefined}
          tournamentName={showTournamentName ? badge.tournament?.name : undefined}
        />
      ))}
    </div>
  );
}
