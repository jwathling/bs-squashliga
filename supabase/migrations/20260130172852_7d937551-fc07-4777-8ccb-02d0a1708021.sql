-- Add scheduled_date column to tournaments table
ALTER TABLE tournaments
ADD COLUMN scheduled_date date NOT NULL DEFAULT CURRENT_DATE;