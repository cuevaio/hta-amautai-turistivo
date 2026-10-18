import { useState } from "react"

const challenges = [
  { groupCount: 3, unitsPerGroup: 4 },
  { groupCount: 2, unitsPerGroup: 5 },
  { groupCount: 4, unitsPerGroup: 3 },
] as const

type Feedback = "correct" | "wrong" | "win" | ""
type State = {
  started: boolean
  solved: number
  caught: number
  mistakes: number
  score: number
  feedback: Feedback
  feedbackVersion: number
}

const freshState = (): State => ({
  started: false,
  solved: 0,
  caught: 0,
  mistakes: 0,
  score: 0,
  feedback: "",
  feedbackVersion: 0,
})

export function useFamilyGame() {
  const [state, setState] = useState(freshState)
  const challenge = challenges[Math.min(state.solved, challenges.length - 1)]!
  const finished = state.solved === challenges.length || state.mistakes >= 3

  function collect(value: number | null) {
    if (value === null || !state.started || finished) return
    const correct = value === challenge.unitsPerGroup
    const caught = state.caught + Number(correct)
    const complete = correct && caught === challenge.groupCount
    setState({
      ...state,
      solved: state.solved + Number(complete),
      caught: complete ? 0 : caught,
      mistakes: state.mistakes + Number(!correct),
      score: state.score + (correct ? 20 : -15) + (complete ? 100 : 0),
      feedback: complete ? "win" : correct ? "correct" : "wrong",
      feedbackVersion: state.feedbackVersion + 1,
    })
  }

  return {
    state,
    challenge,
    finished,
    start: () => setState({ ...freshState(), started: true }),
    restart: () => setState(freshState),
    collect,
  }
}
