CREATE TABLE notification_contacts (
 tenant_id TEXT NOT NULL REFERENCES tenants(id), user_id TEXT NOT NULL,
 phone TEXT, verified_at INTEGER, enabled INTEGER NOT NULL DEFAULT 0,
 timezone TEXT NOT NULL DEFAULT 'America/Lima', consent_at INTEGER,
 challenge_id TEXT, challenge_hash TEXT, challenge_expires INTEGER,
 challenge_attempts INTEGER NOT NULL DEFAULT 0, requested_at INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(tenant_id,user_id)
);
CREATE TABLE notifications (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), user_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('verification','reminder','test')),
 phone TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','dispatching','accepted','sent','delivered','read','failed','expired','cancelled','uncertain')),
 scheduled_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0, next_attempt INTEGER NOT NULL,
 lease_until INTEGER NOT NULL DEFAULT 0, last_error TEXT, provider_id TEXT,
 request_key TEXT NOT NULL, UNIQUE(tenant_id,user_id,request_key)
);
CREATE INDEX notifications_due ON notifications(status,next_attempt,lease_until);
CREATE INDEX notifications_owner ON notifications(tenant_id,user_id,created_at DESC);
CREATE INDEX notifications_phone ON notifications(phone,created_at);
