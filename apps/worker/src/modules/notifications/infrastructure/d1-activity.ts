import type { ActivityPreferences } from "../application/activity-service.ts"
import type { ActivityPreference } from "../domain/activity.ts"
export function d1Activity(db: D1Database): ActivityPreferences {
  return {
    async list(a) {
      return (
        await db
          .prepare(
            "SELECT event_type AS type,channel FROM notification_preferences WHERE tenant_id=? AND user_id=?"
          )
          .bind(a.tenantId, a.userId)
          .all<ActivityPreference>()
      ).results
    },
    async save(a, type, channel) {
      await db.batch([
        db
          .prepare(
            "INSERT INTO notification_preferences(tenant_id,user_id,event_type,channel) VALUES(?,?,?,?) ON CONFLICT(tenant_id,user_id,event_type) DO UPDATE SET channel=excluded.channel"
          )
          .bind(a.tenantId, a.userId, type, channel),
        db
          .prepare(
            "UPDATE notifications SET status='cancelled',body='' WHERE tenant_id=? AND user_id=? AND event_type=? AND status IN ('pending','dispatching') AND ? NOT IN ('whatsapp','both')"
          )
          .bind(a.tenantId, a.userId, type, channel),
        db
          .prepare(
            "UPDATE email_notifications SET status='cancelled',body='' WHERE tenant_id=? AND user_id=? AND event_type=? AND status IN ('pending','dispatching') AND ? NOT IN ('email','both')"
          )
          .bind(a.tenantId, a.userId, type, channel),
        db
          .prepare(
            "UPDATE notification_contacts SET enabled=1 WHERE tenant_id=? AND user_id=? AND ? IN ('whatsapp','both') AND consent_at IS NOT NULL"
          )
          .bind(a.tenantId, a.userId, channel),
        db
          .prepare(
            "UPDATE email_contacts SET enabled=1,opted_out=0 WHERE tenant_id=? AND user_id=? AND ? IN ('email','both') AND verified_at IS NOT NULL"
          )
          .bind(a.tenantId, a.userId, channel),
      ])
    },
  }
}
