import { RoomError } from "./cargo.ts"
import type { Participant, Room } from "./cargo.ts"
import { initialLearning, learningStep } from "./learning.ts"
import type { LearningState } from "./learning.ts"
export type NurseryState = LearningState
export const initialNursery = () => initialLearning(3)
export function nurseryTask(s: NurseryState) {
  const skill = s.sequence % 3
  const max = [19, 49, 99][s.band]!
  const target = 10 + ((s.sequence * 17 + 7) % (max - 9))
  return {
    id: s.sequence,
    skill,
    band: s.band,
    target,
    initialTrays: skill === 2 ? Math.floor(target / 10) : 0,
    initialUnits: skill === 1 ? target : skill === 2 ? target % 10 : 0,
  }
}
export function nurseryCorrect(
  task: ReturnType<typeof nurseryTask>,
  trays: number,
  units: number
) {
  return (
    trays * 10 + units === task.target &&
    (task.skill !== 1 || units < 10) &&
    (task.skill !== 2 || units >= 10)
  )
}
export function nurseryStep(
  p: Participant,
  s: NurseryState,
  r: Room,
  action: { trays?: number; units?: number; help?: boolean }
) {
  const task = nurseryTask(s)
  if (
    !action.help &&
    (!Number.isInteger(action.trays) ||
      !Number.isInteger(action.units) ||
      action.trays! < 0 ||
      action.trays! > 9 ||
      action.units! < 0 ||
      action.units! > 99 ||
      action.trays! * 10 + action.units! > 99)
  )
    throw new RoomError("invalid_room_input")
  return learningStep(p, s, r, {
    skill: task.skill,
    help: action.help,
    correct: nurseryCorrect(task, action.trays ?? 0, action.units ?? 0),
  })
}
