CREATE TABLE student_assignments (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL UNIQUE REFERENCES game_participants(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  message_body TEXT NOT NULL,
  request_key TEXT NOT NULL,
  delivery_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','dispatching','accepted','sent','delivered','read','failed','expired','cancelled','uncertain')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(tenant_id,user_id,request_key)
);
CREATE INDEX student_assignments_dispatch ON student_assignments(status,next_attempt_at);
