import { initialNursery, nurseryTask, nurseryStep } from "../domain/nursery.ts"
import type { NurseryState } from "../domain/nursery.ts"
import { initialMarket, marketTask, marketStep } from "../domain/market.ts"
import type { MarketState } from "../domain/market.ts"
import {
  challengeFor,
  catchFood,
  participantName,
  RoomError,
} from "../domain/cargo.ts"
import type { Actor, Region, Room, Participant } from "../domain/cargo.ts"
export interface RoomRepository {
  teacher(actor: Actor): Promise<boolean>
  list(actor: Actor): Promise<Room[]>
  create(
    actor: Actor,
    id: string,
    region: Region,
    kind: Room["kind"],
    mode: Room["mode"],
    name: string | null
  ): Promise<Room>
  market(actor: Actor, room: string, id: string): Promise<MarketState | null>
  saveMarket(
    actor: Actor,
    room: string,
    p: Participant,
    state: MarketState,
    version: number
  ): Promise<boolean>
  nursery(actor: Actor, room: string, id: string): Promise<NurseryState | null>
  saveNursery(
    actor: Actor,
    room: string,
    p: Participant,
    state: NurseryState,
    version: number
  ): Promise<boolean>
  deleteRoom(actor: Actor, id: string): Promise<boolean>
  find(actor: Actor, id: string): Promise<Room | null>
  participants(actor: Actor, room: string): Promise<Participant[]>
  add(
    actor: Actor,
    room: string,
    id: string,
    name: string,
    key: string
  ): Promise<void>
  participant(
    actor: Actor,
    room: string,
    id: string
  ): Promise<Participant | null>
  remove(actor: Actor, room: string, id: string): Promise<void>
  start(actor: Actor, room: string, id: string): Promise<void>
  save(
    actor: Actor,
    room: string,
    participant: Participant,
    expectedVersion: number
  ): Promise<boolean>
}
export function roomService(
  repo: RoomRepository,
  id: () => string,
  clock: () => number = Date.now
) {
  async function room(actor: Actor, roomId: string) {
    const r = await repo.find(actor, roomId)
    if (!r) throw new RoomError("room_not_found")
    return r
  }
  async function participant(
    actor: Actor,
    roomId: string,
    participantId: string
  ) {
    const p = await repo.participant(actor, roomId, participantId)
    if (!p) throw new RoomError("participant_not_found")
    return p
  }
  async function marketRun(
    actor: Actor,
    roomId: string,
    participantId: string
  ) {
    const r = await room(actor, roomId)
    if (r.kind !== "market") throw new RoomError("room_conflict")
    const p = await participant(actor, roomId, participantId)
    return {
      r,
      p,
      state:
        (await repo.market(actor, roomId, participantId)) ?? initialMarket(),
    }
  }
  function marketDto(
    r: Room,
    p: Participant,
    state: MarketState,
    feedback: "" | "correct" | "wrong" | "help" = "",
    delta = 0
  ) {
    return {
      room: r,
      participant: p,
      task: marketTask(state),
      helped: state.helped,
      attempts: state.attempts,
      streak: state.streak,
      bands: state.bands,
      evidence: state.evidence,
      feedback,
      delta,
    }
  }
  async function nurseryRun(
    actor: Actor,
    roomId: string,
    participantId: string
  ) {
    const r = await room(actor, roomId)
    if (r.kind !== "nursery") throw new RoomError("room_conflict")
    const p = await participant(actor, roomId, participantId)
    return {
      r,
      p,
      state:
        (await repo.nursery(actor, roomId, participantId)) ?? initialNursery(),
    }
  }
  function nurseryDto(
    r: Room,
    p: Participant,
    state: NurseryState,
    feedback: "" | "correct" | "wrong" | "help" = "",
    delta = 0
  ) {
    return {
      room: r,
      participant: p,
      task: nurseryTask(state),
      helped: state.helped,
      attempts: state.attempts,
      streak: state.streak,
      bands: state.bands,
      evidence: state.evidence,
      feedback,
      delta,
    }
  }
  return {
    async marketStart(actor: Actor, roomId: string, participantId: string) {
      await marketRun(actor, roomId, participantId)
      await repo.start(actor, roomId, participantId)
      const { r, p, state } = await marketRun(actor, roomId, participantId)
      return marketDto(r, p, state)
    },
    async marketAction(
      actor: Actor,
      roomId: string,
      participantId: string,
      input: { version: number; answer?: number; help?: boolean }
    ) {
      const { r, p, state } = await marketRun(actor, roomId, participantId)
      if (input.version < p.version) return marketDto(r, p, state)
      if (input.version !== p.version) throw new RoomError("room_conflict")
      const result = marketStep(p, state, r, input)
      if (
        !(await repo.saveMarket(
          actor,
          roomId,
          result.participant,
          result.state,
          p.version
        ))
      )
        throw new RoomError("room_conflict")
      return marketDto(
        r,
        result.participant,
        result.state,
        result.feedback,
        result.delta
      )
    },
    async marketRetry(
      actor: Actor,
      roomId: string,
      participantId: string,
      version: number
    ) {
      const { r, p } = await marketRun(actor, roomId, participantId)
      if (p.mistakes < 3 || p.version !== version)
        throw new RoomError("room_conflict")
      const next = {
        ...p,
        score: 0,
        solved: 0,
        mistakes: 0,
        caught: 0,
        paused: false,
        version: p.version + 1,
      }
      const state = initialMarket()
      if (!(await repo.saveMarket(actor, roomId, next, state, p.version)))
        throw new RoomError("room_conflict")
      return marketDto(r, next, state)
    },
    async nurseryStart(actor: Actor, roomId: string, participantId: string) {
      await nurseryRun(actor, roomId, participantId)
      await repo.start(actor, roomId, participantId)
      const { r, p, state } = await nurseryRun(actor, roomId, participantId)
      return nurseryDto(r, p, state)
    },
    async nurseryAction(
      actor: Actor,
      roomId: string,
      participantId: string,
      input: { version: number; trays?: number; units?: number; help?: boolean }
    ) {
      const { r, p, state } = await nurseryRun(actor, roomId, participantId)
      if (input.version < p.version) return nurseryDto(r, p, state)
      if (input.version !== p.version) throw new RoomError("room_conflict")
      const result = nurseryStep(p, state, r, input)
      if (
        !(await repo.saveNursery(
          actor,
          roomId,
          result.participant,
          result.state,
          p.version
        ))
      )
        throw new RoomError("room_conflict")
      return nurseryDto(
        r,
        result.participant,
        result.state,
        result.feedback,
        result.delta
      )
    },
    async nurseryRetry(
      actor: Actor,
      roomId: string,
      participantId: string,
      version: number
    ) {
      const { r, p } = await nurseryRun(actor, roomId, participantId)
      if (p.mistakes < 3 || p.version !== version)
        throw new RoomError("room_conflict")
      const next = {
        ...p,
        score: 0,
        solved: 0,
        mistakes: 0,
        caught: 0,
        paused: false,
        version: p.version + 1,
      }
      const state = initialNursery()
      if (!(await repo.saveNursery(actor, roomId, next, state, p.version)))
        throw new RoomError("room_conflict")
      return nurseryDto(r, next, state)
    },
    list: (actor: Actor) => repo.list(actor),
    async create(
      actor: Actor,
      region: Region,
      kind: Room["kind"] = "cargo",
      mode: Room["mode"] = "challenge",
      rawName?: string
    ) {
      if (!(await repo.teacher(actor))) throw new RoomError("teacher_required")
      if (!["coast", "highlands", "jungle"].includes(region))
        throw new RoomError("invalid_room_input")
      const name = rawName === undefined ? null : participantName(rawName).name
      return repo.create(actor, id(), region, kind, mode, name)
    },
    async deleteRoom(actor: Actor, roomId: string) {
      if (!(await repo.deleteRoom(actor, roomId)))
        throw new RoomError("room_not_found")
    },
    async detail(actor: Actor, roomId: string) {
      return {
        room: await room(actor, roomId),
        participants: await repo.participants(actor, roomId),
      }
    },
    async add(actor: Actor, roomId: string, raw: string) {
      await room(actor, roomId)
      const name = participantName(raw)
      await repo.add(actor, roomId, id(), name.name, name.key)
    },
    async remove(actor: Actor, roomId: string, participantId: string) {
      await room(actor, roomId)
      await participant(actor, roomId, participantId)
      await repo.remove(actor, roomId, participantId)
    },
    async start(actor: Actor, roomId: string, participantId: string) {
      const r = await room(actor, roomId)
      if (r.kind !== "cargo") throw new RoomError("room_conflict")
      await participant(actor, roomId, participantId)
      await repo.start(actor, roomId, participantId)
      return {
        room: r,
        participant: await participant(actor, roomId, participantId),
        challenge: challengeFor(
          (await participant(actor, roomId, participantId)).solved
        ),
      }
    },
    async collect(
      actor: Actor,
      roomId: string,
      participantId: string,
      input: { version: number; value: number }
    ) {
      if ((await room(actor, roomId)).kind !== "cargo")
        throw new RoomError("room_conflict")
      const p = await participant(actor, roomId, participantId)
      if (input.version < p.version)
        return { participant: p, challenge: challengeFor(p.solved) }
      if (input.version !== p.version) throw new RoomError("room_conflict")
      const next = catchFood(p, input.value, clock())
      if (!(await repo.save(actor, roomId, next, p.version)))
        throw new RoomError("room_conflict")
      return { participant: next, challenge: challengeFor(next.solved) }
    },
    async retry(actor: Actor, roomId: string, participantId: string) {
      const r = await room(actor, roomId)
      if (r.kind !== "cargo") throw new RoomError("room_conflict")
      const p = await participant(actor, roomId, participantId)
      if (p.mistakes < 3) throw new RoomError("room_conflict")
      const next = {
        ...p,
        score: 0,
        solved: 0,
        caught: 0,
        mistakes: 0,
        paused: false,
        activeMs: 0,
        lastEventAt: clock(),
        version: p.version + 1,
      }
      if (!(await repo.save(actor, roomId, next, p.version)))
        throw new RoomError("room_conflict")
      return { room: r, participant: next, challenge: challengeFor(0) }
    },
    async pause(
      actor: Actor,
      roomId: string,
      participantId: string,
      input: { version: number; paused: boolean }
    ) {
      if ((await room(actor, roomId)).kind !== "cargo")
        throw new RoomError("room_conflict")
      const p = await participant(actor, roomId, participantId)
      if (input.version < p.version)
        return { participant: p, challenge: challengeFor(p.solved) }
      if (input.version !== p.version || !p.started)
        throw new RoomError("room_conflict")
      const now = clock()
      const next = {
        ...p,
        paused: input.paused,
        activeMs:
          p.activeMs + (p.paused ? 0 : Math.max(0, now - p.lastEventAt)),
        lastEventAt: now,
        version: p.version + 1,
      }
      if (!(await repo.save(actor, roomId, next, p.version)))
        throw new RoomError("room_conflict")
      return { participant: next, challenge: challengeFor(next.solved) }
    },
  }
}
export type RoomService = ReturnType<typeof roomService>
