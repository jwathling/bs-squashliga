-- Drop existing check constraint and add new one with 'planned' status
ALTER TABLE public.tournaments 
DROP CONSTRAINT IF EXISTS tournaments_status_check;

ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('planned', 'active', 'completed'));