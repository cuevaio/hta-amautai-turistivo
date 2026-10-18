-- Family children use aliases; teacher rooms and historical attempts remain intact.
CREATE TABLE family_children (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  region TEXT NOT NULL CHECK(region IN ('coast','highlands','jungle')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(tenant_id,user_id,name_key)
);
ALTER TABLE game_rooms ADD COLUMN family_child_id TEXT REFERENCES family_children(id) ON DELETE CASCADE;
CREATE INDEX game_rooms_family_child ON game_rooms(family_child_id,created_at DESC);
