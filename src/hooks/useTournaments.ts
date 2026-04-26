import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Tournament {
  id: string;
  name: string;
  status: "planned" | "active" | "completed";
  current_round: number;
  created_at: string;
  completed_at: string | null;
  scheduled_date: string;
}

export interface TournamentPlayer {
  id: string;
  tournament_id: string;
  player_id: string;
  games_played: number;
  wins: number;
  points_for: number;
  points_against: number;
  elo_at_start: number;
  elo_change: number;
  player?: {
    id: string;
    name: string;
    elo: number;
  };
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  match_order: number;
  player1_id: string;
  player2_id: string;
  player1_score: number | null;
  player2_score: number | null;
  winner_id: string | null;
  status: "pending" | "completed" | "discarded";
  played_at: string | null;
  created_at: string;
  player1?: {
    id: string;
    name: string;
    elo: number;
  };
  player2?: {
    id: string;
    name: string;
    elo: number;
  };
}

export function useTournaments() {
  return useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Tournament[];
    },
  });
}

export function useTournament(id: string | undefined) {
  return useQuery({
    queryKey: ["tournaments", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Tournament | null;
    },
    enabled: !!id,
  });
}

export function useTournamentPlayers(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ["tournament_players", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      const { data, error } = await supabase
        .from("tournament_players")
        .select(`
          *,
          player:players(id, name, elo)
        `)
        .eq("tournament_id", tournamentId);

      if (error) throw error;
      return data as TournamentPlayer[];
    },
    enabled: !!tournamentId,
  });
}

