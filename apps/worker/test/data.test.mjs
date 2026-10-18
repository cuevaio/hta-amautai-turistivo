import { test } from "node:test"
import assert from "node:assert/strict"
import {
  initialData,
  dataTask,
  dataAnswer,
  dataStep,
} from "../src/modules/rooms/domain/data.ts"
const participant = () => ({
  id: "p",
  name: "Test",
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
  kind: "data",
  mode: "practice",
}
test("data generators preserve a dataset across missions and use accurate unit keys", () => {
  for (let datasetBand = 0; datasetBand < 3; datasetBand++)
    for (let round = 0; round < 300; round++) {
      const s = { ...initialData(), sequence: round * 4, datasetBand }
      const first = dataTask(s)
      assert.equal(new Set(first.counts).size, 3)
      assert.ok(first.counts.every((n) => n >= 1 && n <= 14))
      assert.deepEqual(
        first.votes.reduce((a, v) => ((a[v] += first.unit), a), [0, 0, 0]),
        first.counts
      )
      for (let skill = 0; skill < 4; skill++) {
        const t = dataTask({ ...s, sequence: round * 4 + skill })
        assert.deepEqual(t.counts, first.counts)
        assert.ok(t.choices.includes(dataAnswer(t)))
        assert.equal(t.choices.length, 3)
        assert.equal(new Set(t.choices).size, 3)
        if (skill > 0) assert.deepEqual(t.registered, t.counts)
      }
    }
})
test("votes persist one by one; completing classification scores once, not per tap", () => {
  let p = participant(),
    s = initialData()
  const t = dataTask(s)
  for (let i = 0; i < t.votes.length; i++) {
    const a = dataStep(p, s, room, { answer: dataAnswer(dataTask(s)) })
    p = a.participant
    s = a.state
    assert.equal(a.delta, i === t.votes.length - 1 ? 100 : 0)
    if (i < t.votes.length - 1) {
      assert.equal(s.cursor, i + 1)
      assert.equal(s.sequence, 0)
      assert.equal(
        dataTask(s).registered.reduce((a, b) => a + b),
        i + 1
      )
    }
  }
  assert.equal(p.solved, 1)
  assert.equal(p.score, 100)
  assert.equal(s.sequence, 1)
  assert.equal(s.cursor, 0)
})
test("misclassification costs once, retains vote, marks help, and third error persists loss", () => {
  let p = participant(),
    s = initialData()
  const correct = dataAnswer(dataTask(s)),
    wrong = (correct + 1) % 3
  for (let i = 0; i < 3; i++) {
    const a = dataStep(p, s, room, { answer: wrong })
    p = a.participant
    s = a.state
    assert.equal(s.cursor, 0)
  }
  assert.equal(p.score, -60)
  assert.equal(p.mistakes, 3)
  assert.throws(() => dataStep(p, s, room, { answer: correct }), {
    code: "room_conflict",
  })
  assert.throws(
    () => dataStep(participant(), initialData(), room, { answer: 8 }),
    { code: "invalid_room_input" }
  )
})
test("data practice adapts after independent evidence; challenge stays reproducible and unbounded", () => {
  let p = participant(),
    s = initialData()
  while (s.sequence < 20) {
    const a = dataStep(p, s, room, { answer: dataAnswer(dataTask(s)) })
    p = a.participant
    s = a.state
  }
  assert.deepEqual(s.bands, [1, 1, 1, 1])
  assert.equal(s.datasetBand, 1)
  assert.equal(p.score, 2200)
  p = participant()
  s = initialData()
  while (s.sequence < 200) {
    const input = { answer: dataAnswer(dataTask(s)) }
    const a = dataStep(p, s, { ...room, mode: "challenge" }, input),
      b = dataStep(
        { ...p, id: "q" },
        s,
        { ...room, region: "jungle", mode: "challenge" },
        input
      )
    assert.deepEqual(a.state, b.state)
    assert.equal(a.delta, b.delta)
    p = a.participant
    s = a.state
  }
  assert.ok(p.score >= 22000)
})
