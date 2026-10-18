export type Actor = { tenantId: string; userId: string }
export type Region = "coast" | "highlands" | "jungle"
export type Room = { id: string; region: Region; createdAt: string }
export type Participant = {
  id: string
  name: string
  score: number
  solved: number
  started: boolean
  caught: number
  mistakes: number
  paused: boolean
  activeMs: number
  lastEventAt: number
  version: number
}
export const challenges = [
  { groupCount: 3, unitsPerGroup: 4 },
  { groupCount: 2, unitsPerGroup: 5 },
  { groupCount: 4, unitsPerGroup: 3 },
  { groupCount: 5, unitsPerGroup: 2 },
  { groupCount: 3, unitsPerGroup: 5 },
]
export class RoomError extends Error {
  code:
    | "room_not_found"
    | "participant_not_found"
    | "duplicate_participant"
    | "room_conflict"
    | "room_full"
    | "teacher_required"
    | "invalid_room_input"
  constructor(code: RoomError["code"]) {
    super(code)
    this.code = code
  }
}
export function participantName(value: string) {
  const name = value.normalize("NFKC").trim().replace(/\s+/gu, " ")
  if (!name || name.length > 80 || /[\p{Cc}\p{Cf}]/u.test(name))
    throw new RoomError("invalid_room_input")
  return { name, key: name.toLocaleLowerCase("es-PE") }
}
export function isSolution(index: number, groups: number[]) {
  const task = challenges[index]
  return (
    !!task &&
    groups.length === task.groupCount &&
    groups.every((n) => n === task.unitsPerGroup)
  )
}

export function challengeFor(level: number) {
  const base = challenges[level % challenges.length]!
  return {
    groupCount: base.groupCount + (Math.floor(level / challenges.length) % 3),
    unitsPerGroup: base.unitsPerGroup,
  }
}
export function catchFood(
  p: Participant,
  value: number,
  now: number
): Participant {
  const task = challengeFor(p.solved)
  if (
    !p.started ||
    p.paused ||
    p.mistakes >= 3 ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 10
  )
    throw new RoomError("room_conflict")
  const elapsed = p.activeMs + Math.max(0, now - p.lastEventAt)
  const correct = value === task.unitsPerGroup
  const caught = p.caught + Number(correct)
  const complete = caught === task.groupCount
  const bonus = complete
    ? Math.max(0, 20 - Math.floor(elapsed / (task.groupCount * 1000)))
    : 0
  return {
    ...p,
    score: p.score + (correct ? 20 : -15) + (complete ? 100 + bonus : 0),
    mistakes: p.mistakes + Number(!correct),
    caught: complete ? 0 : caught,
    solved: p.solved + Number(complete),
    activeMs: complete ? 0 : elapsed,
    lastEventAt: now,
    version: p.version + 1,
  }
}
