import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HeadToHeadStats {
  opponentId: string;
  opponentName: string;
  opponentElo: number;
  totalGames: number;
  playerWins: number;
  opponentWins: number;
  playerPoints: number;
  opponentPoints: number;
}

export interface HeadToHeadMatch {
  id: string;
  player1_id: string;
  player2_id: string;
  player1_score: number;
  player2_score: number;
  winner_id: string;
  played_at: string;
  tournament_id: string;
}

export function usePlayerOpponents(playerId: string | undefined) {
  return useQuery({
    queryKey: ["player_opponents", playerId],
    queryFn: async () => {
      if (!playerId) return [];

      // Fetch all completed matches where this player participated
      const { data: matches, error } = await supabase
        .from("matches")
        .select(`
          id,
          player1_id,
          player2_id,
          player1_score,
          player2_score,
          winner_id,
          played_at,
          tournament_id
        `)
        .eq("status", "completed")
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`);

      if (error) throw error;
      if (!matches || matches.length === 0) return [];

      // Get unique opponent IDs
      const opponentIds = new Set<string>();
      matches.forEach((match) => {
        if (match.player1_id === playerId) {
          opponentIds.add(match.player2_id);
        } else {
          opponentIds.add(match.player1_id);
        }
      });

      // Fetch opponent details
      const { data: opponents, error: opponentsError } = await supabase
        .from("players")
        .select("id, name, elo")
        .in("id", Array.from(opponentIds));

      if (opponentsError) throw opponentsError;

      // Calculate head-to-head stats for each opponent
      const statsMap = new Map<string, HeadToHeadStats>();

      opponents?.forEach((opponent) => {
        statsMap.set(opponent.id, {
          opponentId: opponent.id,
          opponentName: opponent.name,
          opponentElo: opponent.elo,
          totalGames: 0,
          playerWins: 0,
          opponentWins: 0,
          playerPoints: 0,
          opponentPoints: 0,
        });
      });

      matches.forEach((match) => {
        const opponentId = match.player1_id === playerId ? match.player2_id : match.player1_id;
        const stats = statsMap.get(opponentId);
        if (!stats) return;

        stats.totalGames++;

        const isPlayer1 = match.player1_id === playerId;
        const playerScore = isPlayer1 ? match.player1_score : match.player2_score;
        const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;

        stats.playerPoints += playerScore ?? 0;
        stats.opponentPoints += opponentScore ?? 0;

        if (match.winner_id === playerId) {
          stats.playerWins++;
        } else {
          stats.opponentWins++;
        }
      });

      // Sort by total games (most played first)
      return Array.from(statsMap.values()).sort((a, b) => b.totalGames - a.totalGames);
    },
    enabled: !!playerId,
  });
}

export function useHeadToHead(playerId: string | undefined, opponentId: string | undefined) {
  return useQuery({
    queryKey: ["head_to_head", playerId, opponentId],
    queryFn: async () => {
      if (!playerId || !opponentId) return null;

      const { data: matches, error } = await supabase
        .from("matches")
        .select(`
          id,
          player1_id,
          player2_id,
          player1_score,
          player2_score,
          winner_id,
          played_at,
          tournament_id
        `)
        .eq("status", "completed")
        .or(
          `and(player1_id.eq.${playerId},player2_id.eq.${opponentId}),and(player1_id.eq.${opponentId},player2_id.eq.${playerId})`
        )
        .order("played_at", { ascending: false });

      if (error) throw error;
      return matches as HeadToHeadMatch[];
    },
    enabled: !!playerId && !!opponentId,
  });
}
