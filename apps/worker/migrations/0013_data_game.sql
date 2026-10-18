-- Preserve all existing rooms and student attempts while adding the data game.
ALTER TABLE game_rooms RENAME COLUMN kind TO previous_kind;
ALTER TABLE game_rooms ADD COLUMN kind TEXT NOT NULL DEFAULT 'cargo' CHECK(kind IN ('cargo','market','nursery','fair','data'));
UPDATE game_rooms SET kind=previous_kind;
ALTER TABLE game_rooms DROP COLUMN previous_kind;
ALTER TABLE game_participants ADD COLUMN data_state TEXT;
