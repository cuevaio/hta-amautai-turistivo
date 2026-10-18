import type { ProfileRepository } from "../application/service.ts"
import type {
  Actor,
  AccountProfile,
  ProfileWelcome,
} from "../domain/profile.ts"

type ProfileRow = { role: AccountProfile["role"]; updated_at: string }

export function d1Profiles(db: D1Database): ProfileRepository {
  async function find(actor: Actor) {
    const row = await db
      .prepare(
        "SELECT role,updated_at FROM account_profiles WHERE tenant_id=? AND user_id=?"
      )
      .bind(actor.tenantId, actor.userId)
      .first<ProfileRow>()
    return row ? { role: row.role, updatedAt: row.updated_at } : null
  }

  return {
    find,
    async save(actor, input) {
      const now = Date.now()
      await db.batch([
        db
          .prepare(
            "INSERT INTO account_profiles(tenant_id,user_id,role) VALUES(?,?,?) ON CONFLICT(tenant_id,user_id) DO UPDATE SET role=excluded.role,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')"
          )
          .bind(actor.tenantId, actor.userId, input.role),
        db
          .prepare(
            "INSERT OR IGNORE INTO profile_welcomes(tenant_id,user_id,role,phone,locale,created_at) VALUES(?,?,?,?,?,?)"
          )
          .bind(
            actor.tenantId,
            actor.userId,
            input.role,
            input.phone,
            input.locale,
            now
          ),
      ])
      return (await find(actor))!
    },
    async pendingWelcomes(now, actor) {
      return (
        await db
          .prepare(
            "SELECT tenant_id AS tenantId,user_id AS userId,role,phone,locale,created_at AS createdAt FROM profile_welcomes WHERE completed_at IS NULL AND created_at>?" +
              (actor ? " AND tenant_id=? AND user_id=?" : "") +
              " ORDER BY created_at LIMIT 5"
          )
          .bind(
            now - 86400000,
            ...(actor ? [actor.tenantId, actor.userId] : [])
          )
          .all<Omit<ProfileWelcome, "consent">>()
      ).results.map((row) => ({ ...row, consent: true as const }))
    },
    async completeWelcome(actor, now) {
      await db
        .prepare(
          "UPDATE profile_welcomes SET completed_at=?,phone=NULL WHERE tenant_id=? AND user_id=? AND completed_at IS NULL"
        )
        .bind(now, actor.tenantId, actor.userId)
        .run()
    },
    async expireWelcomes(now) {
      await db
        .prepare(
          "UPDATE profile_welcomes SET completed_at=?,phone=NULL WHERE completed_at IS NULL AND created_at<=?"
        )
        .bind(now, now - 86400000)
        .run()
    },
  }
}
