CREATE TABLE game_rooms (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL,
  region TEXT NOT NULL CHECK(region IN ('coast','highlands','jungle')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX game_rooms_owner ON game_rooms(tenant_id,user_id,created_at DESC);
CREATE TABLE game_participants (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  solved INTEGER NOT NULL DEFAULT 0 CHECK(solved BETWEEN 0 AND 5),
  started INTEGER NOT NULL DEFAULT 0 CHECK(started IN (0,1)),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE(room_id,name_key)
);
