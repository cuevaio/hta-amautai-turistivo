import { RoomError } from "./cargo.ts"
import type { Participant, Room } from "./cargo.ts"
import { initialLearning, learningStep } from "./learning.ts"
import type { LearningState } from "./learning.ts"
export type Shape = "triangle" | "square" | "rectangle" | "circle"
export type BuilderState = LearningState & { cursor: number }
export const initialBuilder = (): BuilderState => ({
  ...initialLearning(3),
  cursor: 0,
})
export function builderTask(s: BuilderState) {
  const skill = s.sequence % 3,
    rotatable = skill === 2 && s.band > 0
  const window: Shape = s.band > 0 && s.sequence % 2 === 1 ? "circle" : "square"
  const targets: Shape[] = ["rectangle", "triangle", window]
  const shapes: Shape[] = ["triangle", window, "rectangle"]
  for (let i = 0; i < s.sequence % 3; i++) shapes.push(shapes.shift()!)
  const pieces = shapes.map((shape) => ({
    shape,
    rotation:
      rotatable && shape === "triangle"
        ? 1 + (Math.floor(s.sequence / 3) % 3)
        : 0,
  }))
  return {
    id: s.sequence,
    skill,
    band: s.band,
    cursor: s.cursor,
    targets,
    pieces,
    rotatable,
  }
}
export function builderFits(shape: Shape, rotation: number, target: Shape) {
  if (shape !== target) return false
  const period = shape === "triangle" ? 4 : shape === "rectangle" ? 2 : 1
  return rotation % period === 0
}
export function builderStep(
  p: Participant,
  s: BuilderState,
  r: Room,
  action: { shape?: Shape; rotation?: number; help?: boolean }
) {
  if (!p.started || p.mistakes >= 3) throw new RoomError("room_conflict")
  const t = builderTask(s)
  if (
    !action.help &&
    (!t.pieces.some((v) => v.shape === action.shape) ||
      !Number.isInteger(action.rotation) ||
      action.rotation! < 0 ||
      action.rotation! > 3 ||
      (!t.rotatable && action.rotation !== 0))
  )
    throw new RoomError("invalid_room_input")
  const correct =
    !!action.shape &&
    builderFits(action.shape, action.rotation!, t.targets[s.cursor]!)
  if (!action.help && correct && s.cursor < 2)
    return {
      participant: { ...p, version: p.version + 1 },
      state: { ...structuredClone(s), cursor: s.cursor + 1 },
      feedback: "" as const,
      delta: 0,
    }
  const result = learningStep(p, s, r, {
    skill: t.skill,
    correct,
    help: action.help,
  })
  return {
    ...result,
    state: {
      ...result.state,
      cursor: result.feedback === "correct" ? 0 : s.cursor,
    },
  }
}
