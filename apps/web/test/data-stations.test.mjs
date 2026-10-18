import { test } from "node:test"
import assert from "node:assert/strict"
import { dataLayout, dataStationAt } from "../src/game-runtime/data-stations.ts"
import { FairVisitGate } from "../src/game-runtime/fair-stations.ts"
test("data destinations are reachable, distinct and consistent in both layouts", () => {
  for (const compact of [false, true]) {
    const l = dataLayout(compact)
    for (const [i, p] of l.supplies.entries()) {
      assert.equal(dataStationAt(p.x, p.y, compact), i)
      assert.ok(p.y >= l.bounds.top && p.y <= l.bounds.bottom)
    }
    assert.equal(dataStationAt(l.delivery.x, l.delivery.y, compact), "delivery")
    assert.equal(dataStationAt(l.spawn.x, l.spawn.y, compact), null)
  }
})
test("recording and pending response cannot repeatedly consume the same visit", () => {
  const g = new FairVisitGate()
  assert.equal(g.update(0, 0, true, true), false)
  assert.equal(g.update(0, 250, true, true), true)
  assert.equal(g.update(0, 600, true, false), false)
  assert.equal(g.update(0, 1000, true, true), false)
  g.update(null, 1100, true, true)
  g.update(0, 1200, true, true)
  assert.equal(g.update(0, 1500, true, true), true)
})

test("category names, compact controls, character and source never cover each other", () => {
  for (const compact of [false, true]) {
    const l = dataLayout(compact),
      labelBottom = l.labelTop + l.labelHeight
    assert.ok(l.supplyTop >= labelBottom + 8)
    assert.equal(l.supplyHeight, 46)
    for (const p of l.supplies) {
      assert.ok(p.y - 110 >= labelBottom + 5)
      assert.ok(l.sourceTop > p.y + 25)
    }
    assert.ok(l.cardWidth < 200)
  }
})
