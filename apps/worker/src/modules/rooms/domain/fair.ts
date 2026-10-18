import { RoomError } from "./cargo.ts"
import type { Participant, Room } from "./cargo.ts"
import { initialLearning, learningStep } from "./learning.ts"
import type { LearningState } from "./learning.ts"
export type FairState = LearningState
export const initialFair = () => initialLearning(4)
export function fairTask(s: FairState) {
  const skill = s.sequence % 4
  const max = [10, 15, 20][s.band]!
  const target = 4 + ((s.sequence * 11 + 4) % (max - 3))
  const operation = skill === 2 ? ("remove" as const) : ("add" as const)
  const base =
    skill === 0
      ? 0
      : skill === 2
        ? target + 1 + ((s.sequence * 3) % Math.max(1, max - target))
        : Math.min(17, 1 + ((s.sequence * 3 + 2) % (target - 1)))
  // A subtraction target at the upper bound needs room to remove at least one.
  const finalTarget = operation === "remove" && base > max ? max - 1 : target
  const boundedBase = Math.min(base, max)
  const answer =
    operation === "remove" ? boundedBase - finalTarget : finalTarget - base
  const limit = operation === "remove" ? boundedBase : 20 - boundedBase
  const candidates = Array.from({ length: limit }, (_, i) => i + 1)
    .filter((n) => n !== answer)
    .sort((a, b) => Math.abs(a - answer) - Math.abs(b - answer) || a - b)
  const choices = [answer, ...candidates.slice(0, 2)].sort((a, b) => a - b)
  // Rotate the answer position deterministically; it must not always be the largest packet.
  for (let i = 0; i < s.sequence % 3; i++) choices.push(choices.shift()!)
  const leftA = skill === 3 ? 1 + (s.sequence % (finalTarget - 1)) : finalTarget
  return {
    id: s.sequence,
    skill,
    band: s.band,
    target: finalTarget,
    base: boundedBase,
    leftA,
    leftB: skill === 3 ? finalTarget - leftA : 0,
    operation,
    choices,
  }
}
export function fairAnswer(t: ReturnType<typeof fairTask>) {
  return t.operation === "remove" ? t.base - t.target : t.target - t.base
}
export function fairStep(
  p: Participant,
  s: FairState,
  r: Room,
  action: { answer?: number; help?: boolean }
) {
  const task = fairTask(s)
  if (
    !action.help &&
    (!Number.isInteger(action.answer) || !task.choices.includes(action.answer!))
  )
    throw new RoomError("invalid_room_input")
  return learningStep(p, s, r, {
    skill: task.skill,
    help: action.help,
    correct: action.answer === fairAnswer(task),
  })
}
