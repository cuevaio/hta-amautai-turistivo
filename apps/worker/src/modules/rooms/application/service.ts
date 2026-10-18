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
  create(actor: Actor, id: string, region: Region): Promise<Room>
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
  return {
    list: (actor: Actor) => repo.list(actor),
    async create(actor: Actor, region: Region) {
      if (!(await repo.teacher(actor))) throw new RoomError("teacher_required")
      if (!["coast", "highlands", "jungle"].includes(region))
        throw new RoomError("invalid_room_input")
      return repo.create(actor, id(), region)
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
      await room(actor, roomId)
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
      await room(actor, roomId)
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
