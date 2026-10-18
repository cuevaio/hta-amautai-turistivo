import { test } from "node:test"
import assert from "node:assert/strict"
import {
  builderLayout,
  builderDropAt,
  builderPoint,
} from "../src/game-runtime/builder-geometry.ts"
test("all shapes have distinct reachable targets and generous deliberate drop zones", () => {
  for (const compact of [false, true]) {
    const l = builderLayout(compact)
    for (const [i, s] of l.slots.entries()) {
      assert.ok(builderDropAt(s.x, s.y, i, compact))
      assert.ok(!builderDropAt(0, 0, i, compact))
      assert.ok(
        s.x - s.w / 2 > l.board.x && s.x + s.w / 2 < l.width - l.board.x
      )
      for (const p of l.pieces)
        assert.equal(builderDropAt(p.x, p.y, i, compact), false)
    }
    assert.equal(builderDropAt(300, 400, 3, compact), false)
  }
})
test("touch and desktop drop coordinates account for responsive canvas scaling", () => {
  for (const compact of [false, true]) {
    const l = builderLayout(compact),
      rect = {
        left: 35,
        top: 120,
        width: l.width * 0.55,
        height: l.height * 0.55,
      }
    for (const s of l.slots) {
      const p = builderPoint(
        rect.left + s.x * 0.55,
        rect.top + s.y * 0.55,
        rect,
        compact
      )
      assert.ok(Math.abs(p.x - s.x) < 1e-8)
      assert.ok(Math.abs(p.y - s.y) < 1e-8)
    }
  }
})
