CREATE TABLE notification_preferences (
 tenant_id TEXT NOT NULL REFERENCES tenants(id), user_id TEXT NOT NULL,
 event_type TEXT NOT NULL CHECK(event_type IN ('task_assigned','task_due','new_message')),
 channel TEXT NOT NULL CHECK(channel IN ('email','whatsapp','both','none')),
 PRIMARY KEY(tenant_id,user_id,event_type)
);
ALTER TABLE notifications ADD COLUMN event_type TEXT;
ALTER TABLE email_notifications ADD COLUMN event_type TEXT;
-- Retire the old manual notification workflow without deleting delivery evidence.
UPDATE notifications SET status='cancelled',body='' WHERE status IN ('pending','dispatching') AND event_type IS NULL;
UPDATE email_notifications SET status='cancelled',body='' WHERE status IN ('pending','dispatching') AND event_type IS NULL;