export function useTournamentMatches(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ["matches", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          player1:players!matches_player1_id_fkey(id, name, elo),
          player2:players!matches_player2_id_fkey(id, name, elo)
        `)
        .eq("tournament_id", tournamentId)
        .order("match_order", { ascending: true });

      if (error) throw error;
      return data as Match[];
    },
    enabled: !!tournamentId,
  });
}

export function usePlayerTournaments(playerId: string | undefined) {
  return useQuery({
    queryKey: ["player_tournaments", playerId],
    queryFn: async () => {
      if (!playerId) return [];
      const { data, error } = await supabase
        .from("tournament_players")
        .select(`
          *,
          tournament:tournaments(*)
        `)
        .eq("player_id", playerId)
        .order("id", { ascending: false });

      if (error) throw error;
      return data as (TournamentPlayer & { tournament: Tournament })[];
    },
    enabled: !!playerId,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      playerIds,
      scheduledDate,
    }: {
      name: string;
      playerIds: string[];
      scheduledDate: string;
    }) => {
      // Create tournament with status 'planned' (no matches yet)
      const { data: tournament, error: tournamentError } = await supabase
        .from("tournaments")
        .insert({ name, scheduled_date: scheduledDate, status: "planned" })
        .select()
        .single();

      if (tournamentError) throw tournamentError;

      // Get players to store their current ELO
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, elo")
        .in("id", playerIds);

      if (playersError) throw playersError;

      // Add players to tournament with their starting ELO
      const tournamentPlayers = playerIds.map((playerId) => {
        const player = players.find((p) => p.id === playerId);
        return {
          tournament_id: tournament.id,
          player_id: playerId,
          elo_at_start: player?.elo || 1000,
        };
      });

      const { error: tpError } = await supabase
        .from("tournament_players")
        .insert(tournamentPlayers);

      if (tpError) throw tpError;

      // Note: No matches created, no total_tournaments increment
      // These happen when tournament is started

      return tournament as Tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useUpdateTournamentName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tournamentId,
      name,
    }: {
      tournamentId: string;
      name: string;
    }) => {
      const { data, error } = await supabase
        .from("tournaments")
        .update({ name })
        .eq("id", tournamentId)
        .select()
        .single();

      if (error) throw error;
      return data as Tournament;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments", data.id] });
    },
  });
}

export function useUpdateTournamentPlayers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tournamentId,
      playerIds,
    }: {
      tournamentId: string;
      playerIds: string[];
    }) => {
      // Get existing tournament_players to preserve their elo_at_start
      const { data: existingPlayers, error: existingError } = await supabase
        .from("tournament_players")
        .select("player_id, elo_at_start")
        .eq("tournament_id", tournamentId);

      if (existingError) throw existingError;

      const existingMap = new Map(
        (existingPlayers || []).map((ep) => [ep.player_id, ep.elo_at_start])
      );

      // Delete all existing tournament_players (we re-insert below to handle adds/removes)
      const { error: deleteError } = await supabase
        .from("tournament_players")
        .delete()
        .eq("tournament_id", tournamentId);

      if (deleteError) throw deleteError;

      // Get players to store their current ELO (only used for newly added players)
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, elo")
        .in("id", playerIds);

      if (playersError) throw playersError;

      // Add tournament_players: keep existing elo_at_start for players who were
      // already in the tournament; use current ELO only for newly added players.
      // Note: useStartTournament will refresh all values to current ELO at start time.
      const tournamentPlayers = playerIds.map((playerId) => {
        const existingElo = existingMap.get(playerId);
        const player = players.find((p) => p.id === playerId);
        return {
          tournament_id: tournamentId,
          player_id: playerId,
          elo_at_start: existingElo ?? player?.elo ?? 1000,
        };
      });

      const { error: insertError } = await supabase
        .from("tournament_players")
        .insert(tournamentPlayers);

      if (insertError) throw insertError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tournament_players", variables.tournamentId] });
    },
  });
}

export function useStartTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tournamentId: string) => {
      // 1. Get all tournament players
      const { data: tournamentPlayers, error: tpError } = await supabase
        .from("tournament_players")
        .select("player_id")
        .eq("tournament_id", tournamentId);

      if (tpError) throw tpError;
      if (!tournamentPlayers || tournamentPlayers.length < 2) {
        throw new Error("Mindestens 2 Spieler erforderlich");
      }

      const playerIds = tournamentPlayers.map((tp) => tp.player_id);

      // 2. Refresh elo_at_start for all tournament players to their CURRENT global ELO.
      // This ensures the tournament starts with up-to-date ELO values, even if the
      // tournament was planned earlier and other tournaments were played in between.
      const { data: currentPlayers, error: currentPlayersError } = await supabase
        .from("players")
        .select("id, elo")
        .in("id", playerIds);

      if (currentPlayersError) throw currentPlayersError;

      await Promise.all(
        (currentPlayers || []).map((p) =>
          supabase
            .from("tournament_players")
            .update({ elo_at_start: p.elo })
            .eq("tournament_id", tournamentId)
            .eq("player_id", p.id)
        )
      );

      // 3. Generate round-robin matches (imported from matchScheduler)
      const { generateRoundSchedule } = await import("@/lib/matchScheduler");
      const matches = generateRoundSchedule(playerIds, 1);

      // 3. Create matches
      const matchesData = matches.map((m) => ({
        tournament_id: tournamentId,
        player1_id: m.player1Id,
        player2_id: m.player2Id,
        match_order: m.matchOrder,
        round: m.round,
      }));

      const { error: matchesError } = await supabase
        .from("matches")
        .insert(matchesData);

      if (matchesError) throw matchesError;

      // 4. Increment total_tournaments for each player
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, total_tournaments")
        .in("id", playerIds);

      if (playersError) throw playersError;

      for (const player of players) {
        await supabase
          .from("players")
          .update({ total_tournaments: (player.total_tournaments || 0) + 1 })
          .eq("id", player.id);
      }

      // 5. Set status to 'active'
      const { data: tournament, error: updateError } = await supabase
        .from("tournaments")
        .update({ status: "active" })
        .eq("id", tournamentId)
        .select()
        .single();

      if (updateError) throw updateError;

      return tournament as Tournament;
    },
    onSuccess: (_, tournamentId) => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["matches", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}

export function useAddRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tournamentId,
      matches,
      newRound,
    }: {
      tournamentId: string;
      matches: Array<{ player1Id: string; player2Id: string; matchOrder: number; round: number }>;
      newRound: number;
    }) => {
      // Update tournament round
      const { error: updateError } = await supabase
        .from("tournaments")
        .update({ current_round: newRound })
        .eq("id", tournamentId);

      if (updateError) throw updateError;

      // Create new matches
      const matchesData = matches.map((m) => ({
        tournament_id: tournamentId,
        player1_id: m.player1Id,
        player2_id: m.player2Id,
        match_order: m.matchOrder,
        round: m.round,
      }));

      const { error: matchesError } = await supabase
        .from("matches")
        .insert(matchesData);

      if (matchesError) throw matchesError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tournaments", variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["matches", variables.tournamentId] });
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      player1Score,
      player2Score,
      winnerId,
    }: {
      matchId: string;
      player1Score: number;
      player2Score: number;
      winnerId: string;
    }) => {
      const { data, error } = await supabase
        .from("matches")
        .update({
          player1_score: player1Score,
          player2_score: player2Score,
          winner_id: winnerId,
          status: "completed",
          played_at: new Date().toISOString(),
        })
        .eq("id", matchId)
        .select()
        .single();

      if (error) throw error;
      return data as Match;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["matches", data.tournament_id] });
      queryClient.invalidateQueries({ queryKey: ["tournament_players", data.tournament_id] });
    },
  });
}

export function useUpdateTournamentPlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tournamentId,
      playerId,
      games_played,
      wins,
      points_for,
      points_against,
      elo_change,
    }: {
      tournamentId: string;
      playerId: string;
      games_played: number;
      wins: number;
      points_for: number;
      points_against: number;
      elo_change: number;
    }) => {
      const { data, error } = await supabase
        .from("tournament_players")
        .update({
          games_played,
          wins,
          points_for,
          points_against,
          elo_change,
        })
        .eq("tournament_id", tournamentId)
        .eq("player_id", playerId)
        .select()
        .single();

      if (error) throw error;
      return data as TournamentPlayer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tournament_players", data.tournament_id] });
    },
  });
}

export function useCompleteTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: string | { tournamentId: string; discardRound?: number }
    ) => {
      const tournamentId = typeof input === "string" ? input : input.tournamentId;
      const discardRound = typeof input === "string" ? undefined : input.discardRound;

      // Optional: alle Matches der angegebenen Runde verwerfen und Stats zurückrechnen
      if (discardRound !== undefined) {
        // 1. Alle Matches der Runde holen
        const { data: roundMatches, error: roundError } = await supabase
          .from("matches")
          .select("*")
          .eq("tournament_id", tournamentId)
          .eq("round", discardRound);

        if (roundError) throw roundError;

        const completedMatches = (roundMatches || []).filter(
          (m) => m.status === "completed"
        );

        if (completedMatches.length > 0) {
          // 2. Tournament-Player-Stats zurückrechnen
          const { data: tps, error: tpsError } = await supabase
            .from("tournament_players")
            .select("*")
            .eq("tournament_id", tournamentId);
          if (tpsError) throw tpsError;

          const tpMap = new Map(tps?.map((tp) => [tp.player_id, { ...tp }]) || []);

          for (const m of completedMatches) {
            const tp1 = tpMap.get(m.player1_id);
            const tp2 = tpMap.get(m.player2_id);
            if (!tp1 || !tp2) continue;

            // ELO-Änderung dieses Matches berechnen (basierend auf Tournament-ELO VOR diesem Match)
            // Wir rechnen rückwärts: aktueller Tournament-ELO minus alle anderen Matches.
            // Vereinfachung: wir nutzen die finalen Tournament-ELOs und ziehen die Match-ELO-Änderung ab.
            // Dafür berechnen wir die ELO-Änderung mit den aktuellen Tournament-ELOs (Approximation).
            const { calculateMatchEloChanges } = await import("@/lib/elo");
            const p1Elo = tp1.elo_at_start + tp1.elo_change;
            const p2Elo = tp2.elo_at_start + tp2.elo_change;
            // Reverse: berechne, was die Änderung war, indem wir mit den ELOs VOR diesem Match rechnen
            // Approximation: wir nutzen die aktuellen ELOs minus die zu erwartende Änderung
            const changes = calculateMatchEloChanges(
              p1Elo - 0,
              p2Elo - 0,
              m.player1_score!,
              m.player2_score!
            );

            tp1.games_played -= 1;
            tp2.games_played -= 1;
            tp1.points_for -= m.player1_score!;
            tp1.points_against -= m.player2_score!;
            tp2.points_for -= m.player2_score!;
            tp2.points_against -= m.player1_score!;
            if (m.winner_id === m.player1_id) tp1.wins -= 1;
            else if (m.winner_id === m.player2_id) tp2.wins -= 1;
            tp1.elo_change -= changes.player1.change;
            tp2.elo_change -= changes.player2.change;
          }

          // 3. Tournament-Player-Stats updaten
          for (const tp of tpMap.values()) {
            await supabase
              .from("tournament_players")
              .update({
                games_played: tp.games_played,
                wins: tp.wins,
                points_for: tp.points_for,
                points_against: tp.points_against,
                elo_change: tp.elo_change,
              })
              .eq("tournament_id", tournamentId)
              .eq("player_id", tp.player_id);
          }

          // 4. Globale Player-Stats korrigieren
          const playerIds = Array.from(tpMap.keys());
          const { data: players, error: playersError } = await supabase
            .from("players")
            .select("id, elo, total_games, total_wins")
            .in("id", playerIds);
          if (playersError) throw playersError;

          // Aufsummieren pro Spieler: wieviele Games/Wins waren in dieser Runde?
          const perPlayerDelta = new Map<
            string,
            { gamesDelta: number; winsDelta: number; eloDelta: number }
          >();
          for (const m of completedMatches) {
            for (const pid of [m.player1_id, m.player2_id]) {
              const cur = perPlayerDelta.get(pid) || {
                gamesDelta: 0,
                winsDelta: 0,
                eloDelta: 0,
              };
              cur.gamesDelta += 1;
              if (m.winner_id === pid) cur.winsDelta += 1;
              perPlayerDelta.set(pid, cur);
            }
          }

          // Für die ELO-Korrektur: nimm die Differenz aus alter und neuer tp.elo_change
          // Globale ELO = elo_at_start + tp.elo_change (laut bestehender Logik)
          for (const player of players || []) {
            const tpNew = tpMap.get(player.id);
            const tpOld = tps?.find((t) => t.player_id === player.id);
            if (!tpNew || !tpOld) continue;
            const eloChangeDelta = tpOld.elo_change - tpNew.elo_change;
            const delta = perPlayerDelta.get(player.id) || {
              gamesDelta: 0,
              winsDelta: 0,
              eloDelta: 0,
            };
            await supabase
              .from("players")
              .update({
                elo: player.elo - eloChangeDelta,
                total_games: Math.max(0, player.total_games - delta.gamesDelta),
                total_wins: Math.max(0, player.total_wins - delta.winsDelta),
              })
              .eq("id", player.id);
          }
        }

        // 5. Alle Matches der Runde auf 'discarded' setzen
        await supabase
          .from("matches")
          .update({ status: "discarded" })
          .eq("tournament_id", tournamentId)
          .eq("round", discardRound);
      }

      const { data, error } = await supabase
        .from("tournaments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", tournamentId)
        .select()
        .single();

      if (error) throw error;
      return data as Tournament;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments", data.id] });
      queryClient.invalidateQueries({ queryKey: ["matches", data.id] });
      queryClient.invalidateQueries({ queryKey: ["tournament_players", data.id] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}

export function useUpdateTournamentDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tournamentId,
      scheduledDate,
    }: {
      tournamentId: string;
      scheduledDate: string;
    }) => {
      const { data, error } = await supabase
        .from("tournaments")
        .update({ scheduled_date: scheduledDate })
        .eq("id", tournamentId)
        .select()
        .single();

      if (error) throw error;
      return data as Tournament;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments", data.id] });
    },
  });
}

export function useDeleteTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tournamentId: string) => {
      // 1. Hole alle Tournament-Players mit ihren Statistiken
      const { data: tournamentPlayers, error: tpError } = await supabase
        .from("tournament_players")
        .select("player_id, games_played, wins, elo_change")
        .eq("tournament_id", tournamentId);

      if (tpError) throw tpError;

      // 2. Korrigiere Spielerstatistiken für jeden Spieler
      for (const tp of tournamentPlayers || []) {
        const { data: player } = await supabase
          .from("players")
          .select("elo, total_games, total_wins, total_tournaments")
          .eq("id", tp.player_id)
          .single();

        if (player) {
          await supabase
            .from("players")
            .update({
              elo: player.elo - tp.elo_change,
              total_games: Math.max(0, player.total_games - tp.games_played),
              total_wins: Math.max(0, player.total_wins - tp.wins),
              total_tournaments: Math.max(0, player.total_tournaments - 1),
            })
            .eq("id", tp.player_id);
        }
      }

      // 3. Lösche das Turnier (CASCADE löscht Matches und Tournament-Players automatisch)
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", tournamentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}
