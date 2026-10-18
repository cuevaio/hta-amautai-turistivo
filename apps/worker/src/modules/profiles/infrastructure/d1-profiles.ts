import type { ProfileRepository } from "../application/service.ts"
import type { Actor, AccountProfile } from "../domain/profile.ts"

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
    async save(actor, role) {
      await db
        .prepare(
          "INSERT INTO account_profiles(tenant_id,user_id,role) VALUES(?,?,?) ON CONFLICT(tenant_id,user_id) DO UPDATE SET role=excluded.role,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')"
        )
        .bind(actor.tenantId, actor.userId, role)
        .run()
      return (await find(actor))!
    },
  }
}
