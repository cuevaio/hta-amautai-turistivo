import type { FamilyProfileRepository } from "../application/service.ts"
import type {
  Actor,
  FamilyProfile,
  FamilyProfileInput,
} from "../domain/profile.ts"

type ProfileRow = { data: string; updated_at: string }

export function d1FamilyProfiles(db: D1Database): FamilyProfileRepository {
  async function find(actor: Actor): Promise<FamilyProfile | null> {
    const row = await db
      .prepare(
        "SELECT data,updated_at FROM family_profiles WHERE tenant_id=? AND user_id=?"
      )
      .bind(actor.tenantId, actor.userId)
      .first<ProfileRow>()
    return row
      ? {
          ...(JSON.parse(row.data) as FamilyProfileInput),
          updatedAt: row.updated_at,
        }
      : null
  }

  return {
    find,
    async save(actor, input) {
      await db
        .prepare(
          "INSERT INTO family_profiles(tenant_id,user_id,data) VALUES(?,?,?) ON CONFLICT(tenant_id,user_id) DO UPDATE SET data=excluded.data,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')"
        )
        .bind(actor.tenantId, actor.userId, JSON.stringify(input))
        .run()
      return (await find(actor))!
    },
  }
}
