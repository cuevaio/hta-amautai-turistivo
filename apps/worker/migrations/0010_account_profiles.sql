CREATE TABLE account_profiles (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('teacher','parent')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (tenant_id,user_id)
);

INSERT INTO account_profiles(tenant_id,user_id,role)
SELECT tenant_id,user_id,'teacher' FROM teacher_profiles WHERE 1
ON CONFLICT(tenant_id,user_id) DO NOTHING;
