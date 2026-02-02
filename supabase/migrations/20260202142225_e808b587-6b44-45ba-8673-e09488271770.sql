-- Ändere den Default-Status für neue Turniere auf 'planned'
ALTER TABLE public.tournaments 
ALTER COLUMN status SET DEFAULT 'planned';