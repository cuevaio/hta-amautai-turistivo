ALTER TABLE game_rooms ADD COLUMN name TEXT CHECK(name IS NULL OR (length(trim(name)) BETWEEN 1 AND 80));
