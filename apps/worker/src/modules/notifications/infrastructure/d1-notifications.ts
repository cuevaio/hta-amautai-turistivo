import type { NotificationRepository } from "../application/ports.ts"
import {
  NotificationError,
  type Contact,
  type Notification,
} from "../domain/notification.ts"
const columns = "*,tenant_id AS tenantId,user_id AS userId"
export function d1Notifications(db: D1Database): NotificationRepository {
  return {
    contact: (a) =>
      db
        .prepare(
          "SELECT phone,verified_at,consent_at,enabled,timezone,challenge_expires FROM notification_contacts WHERE tenant_id=? AND user_id=?"
        )
        .bind(a.tenantId, a.userId)
        .first<Contact>(),
    async list(a) {
      return (
        await db
          .prepare(
            "SELECT " +
              columns +
              " FROM notifications WHERE tenant_id=? AND user_id=? ORDER BY created_at DESC LIMIT 50"
          )
          .bind(a.tenantId, a.userId)
          .all<Notification>()
      ).results
    },
    async register(a, phone, now) {
      await db.batch([
        db
          .prepare(
            "INSERT OR IGNORE INTO notification_contacts(tenant_id,user_id) VALUES(?,?)"
          )
          .bind(a.tenantId, a.userId),
        db
          .prepare(
            "UPDATE notifications SET status='cancelled',body='' WHERE tenant_id=? AND user_id=? AND status IN ('pending','dispatching') AND (phone<>? OR kind='verification')"
          )
          .bind(a.tenantId, a.userId, phone),
        db
          .prepare(
            "UPDATE notification_contacts SET phone=?,verified_at=CASE WHEN phone=? THEN verified_at ELSE NULL END,enabled=1,consent_at=?,challenge_id=NULL,challenge_hash=NULL,challenge_expires=NULL,challenge_attempts=0 WHERE tenant_id=? AND user_id=?"
          )
          .bind(phone, phone, now, a.tenantId, a.userId),
      ])
    },
    async preferences(a, enabled, timezone) {
      await db.batch([
        db
          .prepare(
            "UPDATE notification_contacts SET enabled=?,timezone=? WHERE tenant_id=? AND user_id=? AND (?=0 OR (phone IS NOT NULL AND consent_at IS NOT NULL))"
          )
          .bind(
            enabled ? 1 : 0,
            timezone,
            a.tenantId,
            a.userId,
            enabled ? 1 : 0
          ),
        db
          .prepare(
            "UPDATE notifications SET status='cancelled',body='' WHERE tenant_id=? AND user_id=? AND status IN ('pending','dispatching') AND ?=0"
          )
          .bind(a.tenantId, a.userId, enabled ? 1 : 0),
      ])
    },
    async enqueue(n) {
      await db
        .prepare(
          "INSERT OR IGNORE INTO notifications(id,tenant_id,user_id,kind,phone,title,body,scheduled_at,expires_at,created_at,next_attempt,request_key) SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM notifications WHERE tenant_id=? AND user_id=? AND kind!='verification' AND created_at>?)<20 AND (SELECT COUNT(*) FROM notifications WHERE phone=? AND kind!='verification' AND created_at>?)<20 AND EXISTS(SELECT 1 FROM notification_contacts WHERE tenant_id=? AND user_id=? AND enabled=1 AND consent_at IS NOT NULL AND phone=?)"
        )
        .bind(
          n.id,
          n.tenantId,
          n.userId,
          n.kind,
          n.phone,
          n.title,
          n.body,
          n.scheduled_at,
          n.expires_at,
          n.created_at,
          n.scheduled_at,
          n.request_key,
          n.tenantId,
          n.userId,
          n.created_at - 86400000,
          n.phone,
          n.created_at - 86400000,
          n.tenantId,
          n.userId,
          n.phone
        )
        .run()
      const item = await db
        .prepare(
          "SELECT " +
            columns +
            " FROM notifications WHERE tenant_id=? AND user_id=? AND request_key=?"
        )
        .bind(n.tenantId, n.userId, n.request_key)
        .first<Notification>()
      if (!item) throw new NotificationError("notification_rate_limited")
      return item
    },
    async cancel(a, id) {
      return !!(
        await db
          .prepare(
            "UPDATE notifications SET status='cancelled',body='' WHERE id=? AND tenant_id=? AND user_id=? AND status='pending'"
          )
          .bind(id, a.tenantId, a.userId)
          .run()
      ).meta.changes
    },
    async cleanup(now) {
      await db.batch([
        db
          .prepare(
            "UPDATE notifications SET status='expired',body='' WHERE expires_at<=? AND status IN ('pending','dispatching')"
          )
          .bind(now),
        db
          .prepare(
            "UPDATE notification_contacts SET challenge_hash=NULL,challenge_expires=NULL WHERE challenge_expires<=?"
          )
          .bind(now),
        db
          .prepare(
            "UPDATE notifications SET body='' WHERE kind='verification' AND status NOT IN ('pending','dispatching')"
          )
          .bind(),
      ])
    },
    async claim(now) {
      return (
        await db
          .prepare(
            "UPDATE notifications SET status='dispatching',lease_until=?,attempts=attempts+1 WHERE id IN (SELECT id FROM notifications WHERE ((status='pending' AND next_attempt<=?) OR (status='dispatching' AND lease_until<=?)) AND expires_at>? ORDER BY scheduled_at LIMIT 5) RETURNING " +
              columns
          )
          .bind(now + 120000, now, now, now)
          .all<Notification>()
      ).results
    },
    async track(now) {
      return (
        await db
          .prepare(
            "SELECT " +
              columns +
              " FROM notifications WHERE status IN ('accepted','sent','delivered','uncertain') AND created_at>? ORDER BY lease_until LIMIT 10"
          )
          .bind(now - 86400000)
          .all<Notification>()
      ).results
    },
    async eligible(n, now) {
      if (n.expires_at <= now) return false
      const row = await db
        .prepare(
          "SELECT n.id FROM notifications n JOIN notification_contacts c ON c.tenant_id=n.tenant_id AND c.user_id=n.user_id WHERE n.id=? AND n.tenant_id=? AND n.user_id=? AND n.status='dispatching' AND c.phone=n.phone AND n.kind!='verification' AND c.enabled=1 AND c.consent_at IS NOT NULL"
        )
        .bind(n.id, n.tenantId, n.userId)
        .first()
      return !!row
    },
    async update(id, status, error = null, providerId = null) {
      await db
        .prepare(
          "UPDATE notifications SET status=?,last_error=?,provider_id=COALESCE(?,provider_id),lease_until=? WHERE id=? AND status NOT IN ('cancelled','expired','failed','read') AND (status!='delivered' OR ? IN ('delivered','read')) AND (status!='sent' OR ? NOT IN ('accepted','pending','dispatching'))"
        )
        .bind(status, error, providerId, Date.now(), id, status, status)
        .run()
    },
    async retry(n, now) {
      // Keep one stable gateway ID across HTTP timeouts; never create a second send.
      await db
        .prepare(
          "UPDATE notifications SET status='pending',next_attempt=?,last_error='gateway_unavailable' WHERE id=? AND status='dispatching'"
        )
        .bind(
          now + Math.min(900000, 30000 * 2 ** Math.min(n.attempts, 5)),
          n.id
        )
        .run()
    },
  }
}
