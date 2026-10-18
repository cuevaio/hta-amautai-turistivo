import { RoomError, participantName } from "../domain/cargo.ts"
import type { Actor } from "../domain/cargo.ts"
import { guardianPhone, assignmentDto } from "../domain/assignment.ts"
import type { Assignment, AssignmentStatus } from "../domain/assignment.ts"
import type { RoomRepository } from "./service.ts"
export interface AssignmentRepository {
  byRequest(actor: Actor, key: string): Promise<Assignment | null>
  byParticipant(
    actor: Actor,
    roomId: string,
    participantId: string
  ): Promise<Assignment | null>
  byToken(hash: string): Promise<Assignment | null>
  register(
    a: Assignment,
    name: { name: string; key: string },
    existing: boolean
  ): Promise<Assignment>
  due(now: number): Promise<Assignment[]>
  claim(a: Assignment, now: number): Promise<boolean>
  update(a: Assignment, status: AssignmentStatus, next: number): Promise<void>
  retry(
    actor: Actor,
    roomId: string,
    participantId: string,
    deliveryId: string,
    now: number
  ): Promise<boolean>
}
export interface AssignmentMessenger {
  send(a: Assignment): Promise<AssignmentStatus>
  status(id: string): Promise<AssignmentStatus | null>
}
export type AssignmentCrypto = {
  token(): string
  hash(token: string): Promise<string>
}
export function assignmentService(deps: {
  repo: AssignmentRepository
  rooms: RoomRepository
  crypto: AssignmentCrypto
  id(): string
  now?: () => number
}) {
  const { repo, rooms } = deps
  const now = deps.now ?? Date.now
  async function register(
    actor: Actor,
    roomId: string,
    input: {
      name: string
      guardianPhone: string
      requestKey: string
      participantId?: string
    },
    origin: string
  ) {
    if (!(await rooms.teacher(actor))) throw new RoomError("teacher_required")
    const room = await rooms.find(actor, roomId)
    if (!room) throw new RoomError("room_not_found")
    if (room.familyChildId || room.kind === "data")
      throw new RoomError("room_conflict")
    const name = participantName(input.name)
    const phone = guardianPhone(input.guardianPhone)
    const old = await repo.byRequest(actor, input.requestKey)
    if (old) {
      const participant = await rooms.participant(
        actor,
        old.roomId,
        old.participantId
      )
      if (
        old.roomId !== roomId ||
        old.guardianPhone !== phone ||
        participant?.name !== name.name ||
        (input.participantId && old.participantId !== input.participantId)
      )
        throw new RoomError("assignment_conflict")
      return assignmentDto(old, now())
    }
    if (input.participantId) {
      const p = await rooms.participant(actor, roomId, input.participantId)
      if (!p) throw new RoomError("participant_not_found")
      if (p.name !== name.name) throw new RoomError("assignment_conflict")
      const existing = await repo.byParticipant(actor, roomId, p.id)
      if (existing && existing.expiresAt > now()) {
        if (existing.guardianPhone !== phone)
          throw new RoomError("assignment_conflict")
        return assignmentDto(existing, now())
      }
    }
    const token = deps.crypto.token()
    const time = now()
    const a: Assignment = {
      ...actor,
      id: deps.id(),
      roomId,
      participantId: input.participantId ?? deps.id(),
      guardianPhone: phone,
      tokenHash: await deps.crypto.hash(token),
      requestKey: input.requestKey,
      deliveryId: deps.id(),
      messageBody: `Hola, familia de ${name.name}. Su docente le asignó una actividad de Matemática en Amautai${room.name ? ": " + room.name : ""}. Abra este enlace para que el estudiante resuelva el juego: ${origin}/actividad#${token} El enlace es personal y vence en 30 días.`,
      status: "pending",
      attempts: 0,
      nextAttemptAt: time,
      createdAt: time,
      expiresAt: time + 30 * 86400000,
    }
    const saved = await repo.register(a, name, !!input.participantId)
    return assignmentDto(saved, now())
  }
  return {
    register,
    async access(token: string) {
      if (!/^[a-f0-9]{64}$/.test(token))
        throw new RoomError("assignment_not_found")
      const a = await repo.byToken(await deps.crypto.hash(token))
      if (!a || a.expiresAt <= now())
        throw new RoomError("assignment_not_found")
      const actor = { tenantId: a.tenantId, userId: a.userId }
      const [room, participant] = await Promise.all([
        rooms.find(actor, a.roomId),
        rooms.participant(actor, a.roomId, a.participantId),
      ])
      if (!room || !participant || room.familyChildId || room.kind === "data")
        throw new RoomError("assignment_not_found")
      return { assignment: a, room, participant }
    },
    async retry(actor: Actor, roomId: string, participantId: string) {
      if (!(await rooms.teacher(actor))) throw new RoomError("teacher_required")
      const a = await repo.byParticipant(actor, roomId, participantId)
      if (!a) throw new RoomError("assignment_not_found")
      if (
        a.expiresAt <= now() ||
        !(await repo.retry(actor, roomId, participantId, deps.id(), now()))
      )
        throw new RoomError("assignment_conflict")
    },
  }
}
export type AssignmentService = ReturnType<typeof assignmentService>
// The gateway deduplicates by deliveryId. Reconcile ambiguous submissions before retrying.
export async function dispatchAssignments(
  repo: AssignmentRepository,
  messenger: AssignmentMessenger,
  now = Date.now()
) {
  for (const a of await repo.due(now)) {
    if (!(await repo.claim(a, now))) continue
    try {
      if (a.expiresAt <= now) {
        await repo.update(a, "expired", now)
        continue
      }
      const known = a.attempts ? await messenger.status(a.deliveryId) : null
      if (known) {
        await repo.update(a, known, now + 60000)
      } else if (a.attempts >= 5) {
        await repo.update(a, "failed", now)
      } else {
        await repo.update(a, await messenger.send(a), now + 60000)
      }
    } catch {
      // Acceptance may have happened. Keep the same delivery ID for reconciliation.
      await repo.update(
        a,
        a.attempts >= 5 ? "uncertain" : "pending",
        now + 60000 * 2 ** Math.min(a.attempts, 5)
      )
    }
  }
}
