import type { EmailRepository } from "../application/email-ports.ts"
import {
  EmailError,
  type EmailContact,
  type EmailNotification,
} from "../domain/email.ts"
const columns = "*,tenant_id AS tenantId,user_id AS userId"
export function d1Email(db: D1Database): EmailRepository {
  return {
    contact: (a) =>
      db
        .prepare(
          "SELECT email,enabled,verified_at,challenge_id FROM email_contacts WHERE tenant_id=? AND user_id=?"
        )
        .bind(a.tenantId, a.userId)
        .first<EmailContact>(),
    async list(a) {
      return (
        await db
          .prepare(
            "SELECT " +
              columns +
              " FROM email_notifications WHERE tenant_id=? AND user_id=? ORDER BY created_at DESC LIMIT 50"
          )
          .bind(a.tenantId, a.userId)
          .all<EmailNotification>()
      ).results
    },
    async challenge(n, hash) {
      const result = await db.batch([
        db
          .prepare(
            "INSERT INTO email_contacts(tenant_id,user_id,email,consent_at,requested_at) VALUES(?,?,?,?,0) ON CONFLICT(tenant_id,user_id) DO NOTHING"
          )
          .bind(n.tenantId, n.userId, n.email, n.created_at),
        db
          .prepare(
            "UPDATE email_contacts SET email=?,enabled=0,verified_at=NULL,consent_at=?,requested_at=?,challenge_id=?,challenge_hash=?,challenge_expires=?,challenge_attempts=0 WHERE tenant_id=? AND user_id=? AND requested_at<=? AND (SELECT COUNT(*) FROM email_notifications WHERE tenant_id=? AND user_id=? AND kind='verification' AND created_at>?)<5 AND (SELECT COUNT(*) FROM email_notifications WHERE email=? AND kind='verification' AND created_at>?)<5"
          )
          .bind(
            n.email,
            n.created_at,
            n.created_at,
            n.id,
            hash,
            n.expires_at,
            n.tenantId,
            n.userId,
            n.created_at - 60000,
            n.tenantId,
            n.userId,
            n.created_at - 86400000,
            n.email,
            n.created_at - 86400000
          ),
        db
          .prepare(
            "UPDATE email_notifications SET status='cancelled',body='' WHERE tenant_id=? AND user_id=? AND status IN ('pending','dispatching') AND EXISTS(SELECT 1 FROM email_contacts WHERE tenant_id=? AND user_id=? AND challenge_id=?)"
          )
          .bind(n.tenantId, n.userId, n.tenantId, n.userId, n.id),
        db
          .prepare(
            "INSERT INTO email_notifications(id,tenant_id,user_id,email,kind,title,body,scheduled_at,expires_at,created_at,next_attempt,request_key) SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM email_contacts WHERE tenant_id=? AND user_id=? AND challenge_id=?)"
          )
          .bind(
            n.id,
            n.tenantId,
            n.userId,
            n.email,
            n.kind,
            n.title,
            n.body,
            n.scheduled_at,
            n.expires_at,
            n.created_at,
            n.scheduled_at,
            n.request_key,
            n.tenantId,
            n.userId,
            n.id
          ),
      ])
      if (!result[1]!.meta.changes) throw new EmailError("email_rate_limited")
    },
    async confirm(a, email, hash, now) {
      const row = await db
        .prepare(
          "UPDATE email_contacts SET challenge_attempts=challenge_attempts+1,verified_at=CASE WHEN challenge_hash=? THEN ? ELSE verified_at END,enabled=CASE WHEN challenge_hash=? THEN 1 ELSE enabled END,challenge_expires=CASE WHEN challenge_hash=? THEN NULL ELSE challenge_expires END,challenge_hash=CASE WHEN challenge_hash=? THEN NULL ELSE challenge_hash END WHERE tenant_id=? AND user_id=? AND email=? AND challenge_expires>? AND challenge_attempts<5 AND challenge_hash IS NOT NULL RETURNING verified_at"
        )
        .bind(hash, now, hash, hash, hash, a.tenantId, a.userId, email, now)
        .first<{ verified_at: number | null }>()
      return row?.verified_at === now
    },
    async preferences(a, email, enabled) {
      await db.batch([
        db
          .prepare(
            "UPDATE email_contacts SET enabled=? WHERE tenant_id=? AND user_id=? AND (?=0 OR (email=? AND verified_at IS NOT NULL))"
          )
          .bind(enabled ? 1 : 0, a.tenantId, a.userId, enabled ? 1 : 0, email),
        db
          .prepare(
            "UPDATE email_notifications SET status='cancelled',body='' WHERE tenant_id=? AND user_id=? AND status IN ('pending','dispatching') AND ?=0"
          )
          .bind(a.tenantId, a.userId, enabled ? 1 : 0),
      ])
    },
    async enqueue(n) {
      await db
        .prepare(
          "INSERT OR IGNORE INTO email_notifications(id,tenant_id,user_id,email,kind,title,body,scheduled_at,expires_at,created_at,next_attempt,request_key) SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM email_contacts WHERE tenant_id=? AND user_id=? AND email=? AND enabled=1 AND verified_at IS NOT NULL) AND (SELECT COUNT(*) FROM email_notifications WHERE tenant_id=? AND user_id=? AND kind!='verification' AND created_at>?)<20"
        )
        .bind(
          n.id,
          n.tenantId,
          n.userId,
          n.email,
          n.kind,
          n.title,
          n.body,
          n.scheduled_at,
          n.expires_at,
          n.created_at,
          n.scheduled_at,
          n.request_key,
          n.tenantId,
          n.userId,
          n.email,
          n.tenantId,
          n.userId,
          n.created_at - 86400000
        )
        .run()
      const saved = await db
        .prepare(
          "SELECT " +
            columns +
            " FROM email_notifications WHERE tenant_id=? AND user_id=? AND request_key=?"
        )
        .bind(n.tenantId, n.userId, n.request_key)
        .first<EmailNotification>()
      if (!saved) throw new EmailError("email_rate_limited")
      if (
        saved.email !== n.email ||
        saved.kind !== n.kind ||
        saved.title !== n.title ||
        (saved.scheduled_at !== n.scheduled_at && n.kind !== "test")
      )
        throw new EmailError("email_request_conflict")
      return saved
    },
    async cancel(a, id) {
      return !!(
        await db
          .prepare(
            "UPDATE email_notifications SET status='cancelled',body='' WHERE id=? AND tenant_id=? AND user_id=? AND status='pending'"
          )
          .bind(id, a.tenantId, a.userId)
          .run()
      ).meta.changes
    },
    async cleanup(now) {
      await db.batch([
        // An expired lease may have crossed the submission boundary; do not send twice.
        db
          .prepare(
            "UPDATE email_notifications SET status='uncertain',last_error='submission_unknown',body='' WHERE status='dispatching' AND lease_until<=?"
          )
          .bind(now),
        db
          .prepare(
            "UPDATE email_notifications SET status='expired',body='' WHERE status='pending' AND expires_at<=?"
          )
          .bind(now),
        db
          .prepare(
            "UPDATE email_contacts SET challenge_hash=NULL WHERE challenge_expires<=?"
          )
          .bind(now),
      ])
    },
    async claim(now) {
      return (
        await db
          .prepare(
            "UPDATE email_notifications SET status='dispatching',attempts=attempts+1,lease_until=? WHERE id IN (SELECT id FROM email_notifications WHERE status='pending' AND next_attempt<=? AND expires_at>? ORDER BY scheduled_at LIMIT 3) RETURNING " +
              columns
          )
          .bind(now + 300000, now, now)
          .all<EmailNotification>()
      ).results
    },
    async eligible(n, now) {
      return (
        n.expires_at > now &&
        !!(await db
          .prepare(
            "SELECT n.id FROM email_notifications n JOIN email_contacts c ON c.tenant_id=n.tenant_id AND c.user_id=n.user_id WHERE n.id=? AND n.tenant_id=? AND n.user_id=? AND n.status='dispatching' AND c.email=n.email AND ((n.kind='verification' AND c.challenge_id=n.id AND c.challenge_hash IS NOT NULL AND c.challenge_expires>?) OR (n.kind!='verification' AND c.enabled=1 AND c.verified_at IS NOT NULL))"
          )
          .bind(n.id, n.tenantId, n.userId, now)
          .first())
      )
    },
    async finish(n, status, error, providerId) {
      await db
        .prepare(
          "UPDATE email_notifications SET status=?,last_error=?,provider_id=?,body='' WHERE id=? AND tenant_id=? AND user_id=? AND status='dispatching' AND attempts=?"
        )
        .bind(status, error, providerId, n.id, n.tenantId, n.userId, n.attempts)
        .run()
    },
    async retry(n, now) {
      await db
        .prepare(
          "UPDATE email_notifications SET status='pending',next_attempt=?,last_error='email_unavailable' WHERE id=? AND tenant_id=? AND user_id=? AND status='dispatching' AND attempts=?"
        )
        .bind(
          now + Math.min(900000, 30000 * 2 ** n.attempts),
          n.id,
          n.tenantId,
          n.userId,
          n.attempts
        )
        .run()
    },
  }
}
