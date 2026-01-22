-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  elo INTEGER NOT NULL DEFAULT 1000,
  total_games INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_tournaments INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  current_round INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create tournament_players junction table (many-to-many)
CREATE TABLE public.tournament_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  points_for INTEGER NOT NULL DEFAULT 0,
  points_against INTEGER NOT NULL DEFAULT 0,
  elo_at_start INTEGER NOT NULL DEFAULT 1000,
  elo_change INTEGER NOT NULL DEFAULT 0,
  UNIQUE(tournament_id, player_id)
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL DEFAULT 1,
  match_order INTEGER NOT NULL,
  player1_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player1_score INTEGER,
  player2_score INTEGER,
  winner_id UUID REFERENCES public.players(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (but allow all access since no auth)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (single user, no auth required)
CREATE POLICY "Allow all access to players" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to tournaments" ON public.tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to tournament_players" ON public.tournament_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for players table
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;