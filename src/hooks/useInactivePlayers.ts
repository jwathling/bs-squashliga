import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useInactivePlayers() {
  return useQuery({
    queryKey: ["inactive-players"],
    queryFn: async () => {
      // 1. Get last 5 completed tournaments
      const { data: tournaments, error: tError } = await supabase
        .from("tournaments")
        .select("id")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(5);

      if (tError) throw tError;
      if (!tournaments || tournaments.length === 0) {
        return new Set<string>();
      }

      const tournamentIds = tournaments.map((t) => t.id);

      // 2. Get all participants from those tournaments
      const { data: participants, error: pError } = await supabase
        .from("tournament_players")
        .select("player_id")
        .in("tournament_id", tournamentIds);

      if (pError) throw pError;

      // 3. Build active set
      const activeSet = new Set(participants?.map((p) => p.player_id) ?? []);

      // 4. Get all players to determine inactive ones
      const { data: allPlayers, error: aError } = await supabase
        .from("players")
        .select("id");

      if (aError) throw aError;

      const inactiveSet = new Set<string>();
      for (const player of allPlayers ?? []) {
        if (!activeSet.has(player.id)) {
          inactiveSet.add(player.id);
        }
      }

      return inactiveSet;
    },
  });
}
