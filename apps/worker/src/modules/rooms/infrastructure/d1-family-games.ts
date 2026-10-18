import type { FamilyGameRepository } from "../application/family-service.ts"
import type { FamilyChild, FamilyGame } from "../domain/family.ts"
import { FamilyGameError } from "../domain/family.ts"
const gameSelect = `SELECT r.id,r.family_child_id AS childId,p.name,r.region,r.kind,r.created_at AS createdAt,p.id AS participantId,p.score,p.solved,p.mistakes,p.started FROM game_rooms r JOIN family_children c ON c.id=r.family_child_id AND c.tenant_id=r.tenant_id AND c.user_id=r.user_id JOIN game_participants p ON p.room_id=r.id WHERE r.tenant_id=? AND r.user_id=?`
type GameRow = Omit<FamilyGame, "started"> & { started: number }
const dto = (r: GameRow): FamilyGame => ({ ...r, started: !!r.started })
export function d1FamilyGames(db: D1Database): FamilyGameRepository {
  return {
    async children(a) {
      return (
        await db
          .prepare(
            "SELECT id,name,region,version,created_at AS createdAt FROM family_children WHERE tenant_id=? AND user_id=? ORDER BY created_at,id"
          )
          .bind(a.tenantId, a.userId)
          .all<FamilyChild>()
      ).results
    },
    child(a, id) {
      return db
        .prepare(
          "SELECT id,name,region,version,created_at AS createdAt FROM family_children WHERE id=? AND tenant_id=? AND user_id=?"
        )
        .bind(id, a.tenantId, a.userId)
        .first<FamilyChild>()
    },
    async add(a, id, name, key, region) {
      try {
        const result = await db
          .prepare(
            "INSERT INTO family_children(id,tenant_id,user_id,name,name_key,region) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM family_children WHERE tenant_id=? AND user_id=?)<20"
          )
          .bind(
            id,
            a.tenantId,
            a.userId,
            name,
            key,
            region,
            a.tenantId,
            a.userId
          )
          .run()
        if (!result.meta.changes) throw new FamilyGameError("family_limit")
      } catch (e) {
        if (
          e instanceof Error &&
          /UNIQUE constraint failed: family_children.tenant_id, family_children.user_id, family_children.name_key/.test(
            e.message
          )
        )
          throw new FamilyGameError("duplicate_child")
        throw e
      }
    },
    async update(a, id, name, key, region, version) {
      try {
        const result = await db
          .prepare(
            "UPDATE family_children SET name=?,name_key=?,region=?,version=version+1 WHERE id=? AND tenant_id=? AND user_id=? AND version=?"
          )
          .bind(name, key, region, id, a.tenantId, a.userId, version)
          .run()
        return !!result.meta.changes
      } catch (e) {
        if (
          e instanceof Error &&
          /UNIQUE constraint failed: family_children.tenant_id, family_children.user_id, family_children.name_key/.test(
            e.message
          )
        )
          throw new FamilyGameError("duplicate_child")
        throw e
      }
    },
    async remove(a, id) {
      const result = await db
        .prepare(
          "DELETE FROM family_children WHERE id=? AND tenant_id=? AND user_id=?"
        )
        .bind(id, a.tenantId, a.userId)
        .run()
      return !!result.meta.changes
    },
    async games(a) {
      return (
        await db
          .prepare(gameSelect + " ORDER BY r.created_at DESC,r.id DESC")
          .bind(a.tenantId, a.userId)
          .all<GameRow>()
      ).results.map(dto)
    },
    async game(a, id) {
      const row = await db
        .prepare(gameSelect + " AND r.id=?")
        .bind(a.tenantId, a.userId, id)
        .first<GameRow>()
      return row ? dto(row) : null
    },
    async create(a, child, kind, id) {
      // One atomic batch and stable IDs make retry after an uncertain response safe.
      await db.batch([
        db
          .prepare(
            "INSERT INTO game_rooms(id,tenant_id,user_id,region,kind,mode,name,family_child_id) SELECT ?,tenant_id,user_id,region,?,'practice',name,id FROM family_children WHERE id=? AND tenant_id=? AND user_id=? ON CONFLICT(id) DO NOTHING"
          )
          .bind(id, kind, child.id, a.tenantId, a.userId),
        db
          .prepare(
            "INSERT INTO game_participants(id,room_id,name,name_key) SELECT ?,r.id,c.name,c.name_key FROM game_rooms r JOIN family_children c ON c.id=r.family_child_id AND c.tenant_id=r.tenant_id AND c.user_id=r.user_id WHERE r.id=? AND r.tenant_id=? AND r.user_id=? AND r.family_child_id=? AND r.kind=? ON CONFLICT DO NOTHING"
          )
          .bind(id, id, a.tenantId, a.userId, child.id, kind),
      ])
    },
  }
}
