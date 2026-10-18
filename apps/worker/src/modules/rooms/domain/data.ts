import { RoomError } from "./cargo.ts"
import type { Participant, Room } from "./cargo.ts"
import { initialLearning, learningStep } from "./learning.ts"
import type { LearningState } from "./learning.ts"
export type DataState = LearningState & { cursor: number; datasetBand: number }
export const initialData = (): DataState => ({
  ...initialLearning(4),
  cursor: 0,
  datasetBand: 0,
})
export function dataTask(s: DataState) {
  const skill = s.sequence % 4,
    round = Math.floor(s.sequence / 4)
  // The same dataset persists across the four missions, even if an individual skill changes band.
  const unit: 1 | 2 = s.datasetBand === 2 ? 2 : 1
  const quantities =
    s.datasetBand === 0
      ? [1 + (round % 2), 2 + (round % 2), 3 + (round % 2)]
      : [2 + (round % 2), 4 + (round % 2), 6 + (round % 2)]
  const offset = round % 3
  const counts = quantities.map((_, i) => quantities[(i + offset) % 3]! * unit)
  const votes = counts.flatMap((n, i) =>
    Array.from({ length: n / unit }, () => i)
  )
  // Deterministic Fisher-Yates keeps identical challenge sequences across regions/devices.
  let seed = round + 17
  for (let i = votes.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const j = seed % (i + 1)
    ;[votes[i], votes[j]] = [votes[j]!, votes[i]!]
  }
  const cursor = skill === 0 ? s.cursor : votes.length
  const registered = [0, 0, 0]
  for (const v of votes.slice(0, cursor)) registered[v]! += unit
  const category = (round + 1) % 3,
    compare = (category + 1) % 3
  const answer =
    skill === 0
      ? votes[cursor]!
      : skill === 1
        ? counts[category]!
        : skill === 2
          ? counts.indexOf(Math.max(...counts))
          : Math.abs(counts[category]! - counts[compare]!)
  let choices: number[]
  if (skill === 0 || skill === 2) choices = [0, 1, 2]
  else {
    const alternatives = Array.from({ length: 21 }, (_, i) => i)
      .filter((n) => n !== answer)
      .sort((a, b) => Math.abs(a - answer) - Math.abs(b - answer) || a - b)
    choices = [answer, ...alternatives.slice(0, 2)].sort((a, b) => a - b)
    for (let i = 0; i < (round + skill) % 3; i++) choices.push(choices.shift()!)
  }
  return {
    id: s.sequence,
    skill,
    band: s.datasetBand,
    counts,
    registered,
    votes,
    cursor,
    unit,
    category,
    compare,
    choices,
  }
}
export function dataAnswer(t: ReturnType<typeof dataTask>) {
  return t.skill === 0
    ? t.votes[t.cursor]!
    : t.skill === 1
      ? t.counts[t.category]!
      : t.skill === 2
        ? t.counts.indexOf(Math.max(...t.counts))
        : Math.abs(t.counts[t.category]! - t.counts[t.compare]!)
}
export function dataStep(
  p: Participant,
  s: DataState,
  r: Room,
  action: { answer?: number; help?: boolean }
) {
  if (!p.started || p.mistakes >= 3) throw new RoomError("room_conflict")
  const t = dataTask(s)
  if (
    !action.help &&
    (!Number.isInteger(action.answer) || !t.choices.includes(action.answer!))
  )
    throw new RoomError("invalid_room_input")
  const correct = action.answer === dataAnswer(t)
  if (
    !action.help &&
    correct &&
    t.skill === 0 &&
    s.cursor < t.votes.length - 1
  ) {
    return {
      participant: { ...p, version: p.version + 1 },
      state: { ...structuredClone(s), cursor: s.cursor + 1 },
      feedback: "" as const,
      delta: 0,
    }
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
      datasetBand:
        result.feedback === "correct" && result.state.sequence % 4 === 0
          ? r.mode === "challenge"
            ? result.state.band
            : Math.min(...result.state.bands)
          : s.datasetBand,
    },
  }
}
