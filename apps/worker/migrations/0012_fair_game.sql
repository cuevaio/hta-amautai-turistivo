-- Preserve room IDs, participants and existing game states while expanding the kind constraint.
ALTER TABLE game_rooms RENAME COLUMN kind TO previous_kind;
ALTER TABLE game_rooms ADD COLUMN kind TEXT NOT NULL DEFAULT 'cargo' CHECK(kind IN ('cargo','market','nursery','fair'));
UPDATE game_rooms SET kind=previous_kind;
ALTER TABLE game_rooms DROP COLUMN previous_kind;
ALTER TABLE game_participants ADD COLUMN fair_state TEXT;
