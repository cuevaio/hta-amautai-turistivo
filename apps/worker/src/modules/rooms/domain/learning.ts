import { RoomError } from "./cargo.ts"
import type { Participant, Room } from "./cargo.ts"
export type LearningState = {
  sequence: number
  band: number
  helped: boolean
  attempts: number
  streak: number
  bands: number[]
  recent: number[][]
  evidence: { correct: number; assisted: number; errors: number }[]
}
export function initialLearning(skills = 4): LearningState {
  return {
    sequence: 0,
    band: 0,
    helped: false,
    attempts: 0,
    streak: 0,
    bands: Array.from({ length: skills }, () => 0),
    recent: Array.from({ length: skills }, () => []),
    evidence: Array.from({ length: skills }, () => ({
      correct: 0,
      assisted: 0,
      errors: 0,
    })),
  }
}
export function learningStep(
  p: Participant,
  s: LearningState,
  r: Room,
  action: { skill: number; correct?: boolean; help?: boolean }
) {
  if (!p.started || p.mistakes >= 3) throw new RoomError("room_conflict")
  const state = structuredClone(s)
  const next = { ...p, version: p.version + 1 }
  if (action.help) {
    state.helped = true
    state.streak = 0
    return { participant: next, state, feedback: "help" as const, delta: 0 }
  }
  const correct = action.correct === true
  if (!correct) {
    next.score -= 20
    next.mistakes++
    state.attempts++
    state.helped = true
    state.streak = 0
    state.evidence[action.skill]!.errors++
    return { participant: next, state, feedback: "wrong" as const, delta: -20 }
  }
  const independent = !state.helped && state.attempts === 0
  state.streak = independent ? state.streak + 1 : 0
  const delta =
    (independent ? 100 : 40) +
    (state.streak > 0 && state.streak % 5 === 0 ? 50 : 0)
  if (!Number.isSafeInteger(next.score + delta))
    throw new RoomError("room_conflict")
  next.score += delta
  next.solved++
  const evidence = state.evidence[action.skill]!
  if (independent) evidence.correct++
  else evidence.assisted++
  const recent = state.recent[action.skill]!
  recent.push(Number(independent))
  if (recent.length > 5) recent.shift()
  if (r.mode === "practice") {
    if (recent.length === 5 && recent.reduce((a, b) => a + b, 0) >= 4) {
      state.bands[action.skill] = Math.min(2, state.bands[action.skill]! + 1)
      state.recent[action.skill] = []
    } else if (
      recent.length >= 3 &&
      recent.slice(-3).filter((n) => n === 0).length >= 2
    ) {
      state.bands[action.skill] = Math.max(0, state.bands[action.skill]! - 1)
      state.recent[action.skill] = []
    }
  }
  state.sequence++
  state.attempts = 0
  const nextSkill = state.sequence % state.bands.length
  state.band =
    r.mode === "challenge"
      ? Math.floor(state.sequence / 8) % 3
      : state.bands[nextSkill]!
  state.helped =
    r.mode === "practice" &&
    state.recent[nextSkill]!.slice(-2).filter((n) => n === 0).length >= 2
  return { participant: next, state, feedback: "correct" as const, delta }
}
