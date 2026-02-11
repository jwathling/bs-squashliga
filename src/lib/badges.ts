import type { TournamentPlayer, Match } from "@/hooks/useTournaments";

export type BadgeType =
  | "tournament_winner"
  | "highest_win"
  | "best_elo"
  | "most_points"
  | "best_defense"
  | "last_place";

export interface BadgeDefinition {
  type: BadgeType;
  label: string;
  icon: "Trophy" | "Zap" | "TrendingUp" | "Target" | "Shield" | "Skull";
  color: string; // tailwind classes
}

export const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  tournament_winner: {
    type: "tournament_winner",
    label: "Turniersieg",
    icon: "Trophy",
    color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  },
  highest_win: {
    type: "highest_win",
    label: "Höchster Sieg",
    icon: "Zap",
    color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  },
  best_elo: {
    type: "best_elo",
    label: "ELO-Rakete",
    icon: "TrendingUp",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  },
  most_points: {
    type: "most_points",
    label: "Punktemaschine",
    icon: "Target",
    color: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
  },
  best_defense: {
    type: "best_defense",
    label: "Mauer",
    icon: "Shield",
    color: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-600",
  },
  last_place: {
    type: "last_place",
    label: "Arsch der Schande",
    icon: "Skull",
    color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  },
};

export interface CalculatedBadge {
  player_id: string;
  badge_type: BadgeType;
  badge_label: string;
  badge_value: string;
}

interface PlayerNameMap {
  [id: string]: string;
}

export function calculateTournamentBadges(
  matches: Match[],
  tournamentPlayers: TournamentPlayer[],
  playerNames: PlayerNameMap
): CalculatedBadge[] {
  const badges: CalculatedBadge[] = [];

  if (tournamentPlayers.length === 0) return badges;

  // Sort like LiveTable: wins desc, then point diff desc
  const sorted = [...tournamentPlayers].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const diffA = a.points_for - a.points_against;
    const diffB = b.points_for - b.points_against;
    return diffB - diffA;
  });

  const diff = (p: TournamentPlayer) => p.points_for - p.points_against;

  // 1. Turniersieg - all players tied for 1st
  const topWins = sorted[0].wins;
  const topDiff = diff(sorted[0]);
  const winners = sorted.filter((p) => p.wins === topWins && diff(p) === topDiff);
  for (const w of winners) {
    badges.push({
      player_id: w.player_id,
      badge_type: "tournament_winner",
      badge_label: "Turniersieg",
      badge_value: `${w.wins} Siege, Diff ${topDiff >= 0 ? "+" : ""}${topDiff}`,
    });
  }

  // 2. Arsch der Schande - all players tied for last
  const last = sorted[sorted.length - 1];
  const lastWins = last.wins;
  const lastDiff = diff(last);
  // Only if different from winners
  if (lastWins !== topWins || lastDiff !== topDiff) {
    const losers = sorted.filter((p) => p.wins === lastWins && diff(p) === lastDiff);
    for (const l of losers) {
      badges.push({
        player_id: l.player_id,
        badge_type: "last_place",
        badge_label: "Arsch der Schande",
        badge_value: `${l.wins} Siege, Diff ${lastDiff >= 0 ? "+" : ""}${lastDiff}`,
      });
    }
  }

  // 3. Höchster Sieg - largest point difference in a completed match
  const completedMatches = matches.filter((m) => m.status === "completed" && m.player1_score !== null && m.player2_score !== null);
  if (completedMatches.length > 0) {
    const diffs = completedMatches.map((m) => Math.abs(m.player1_score! - m.player2_score!));
    const maxMatchDiff = Math.max(...diffs);
    if (maxMatchDiff > 0) {
      const bestMatches = completedMatches.filter(
        (m) => Math.abs(m.player1_score! - m.player2_score!) === maxMatchDiff
      );
      const addedPlayers = new Set<string>();
      for (const m of bestMatches) {
        const winnerId = m.winner_id!;
        if (addedPlayers.has(winnerId)) continue;
        addedPlayers.add(winnerId);
        const winnerScore = m.player1_id === winnerId ? m.player1_score! : m.player2_score!;
        const loserScore = m.player1_id === winnerId ? m.player2_score! : m.player1_score!;
        const loserId = m.player1_id === winnerId ? m.player2_id : m.player1_id;
        badges.push({
          player_id: winnerId,
          badge_type: "highest_win",
          badge_label: "Höchster Sieg",
          badge_value: `${winnerScore}:${loserScore} vs ${playerNames[loserId] || "?"}`,
        });
      }
    }
  }

  // 4. ELO-Rakete - highest elo_change
  const maxElo = Math.max(...tournamentPlayers.map((p) => p.elo_change));
  if (maxElo > 0) {
    const bestElo = tournamentPlayers.filter((p) => p.elo_change === maxElo);
    for (const p of bestElo) {
      badges.push({
        player_id: p.player_id,
        badge_type: "best_elo",
        badge_label: "ELO-Rakete",
        badge_value: `+${maxElo} ELO`,
      });
    }
  }

  // 5. Punktemaschine - most points_for
  const maxPoints = Math.max(...tournamentPlayers.map((p) => p.points_for));
  if (maxPoints > 0) {
    const bestPoints = tournamentPlayers.filter((p) => p.points_for === maxPoints);
    for (const p of bestPoints) {
      badges.push({
        player_id: p.player_id,
        badge_type: "most_points",
        badge_label: "Punktemaschine",
        badge_value: `${maxPoints} Punkte`,
      });
    }
  }

  // 6. Mauer - fewest points_against (min 1 game played)
  const withGames = tournamentPlayers.filter((p) => p.games_played > 0);
  if (withGames.length > 0) {
    const minAgainst = Math.min(...withGames.map((p) => p.points_against));
    const bestDefense = withGames.filter((p) => p.points_against === minAgainst);
    for (const p of bestDefense) {
      badges.push({
        player_id: p.player_id,
        badge_type: "best_defense",
        badge_label: "Mauer",
        badge_value: `${minAgainst} Gegenpunkte`,
      });
    }
  }

  return badges;
}
