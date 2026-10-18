import type { EducationRepository } from "../application/service.ts"
import type {
  Actor,
  ProfileValues,
  SessionValues,
  TeacherProfile,
  LearningSession,
} from "../domain/education.ts"
type ProfileRow = { data: string; updated_at: string }
type SessionRow = {
  id: string
  data: string
  version: number
  created_at: string
  updated_at: string
}
function session(row: SessionRow): LearningSession {
  return {
    ...(JSON.parse(row.data) as SessionValues),
    id: row.id,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
export function d1Education(db: D1Database): EducationRepository {
  async function profile(actor: Actor): Promise<TeacherProfile | null> {
    const row = await db
      .prepare(
        "SELECT data,updated_at FROM teacher_profiles WHERE tenant_id=? AND user_id=?"
      )
      .bind(actor.tenantId, actor.userId)
      .first<ProfileRow>()
    return row
      ? {
          ...(JSON.parse(row.data) as ProfileValues),
          updatedAt: row.updated_at,
        }
      : null
  }
  async function find(actor: Actor, id: string) {
    const row = await db
      .prepare(
        "SELECT id,data,version,created_at,updated_at FROM learning_sessions WHERE tenant_id=? AND user_id=? AND id=?"
      )
      .bind(actor.tenantId, actor.userId, id)
      .first<SessionRow>()
    return row ? session(row) : null
  }
  return {
    profile,
    find,
    async saveProfile(actor, values) {
      await db
        .prepare(
          "INSERT INTO teacher_profiles(tenant_id,user_id,data) VALUES(?,?,?) ON CONFLICT(tenant_id,user_id) DO UPDATE SET data=excluded.data,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')"
        )
        .bind(actor.tenantId, actor.userId, JSON.stringify(values))
        .run()
      return (await profile(actor))!
    },
    async list(actor) {
      const result = await db
        .prepare(
          "SELECT id,data,version,created_at,updated_at FROM learning_sessions WHERE tenant_id=? AND user_id=? ORDER BY updated_at DESC,id"
        )
        .bind(actor.tenantId, actor.userId)
        .all<SessionRow>()
      return result.results.map(session)
    },
    async create(actor, id, values) {
      await db
        .prepare(
          "INSERT INTO learning_sessions(id,tenant_id,user_id,data) VALUES(?,?,?,?)"
        )
        .bind(id, actor.tenantId, actor.userId, JSON.stringify(values))
        .run()
      return (await find(actor, id))!
    },
    async update(actor, id, values, version) {
      const result = await db
        .prepare(
          "UPDATE learning_sessions SET data=?,version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND tenant_id=? AND user_id=? AND version=?"
        )
        .bind(JSON.stringify(values), id, actor.tenantId, actor.userId, version)
        .run()
      return !!result.meta.changes
    },
  }
}
