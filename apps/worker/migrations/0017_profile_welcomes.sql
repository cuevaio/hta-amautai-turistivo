-- A role registration and its welcome event commit together. No historical backfill.
CREATE TABLE profile_welcomes (
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('teacher','parent')),
  phone TEXT,
  locale TEXT NOT NULL CHECK(locale IN ('es-PE','quy-PE','ay-PE')),
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  PRIMARY KEY(tenant_id,user_id),
  FOREIGN KEY(tenant_id,user_id) REFERENCES account_profiles(tenant_id,user_id)
);
CREATE INDEX profile_welcomes_pending ON profile_welcomes(completed_at,created_at);
