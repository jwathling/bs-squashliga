import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CalculatedBadge } from "@/lib/badges";

export interface PlayerBadge {
  id: string;
  player_id: string;
  tournament_id: string;
  badge_type: string;
  badge_label: string;
  badge_value: string | null;
  created_at: string;
  tournament?: {
    id: string;
    name: string;
  };
}

export function usePlayerBadges(playerId: string | undefined) {
  return useQuery({
    queryKey: ["player_badges", playerId],
    queryFn: async () => {
      if (!playerId) return [];
      const { data, error } = await supabase
        .from("player_badges" as any)
        .select(`*, tournament:tournaments(id, name)`)
        .eq("player_id", playerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as PlayerBadge[];
    },
    enabled: !!playerId,
  });
}

export function useTournamentBadges(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ["tournament_badges", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      const { data, error } = await supabase
        .from("player_badges" as any)
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("badge_type", { ascending: true });

      if (error) throw error;
      return data as unknown as PlayerBadge[];
    },
    enabled: !!tournamentId,
  });
}

export function useAwardBadges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tournamentId,
      badges,
    }: {
      tournamentId: string;
      badges: CalculatedBadge[];
    }) => {
      // Delete existing badges for this tournament first (idempotent)
      await supabase
        .from("player_badges" as any)
        .delete()
        .eq("tournament_id", tournamentId);

      if (badges.length === 0) return;

      const rows = badges.map((b) => ({
        player_id: b.player_id,
        tournament_id: tournamentId,
        badge_type: b.badge_type,
        badge_label: b.badge_label,
        badge_value: b.badge_value,
      }));

      const { error } = await supabase
        .from("player_badges" as any)
        .insert(rows);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tournament_badges", variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["player_badges"] });
    },
  });
}
