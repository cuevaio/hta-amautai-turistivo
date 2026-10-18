-- Expand the game-kind constraint without replacing room IDs or child relationships.
ALTER TABLE game_rooms RENAME COLUMN kind TO previous_kind;
ALTER TABLE game_rooms ADD COLUMN kind TEXT NOT NULL DEFAULT 'cargo' CHECK(kind IN ('cargo','market','nursery'));
UPDATE game_rooms SET kind=previous_kind;
ALTER TABLE game_rooms DROP COLUMN previous_kind;
ALTER TABLE game_participants ADD COLUMN nursery_state TEXT;
