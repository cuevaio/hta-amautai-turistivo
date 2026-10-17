CREATE TABLE email_contacts (
 tenant_id TEXT NOT NULL REFERENCES tenants(id), user_id TEXT NOT NULL, email TEXT NOT NULL,
 enabled INTEGER NOT NULL DEFAULT 0, verified_at INTEGER, consent_at INTEGER NOT NULL,
 challenge_id TEXT, challenge_hash TEXT, challenge_expires INTEGER,
 challenge_attempts INTEGER NOT NULL DEFAULT 0, requested_at INTEGER NOT NULL,
 PRIMARY KEY(tenant_id,user_id)
);
CREATE TABLE email_notifications (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), user_id TEXT NOT NULL,
 email TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('verification','reminder','test')),
 title TEXT NOT NULL, body TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','dispatching','accepted','failed','uncertain','cancelled','expired')),
 scheduled_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0, next_attempt INTEGER NOT NULL, lease_until INTEGER NOT NULL DEFAULT 0,
 last_error TEXT, provider_id TEXT, request_key TEXT NOT NULL, UNIQUE(tenant_id,user_id,request_key)
);
CREATE INDEX email_notifications_due ON email_notifications(status,next_attempt);
CREATE INDEX email_notifications_owner ON email_notifications(tenant_id,user_id,created_at);
CREATE INDEX email_notifications_recipient ON email_notifications(email,created_at);
