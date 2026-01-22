import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Player {
  id: string;
  name: string;
  elo: number;
  total_games: number;
  total_wins: number;
  total_tournaments: number;
  created_at: string;
  updated_at: string;
}

export function usePlayers() {
  return useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("elo", { ascending: false });

      if (error) throw error;
      return data as Player[];
    },
  });
}

export function usePlayer(id: string | undefined) {
  return useQuery({
    queryKey: ["players", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Player | null;
    },
    enabled: !!id,
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("players")
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      return data as Player;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from("players")
        .update({ name })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Player;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["players", data.id] });
    },
  });
}

export function useUpdatePlayerStats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      elo,
      total_games,
      total_wins,
      total_tournaments,
    }: {
      id: string;
      elo: number;
      total_games: number;
      total_wins: number;
      total_tournaments?: number;
    }) => {
      const updateData: Partial<Player> = {
        elo,
        total_games,
        total_wins,
      };

      if (total_tournaments !== undefined) {
        updateData.total_tournaments = total_tournaments;
      }

      const { data, error } = await supabase
        .from("players")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Player;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["players", data.id] });
    },
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("players").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}
