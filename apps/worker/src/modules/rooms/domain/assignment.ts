import { RoomError } from "./cargo.ts"
import type { Actor, Room, Participant } from "./cargo.ts"
export type AssignmentStatus =
  | "pending"
  | "dispatching"
  | "accepted"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "expired"
  | "cancelled"
  | "uncertain"
export type Assignment = Actor & {
  id: string
  roomId: string
  participantId: string
  guardianPhone: string
  tokenHash: string
  messageBody: string
  requestKey: string
  deliveryId: string
  status: AssignmentStatus
  attempts: number
  nextAttemptAt: number
  expiresAt: number
  createdAt: number
}
export type AssignedGame = {
  assignment: Assignment
  room: Room
  participant: Participant
}
export function guardianPhone(raw: string) {
  const compact = raw.trim().replace(/[ ()-]/g, "")
  // Local Peruvian mobile numbers default to +51; international numbers retain their code.
  const phone = /^9\d{8}$/.test(compact)
    ? "+51" + compact
    : compact.startsWith("+")
      ? compact
      : "+" + compact
  if (!/^\+[1-9]\d{7,14}$/.test(phone))
    throw new RoomError("invalid_guardian_phone")
  return phone
}
export function assignmentDto(a: Assignment, now: number) {
  return {
    expired: a.expiresAt <= now,
    status: a.status,
    guardianPhone: a.guardianPhone,
    expiresAt: new Date(a.expiresAt).toISOString(),
  }
}
