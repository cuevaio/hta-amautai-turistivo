CREATE TABLE game_participants_v2 (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  solved INTEGER NOT NULL DEFAULT 0 CHECK(solved>=0),
  started INTEGER NOT NULL DEFAULT 0 CHECK(started IN (0,1)),
  version INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL DEFAULT 0,
  caught INTEGER NOT NULL DEFAULT 0 CHECK(caught BETWEEN 0 AND 10),
  mistakes INTEGER NOT NULL DEFAULT 0 CHECK(mistakes BETWEEN 0 AND 3),
  paused INTEGER NOT NULL DEFAULT 0 CHECK(paused IN (0,1)),
  active_ms INTEGER NOT NULL DEFAULT 0,
  last_event_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE(room_id,name_key)
);
INSERT INTO game_participants_v2 SELECT id,room_id,name,name_key,solved,started,version,score,caught,mistakes,paused,active_ms,last_event_at FROM game_participants;
DROP TABLE game_participants;
ALTER TABLE game_participants_v2 RENAME TO game_participants;
