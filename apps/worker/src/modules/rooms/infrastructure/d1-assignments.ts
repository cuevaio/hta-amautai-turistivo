import type { AssignmentRepository } from "../application/assignment-service.ts"
import type { Assignment } from "../domain/assignment.ts"
import { RoomError } from "../domain/cargo.ts"
const fields = `id,room_id AS roomId,participant_id AS participantId,tenant_id AS tenantId,user_id AS userId,guardian_phone AS guardianPhone,token_hash AS tokenHash,message_body AS messageBody,request_key AS requestKey,delivery_id AS deliveryId,status,attempts,next_attempt_at AS nextAttemptAt,expires_at AS expiresAt,created_at AS createdAt`
export function d1Assignments(db: D1Database): AssignmentRepository {
  return {
    byRequest: (a, key) =>
      db
        .prepare(
          `SELECT ${fields} FROM student_assignments WHERE tenant_id=? AND user_id=? AND request_key=?`
        )
        .bind(a.tenantId, a.userId, key)
        .first<Assignment>(),
    byParticipant: (a, room, p) =>
      db
        .prepare(
          `SELECT ${fields} FROM student_assignments WHERE tenant_id=? AND user_id=? AND room_id=? AND participant_id=?`
        )
        .bind(a.tenantId, a.userId, room, p)
        .first<Assignment>(),
    byToken: (hash) =>
      db
        .prepare(`SELECT ${fields} FROM student_assignments WHERE token_hash=?`)
        .bind(hash)
        .first<Assignment>(),
    async register(a, name, existing) {
      const statements: D1PreparedStatement[] = []
      if (existing)
        statements.push(
          db
            .prepare(
              "DELETE FROM student_assignments WHERE participant_id=? AND tenant_id=? AND user_id=? AND expires_at<=?"
            )
            .bind(a.participantId, a.tenantId, a.userId, a.createdAt)
        )
      if (!existing)
        statements.push(
          db
            .prepare(
              `INSERT INTO game_participants(id,room_id,name,name_key) SELECT ?,id,?,? FROM game_rooms WHERE id=? AND tenant_id=? AND user_id=? AND family_child_id IS NULL AND (SELECT COUNT(*) FROM game_participants WHERE room_id=game_rooms.id)<100`
            )
            .bind(
              a.participantId,
              name.name,
              name.key,
              a.roomId,
              a.tenantId,
              a.userId
            )
        )
      statements.push(
        db
          .prepare(
            `INSERT INTO student_assignments(id,room_id,participant_id,tenant_id,user_id,guardian_phone,token_hash,message_body,request_key,delivery_id,status,attempts,next_attempt_at,expires_at,created_at) SELECT ?,r.id,p.id,r.tenant_id,r.user_id,?,?,?,?,?,'pending',0,?,?,? FROM game_rooms r JOIN game_participants p ON p.room_id=r.id WHERE r.id=? AND r.tenant_id=? AND r.user_id=? AND p.id=? AND r.family_child_id IS NULL`
          )
          .bind(
            a.id,
            a.guardianPhone,
            a.tokenHash,
            a.messageBody,
            a.requestKey,
            a.deliveryId,
            a.nextAttemptAt,
            a.expiresAt,
            a.createdAt,
            a.roomId,
            a.tenantId,
            a.userId,
            a.participantId
          )
      )
      try {
        const results = await db.batch(statements)
        if (!results.at(-1)?.meta.changes) throw new RoomError("room_full")
        return a
      } catch (e) {
        if (
          e instanceof Error &&
          /UNIQUE constraint failed: game_participants.room_id, game_participants.name_key/.test(
            e.message
          )
        )
          throw new RoomError("duplicate_participant")
        if (
          e instanceof Error &&
          /UNIQUE constraint failed: student_assignments/.test(e.message)
        ) {
          const saved = await this.byRequest(a, a.requestKey)
          const participant = saved
            ? await db
                .prepare(
                  "SELECT name FROM game_participants WHERE id=? AND room_id=?"
                )
                .bind(saved.participantId, saved.roomId)
                .first<{ name: string }>()
            : null
          if (
            saved?.roomId === a.roomId &&
            saved.guardianPhone === a.guardianPhone &&
            participant?.name === name.name &&
            (!existing || saved.participantId === a.participantId)
          )
            return saved
          throw new RoomError("assignment_conflict")
        }
        throw e
      }
    },
    async due(now) {
      return (
        await db
          .prepare(
            `SELECT ${fields} FROM student_assignments WHERE status IN ('pending','dispatching','accepted','sent','delivered','uncertain') AND next_attempt_at<=? ORDER BY next_attempt_at LIMIT 20`
          )
          .bind(now)
          .all<Assignment>()
      ).results
    },
    async claim(a, now) {
      return !!(
        await db
          .prepare(
            `UPDATE student_assignments SET status='dispatching',attempts=attempts+1,next_attempt_at=? WHERE id=? AND delivery_id=? AND status=? AND next_attempt_at<=?`
          )
          .bind(now + 60000, a.id, a.deliveryId, a.status, now)
          .run()
      ).meta.changes
    },
    async update(a, status, next) {
      await db
        .prepare(
          `UPDATE student_assignments SET status=?,next_attempt_at=? WHERE id=? AND delivery_id=? AND status='dispatching'`
        )
        .bind(status, next, a.id, a.deliveryId)
        .run()
    },
    async retry(a, room, p, deliveryId, now) {
      return !!(
        await db
          .prepare(
            `UPDATE student_assignments SET status='pending',attempts=0,delivery_id=?,next_attempt_at=? WHERE tenant_id=? AND user_id=? AND room_id=? AND participant_id=? AND status IN ('failed','expired') AND expires_at>?`
          )
          .bind(deliveryId, now, a.tenantId, a.userId, room, p, now)
          .run()
      ).meta.changes
    },
  }
}
