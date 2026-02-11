import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculateTournamentBadges } from "@/lib/badges";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useBackfillBadges() {
  const [isRunning, setIsRunning] = useState(false);
  const queryClient = useQueryClient();

  const backfill = async () => {
    setIsRunning(true);
    try {
      // Get all completed tournaments
      const { data: tournaments, error: tErr } = await supabase
        .from("tournaments")
        .select("id, name")
        .eq("status", "completed");

      if (tErr) throw tErr;
      if (!tournaments || tournaments.length === 0) {
        toast.info("Keine abgeschlossenen Turniere gefunden.");
        return;
      }

      let awarded = 0;

      for (const tournament of tournaments) {
        // Check if badges already exist
        const { data: existing } = await supabase
          .from("player_badges" as any)
          .select("id")
          .eq("tournament_id", tournament.id)
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Fetch tournament players
        const { data: tPlayers } = await supabase
          .from("tournament_players")
          .select("*, player:players(id, name, elo)")
          .eq("tournament_id", tournament.id);

        if (!tPlayers || tPlayers.length === 0) continue;

        // Fetch matches
        const { data: matches } = await supabase
          .from("matches")
          .select("*, player1:players!matches_player1_id_fkey(id, name, elo), player2:players!matches_player2_id_fkey(id, name, elo)")
          .eq("tournament_id", tournament.id)
          .order("match_order", { ascending: true });

        if (!matches) continue;

        // Build player name map
        const playerNames: Record<string, string> = {};
        for (const tp of tPlayers) {
          if (tp.player) playerNames[tp.player.id] = tp.player.name;
        }

        // Calculate badges
        const badges = calculateTournamentBadges(matches as any, tPlayers as any, playerNames);

        if (badges.length > 0) {
          const rows = badges.map((b) => ({
            player_id: b.player_id,
            tournament_id: tournament.id,
            badge_type: b.badge_type,
            badge_label: b.badge_label,
            badge_value: b.badge_value,
          }));

          const { error } = await supabase
            .from("player_badges" as any)
            .insert(rows);

          if (error) {
            console.error(`Error awarding badges for ${tournament.name}:`, error);
            continue;
          }
          awarded++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["tournament_badges"] });
      queryClient.invalidateQueries({ queryKey: ["player_badges"] });

      if (awarded > 0) {
        toast.success(`Badges für ${awarded} Turnier(e) nachgetragen!`);
      } else {
        toast.info("Alle Turniere haben bereits Badges.");
      }
    } catch (error) {
      console.error("Backfill error:", error);
      toast.error("Fehler beim Nachtragen der Badges.");
    } finally {
      setIsRunning(false);
    }
  };

  return { backfill, isRunning };
}
