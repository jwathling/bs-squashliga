-- Bestehende Constraints droppen (falls vorhanden) und mit CASCADE neu erstellen

-- matches → tournaments
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_tournament_id_fkey;
ALTER TABLE matches 
ADD CONSTRAINT matches_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

-- tournament_players → tournaments
ALTER TABLE tournament_players DROP CONSTRAINT IF EXISTS tournament_players_tournament_id_fkey;
ALTER TABLE tournament_players 
ADD CONSTRAINT tournament_players_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

-- tournament_players → players
ALTER TABLE tournament_players DROP CONSTRAINT IF EXISTS tournament_players_player_id_fkey;
ALTER TABLE tournament_players 
ADD CONSTRAINT tournament_players_player_id_fkey 
FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- matches → players (player1)
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_player1_id_fkey;
ALTER TABLE matches 
ADD CONSTRAINT matches_player1_id_fkey 
FOREIGN KEY (player1_id) REFERENCES players(id) ON DELETE CASCADE;

-- matches → players (player2)
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_player2_id_fkey;
ALTER TABLE matches 
ADD CONSTRAINT matches_player2_id_fkey 
FOREIGN KEY (player2_id) REFERENCES players(id) ON DELETE CASCADE;