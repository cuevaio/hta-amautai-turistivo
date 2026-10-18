import { test } from "node:test"
import assert from "node:assert/strict"
import {
  moveBird,
  canCatch,
  flightBounds,
} from "../src/game-runtime/cargo-controls.ts"
test("bird moves in both axes, with equal diagonal speed and bounded frame delta", () => {
  const start = { x: 400, y: 300 }
  const right = moveBird(start, { x: 1, y: 0 }, 40)
  assert.ok(right.x > start.x)
  assert.equal(right.y, start.y)
  const up = moveBird(start, { x: 0, y: -1 }, 40)
  assert.ok(up.y < start.y)
  const diagonal = moveBird(start, { x: 1, y: 1 }, 40)
  assert.ok(
    Math.abs(
      Math.hypot(diagonal.x - start.x, diagonal.y - start.y) -
        (right.x - start.x)
    ) < 1e-9
  )
  assert.deepEqual(
    moveBird(start, { x: 1, y: 0 }, 10000),
    moveBird(start, { x: 1, y: 0 }, 50)
  )
  assert.deepEqual(moveBird(start, { x: 1, y: 0 }, -10), start)
  assert.deepEqual(moveBird(start, { x: 0, y: 0 }, 40), start)
})
test("bird stays inside the sky below the score panel", () => {
  assert.equal(
    moveBird({ x: flightBounds.right, y: 300 }, { x: 1, y: 0 }, 50).x,
    flightBounds.right
  )
  assert.equal(
    moveBird({ x: flightBounds.left, y: 300 }, { x: -1, y: 0 }, 50).x,
    flightBounds.left
  )
  assert.equal(
    moveBird({ x: 400, y: flightBounds.top }, { x: 0, y: -1 }, 50).y,
    flightBounds.top
  )
  assert.equal(
    moveBird({ x: 400, y: flightBounds.bottom }, { x: 0, y: 1 }, 50).y,
    flightBounds.bottom
  )
  assert.ok(flightBounds.right + 70 < 960)
  assert.ok(flightBounds.top > 104)
})
test("only contact with the bird captures a collectible; the rocket cannot collect", () => {
  const bird = { x: 430, y: 390 }
  assert.equal(canCatch(bird, { x: 460, y: 400 }), true)
  assert.equal(canCatch(bird, { x: 430, y: 440 }), false)
  assert.equal(canCatch(bird, { x: 860, y: 540 }), false)
  assert.equal(canCatch(bird, { x: 500, y: 390 }), false)
})
