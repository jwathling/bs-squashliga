import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Tournament {
  id: string;
  name: string;
  status: "active" | "completed";
  current_round: number;
  created_at: string;
  completed_at: string | null;
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
  status: "pending" | "completed";
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
      matches,
    }: {
      name: string;
      playerIds: string[];
      matches: Array<{ player1Id: string; player2Id: string; matchOrder: number; round: number }>;
    }) => {
      // Create tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from("tournaments")
        .insert({ name })
        .select()
        .single();

      if (tournamentError) throw tournamentError;

      // Get players to store their current ELO
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, elo, total_tournaments")
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

      // Update total_tournaments for each player
      for (const player of players) {
        await supabase
          .from("players")
          .update({ total_tournaments: (player.total_tournaments || 0) + 1 })
          .eq("id", player.id);
      }

      // Create matches
      const matchesData = matches.map((m) => ({
        tournament_id: tournament.id,
        player1_id: m.player1Id,
        player2_id: m.player2Id,
        match_order: m.matchOrder,
        round: m.round,
      }));

      const { error: matchesError } = await supabase
        .from("matches")
        .insert(matchesData);

      if (matchesError) throw matchesError;

      return tournament as Tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
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
    mutationFn: async (tournamentId: string) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}
