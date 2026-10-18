import { RoomError } from "./cargo.ts"
import type { Participant, Room } from "./cargo.ts"
import { initialLearning, learningStep } from "./learning.ts"
import type { LearningState } from "./learning.ts"
export type MarketState = LearningState
export const initialMarket = () => initialLearning(4)
export function marketTask(s: MarketState) {
  const skill = s.sequence % 4,
    maximum = [10, 20, 100][s.band]!
  const total =
    maximum === 100
      ? 25 + ((s.sequence * 13 + 18) % 76)
      : 4 + ((s.sequence * 7 + 4) % (maximum - 3))
  const part = 1 + ((s.sequence * 3 + 2) % (total - 1))
  const subtract = skill % 2 === 1
  return {
    id: s.sequence,
    skill,
    band: s.band,
    a: subtract ? total : part,
    b: subtract ? part : total - part,
    operation: subtract ? ("−" as const) : ("+" as const),
    missing: skill >= 2,
  }
}
export function marketSolution(task: ReturnType<typeof marketTask>) {
  return task.missing
    ? task.b
    : task.operation === "+"
      ? task.a + task.b
      : task.a - task.b
}
export function marketStep(
  p: Participant,
  s: MarketState,
  r: Room,
  action: { answer?: number; help?: boolean }
) {
  if (
    !action.help &&
    (!Number.isInteger(action.answer) ||
      action.answer! < 0 ||
      action.answer! > 100)
  )
    throw new RoomError("invalid_room_input")
  const task = marketTask(s)
  return learningStep(p, s, r, {
    skill: task.skill,
    correct: action.answer === marketSolution(task),
    help: action.help,
  })
}
