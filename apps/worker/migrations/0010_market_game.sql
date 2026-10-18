ALTER TABLE game_rooms ADD COLUMN kind TEXT NOT NULL DEFAULT 'cargo' CHECK(kind IN ('cargo','market'));
ALTER TABLE game_rooms ADD COLUMN mode TEXT NOT NULL DEFAULT 'challenge' CHECK(mode IN ('practice','challenge'));
ALTER TABLE game_participants ADD COLUMN market_state TEXT;
