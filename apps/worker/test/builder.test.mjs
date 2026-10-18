import { test } from "node:test"
import assert from "node:assert/strict"
import {
  initialBuilder,
  builderTask,
  builderFits,
  builderStep,
} from "../src/modules/rooms/domain/builder.ts"
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
  kind: "builder",
  mode: "practice",
}
const answer = (s) => ({ shape: builderTask(s).targets[s.cursor], rotation: 0 })
test("builder tasks always offer all three targets and begin without rotation", () => {
  for (let band = 0; band < 3; band++)
    for (let sequence = 0; sequence < 600; sequence++) {
      const t = builderTask({ ...initialBuilder(), band, sequence })
      assert.equal(t.targets.length, 3)
      assert.equal(new Set(t.pieces.map((p) => p.shape)).size, 3)
      for (const target of t.targets)
        assert.ok(t.pieces.some((p) => p.shape === target))
      assert.equal(t.rotatable, band > 0 && sequence % 3 === 2)
      if (!t.rotatable) assert.ok(t.pieces.every((p) => p.rotation === 0))
    }
})
test("geometry accepts actual rotational symmetries rather than arbitrary sprite angles", () => {
  for (let r = 0; r < 4; r++) {
    assert.equal(builderFits("triangle", r, "triangle"), r === 0)
    assert.equal(builderFits("rectangle", r, "rectangle"), r % 2 === 0)
    assert.equal(builderFits("square", r, "square"), true)
    assert.equal(builderFits("circle", r, "circle"), true)
    assert.equal(builderFits("rectangle", r, "square"), false)
  }
})
test("three confirmed pieces complete one construction and award one reward", () => {
  let p = participant(),
    s = initialBuilder()
  for (let i = 0; i < 3; i++) {
    const result = builderStep(p, s, room, answer(s))
    p = result.participant
    s = result.state
    assert.equal(result.delta, i === 2 ? 100 : 0)
  }
  assert.equal(s.sequence, 1)
  assert.equal(s.cursor, 0)
  assert.equal(p.solved, 1)
  assert.equal(p.score, 100)
})
test("wrong shape/orientation, assistance and loss retain the construction until explicit retry", () => {
  let p = participant(),
    s = initialBuilder()
  let result = builderStep(p, s, room, { shape: "triangle", rotation: 0 })
  p = result.participant
  s = result.state
  assert.equal(s.cursor, 0)
  assert.equal(p.score, -20)
  result = builderStep(p, s, room, { help: true })
  p = result.participant
  s = result.state
  for (let i = 0; i < 3; i++) {
    result = builderStep(p, s, room, answer(s))
    p = result.participant
    s = result.state
  }
  assert.equal(p.score, 20)
  assert.equal(s.evidence[0].assisted, 1)
  for (let i = 0; i < 2; i++) {
    result = builderStep(p, s, room, { shape: "triangle", rotation: 0 })
    p = result.participant
    s = result.state
  }
  assert.equal(p.mistakes, 3)
  assert.throws(() => builderStep(p, s, room, answer(s)), {
    code: "room_conflict",
  })
  for (const rotation of [-1, 4, 1.5, NaN])
    assert.throws(
      () =>
        builderStep(participant(), initialBuilder(), room, {
          shape: "rectangle",
          rotation,
        }),
      { code: "invalid_room_input" }
    )
})
test("challenge scores and geometric tasks remain comparable across regions and continue without a fixed cap", () => {
  let p = participant(),
    s = initialBuilder()
  while (s.sequence < 200) {
    const a = builderStep(p, s, { ...room, mode: "challenge" }, answer(s)),
      b = builderStep(
        { ...p, id: "q" },
        s,
        { ...room, region: "jungle", mode: "challenge" },
        answer(s)
      )
    assert.deepEqual(a.state, b.state)
    assert.equal(a.delta, b.delta)
    p = a.participant
    s = a.state
  }
  assert.equal(p.score, 22000)
})
