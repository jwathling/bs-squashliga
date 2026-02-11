
CREATE TABLE public.player_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_label TEXT NOT NULL,
  badge_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to player_badges"
ON public.player_badges
FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX idx_player_badges_player_id ON public.player_badges(player_id);
CREATE INDEX idx_player_badges_tournament_id ON public.player_badges(tournament_id);
