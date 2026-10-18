import { test } from "node:test"
import assert from "node:assert/strict"
import {
  initialMarket,
  marketTask,
  marketSolution,
  marketStep,
} from "../src/modules/rooms/domain/market.ts"
const participant = () => ({
  id: "p",
  name: "Student",
  score: 0,
  solved: 0,
  started: true,
  caught: 0,
  mistakes: 0,
  paused: false,
  activeMs: 0,
  lastEventAt: 0,
  version: 1,
})
const room = {
  id: "r",
  region: "coast",
  createdAt: "",
  kind: "market",
  mode: "practice",
}
test("first attempt, assisted answer and irreversible mistake penalties have distinct rewards", () => {
  const state = initialMarket(),
    p = participant(),
    answer = marketSolution(marketTask(state))
  assert.equal(marketStep(p, state, room, { answer }).participant.score, 100)
  const hint = marketStep(p, state, room, { help: true })
  assert.equal(
    marketStep(hint.participant, hint.state, room, { answer }).participant
      .score,
    40
  )
  const wrong = marketStep(p, state, room, { answer: 0 })
  const corrected = marketStep(wrong.participant, wrong.state, room, { answer })
  assert.equal(corrected.participant.score, 20)
  assert.equal(corrected.participant.mistakes, 1)
  assert.equal(corrected.state.evidence[0].assisted, 1)
  assert.equal(corrected.state.evidence[0].errors, 1)
  assert.equal(state.attempts, 0)
})
test("three wrong responses end the attempt and further answers cannot change it", () => {
  let p = participant(),
    state = initialMarket()
  for (let i = 0; i < 3; i++) {
    const result = marketStep(p, state, room, { answer: 0 })
    p = result.participant
    state = result.state
  }
  assert.equal(p.score, -60)
  assert.equal(p.mistakes, 3)
  assert.throws(
    () =>
      marketStep(p, state, room, { answer: marketSolution(marketTask(state)) }),
    { code: "room_conflict" }
  )
  assert.throws(() => marketStep(p, state, room, { help: true }), {
    code: "room_conflict",
  })
})
test("five independent responses per skill unlock that skill's next range", () => {
  let p = participant(),
    state = initialMarket()
  for (let i = 0; i < 20; i++) {
    const result = marketStep(p, state, room, {
      answer: marketSolution(marketTask(state)),
    })
    p = result.participant
    state = result.state
  }
  assert.deepEqual(state.bands, [1, 1, 1, 1])
  assert.equal(state.band, 1)
  assert.equal(p.score, 2200)
  assert.equal(state.streak, 20)
  assert.equal(
    state.evidence.reduce((n, e) => n + e.correct, 0),
    20
  )
})
test("competitive tasks stay equal across students and remain within 0–100 indefinitely", () => {
  let p = participant(),
    state = initialMarket()
  const challenge = { ...room, mode: "challenge" }
  for (let i = 0; i < 150; i++) {
    const task = marketTask(state),
      answer = marketSolution(task)
    assert.ok(answer >= 0 && answer <= 100)
    assert.ok(task.a >= 0 && task.a <= 100)
    const first = marketStep(p, state, challenge, { answer })
    const second = marketStep({ ...p, id: "other" }, state, challenge, {
      answer,
    })
    assert.deepEqual(marketTask(first.state), marketTask(second.state))
    assert.equal(first.participant.score, second.participant.score)
    p = first.participant
    state = first.state
  }
  assert.equal(p.solved, 150)
  assert.ok(p.score > 15000)
  assert.deepEqual(state.bands, [0, 0, 0, 0])
})
