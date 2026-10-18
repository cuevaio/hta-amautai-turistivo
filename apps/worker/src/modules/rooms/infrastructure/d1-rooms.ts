import type { NurseryState } from "../domain/nursery.ts"
import type { MarketState } from "../domain/market.ts"
import type { RoomRepository } from "../application/service.ts"
import type { Actor, Participant, Room } from "../domain/cargo.ts"
import { RoomError } from "../domain/cargo.ts"
type Row = {
  id: string
  name: string
  solved: number
  started: number
  score: number
  caught: number
  mistakes: number
  paused: number
  activeMs: number
  lastEventAt: number
  version: number
}
const dto = (p: Row): Participant => ({
  ...p,
  started: !!p.started,
  paused: !!p.paused,
})
export function d1Rooms(db: D1Database): RoomRepository {
  const owned = (a: Actor, room: string) => [room, a.tenantId, a.userId]
  const owner =
    "room_id IN (SELECT id FROM game_rooms WHERE id=? AND tenant_id=? AND user_id=?)"
  return {
    async market(a, room, id) {
      const row = await db
        .prepare(
          `SELECT market_state AS state FROM game_participants WHERE id=? AND ${owner}`
        )
        .bind(id, ...owned(a, room))
        .first<{ state: string | null }>()
      return row?.state ? (JSON.parse(row.state) as MarketState) : null
    },
    async saveMarket(a, room, p, state, version) {
      const result = await db
        .prepare(
          `UPDATE game_participants SET score=?,solved=?,mistakes=?,caught=0,paused=0,market_state=?,version=? WHERE id=? AND version=? AND ${owner}`
        )
        .bind(
          p.score,
          p.solved,
          p.mistakes,
          JSON.stringify(state),
          p.version,
          p.id,
          version,
          ...owned(a, room)
        )
        .run()
      return !!result.meta.changes
    },
    async nursery(a, room, id) {
      const row = await db
        .prepare(
          `SELECT nursery_state AS state FROM game_participants WHERE id=? AND ${owner}`
        )
        .bind(id, ...owned(a, room))
        .first<{ state: string | null }>()
      return row?.state ? (JSON.parse(row.state) as NurseryState) : null
    },
    async saveNursery(a, room, p, state, version) {
      const result = await db
        .prepare(
          `UPDATE game_participants SET score=?,solved=?,mistakes=?,caught=0,paused=0,nursery_state=?,version=? WHERE id=? AND version=? AND ${owner}`
        )
        .bind(
          p.score,
          p.solved,
          p.mistakes,
          JSON.stringify(state),
          p.version,
          p.id,
          version,
          ...owned(a, room)
        )
        .run()
      return !!result.meta.changes
    },
    async teacher(a) {
      return !!(await db
        .prepare(
          "SELECT 1 FROM teacher_profiles WHERE tenant_id=? AND user_id=? AND json_extract(data,'$.role')='teacher'"
        )
        .bind(a.tenantId, a.userId)
        .first())
    },
    async list(a) {
      return (
        await db
          .prepare(
            "SELECT id,name,region,kind,mode,created_at AS createdAt FROM game_rooms WHERE tenant_id=? AND user_id=? ORDER BY created_at DESC,id DESC LIMIT 100"
          )
          .bind(a.tenantId, a.userId)
          .all<Room>()
      ).results
    },
    async create(a, id, region, kind, mode, name) {
      await db
        .prepare(
          "INSERT INTO game_rooms(id,tenant_id,user_id,region,kind,mode,name) VALUES(?,?,?,?,?,?,?)"
        )
        .bind(id, a.tenantId, a.userId, region, kind, mode, name)
        .run()
      return (await this.find(a, id))!
    },
    async deleteRoom(a, id) {
      const result = await db
        .prepare(
          "DELETE FROM game_rooms WHERE id=? AND tenant_id=? AND user_id=?"
        )
        .bind(...owned(a, id))
        .run()
      return !!result.meta.changes
    },
    async find(a, id) {
      return db
        .prepare(
          "SELECT id,name,region,kind,mode,created_at AS createdAt FROM game_rooms WHERE id=? AND tenant_id=? AND user_id=?"
        )
        .bind(...owned(a, id))
        .first<Room>()
    },
    async participants(a, room) {
      return (
        await db
          .prepare(
            `SELECT id,name,solved,started,version,score,caught,mistakes,paused,active_ms AS activeMs,last_event_at AS lastEventAt FROM game_participants WHERE ${owner} ORDER BY score DESC,name_key,id`
          )
          .bind(...owned(a, room))
          .all<Row>()
      ).results.map(dto)
    },
    async participant(a, room, id) {
      const r = await db
        .prepare(
          `SELECT id,name,solved,started,version,score,caught,mistakes,paused,active_ms AS activeMs,last_event_at AS lastEventAt FROM game_participants WHERE id=? AND ${owner}`
        )
        .bind(id, ...owned(a, room))
        .first<Row>()
      return r ? dto(r) : null
    },
    async add(a, room, id, name, key) {
      try {
        const r = await db
          .prepare(
            "INSERT INTO game_participants(id,room_id,name,name_key) SELECT ?,id,?,? FROM game_rooms WHERE id=? AND tenant_id=? AND user_id=? AND (SELECT COUNT(*) FROM game_participants WHERE room_id=game_rooms.id)<100"
          )
          .bind(id, name, key, ...owned(a, room))
          .run()
        if (!r.meta.changes) throw new RoomError("room_full")
      } catch (e) {
        if (
          e instanceof Error &&
          /UNIQUE constraint failed: game_participants.room_id, game_participants.name_key/.test(
            e.message
          )
        )
          throw new RoomError("duplicate_participant")
        throw e
      }
    },
    async remove(a, room, id) {
      await db
        .prepare(`DELETE FROM game_participants WHERE id=? AND ${owner}`)
        .bind(id, ...owned(a, room))
        .run()
    },
    async start(a, room, id) {
      await db
        .prepare(
          `UPDATE game_participants SET started=1,last_event_at=CASE WHEN started=0 THEN ? ELSE last_event_at END WHERE id=? AND ${owner}`
        )
        .bind(Date.now(), id, ...owned(a, room))
        .run()
    },
    async save(a, room, p, version) {
      const r = await db
        .prepare(
          `UPDATE game_participants SET score=?,solved=?,caught=?,mistakes=?,paused=?,active_ms=?,last_event_at=?,version=? WHERE id=? AND version=? AND ${owner}`
        )
        .bind(
          p.score,
          p.solved,
          p.caught,
          p.mistakes,
          Number(p.paused),
          p.activeMs,
          p.lastEventAt,
          p.version,
          p.id,
          version,
          ...owned(a, room)
        )
        .run()
      return !!r.meta.changes
    },
  }
}
