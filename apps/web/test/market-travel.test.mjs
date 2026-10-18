import { test } from "node:test"
import assert from "node:assert/strict"
import {
  approachMarket,
  marketTapTarget,
  marketZoneAt,
  marketBounds,
} from "../src/game-runtime/market-controls.ts"
import { MarketDeliveryGate } from "../src/game-runtime/market-delivery.ts"

test("tap destinations exclude HUD and inventory and reach the actual station zones", () => {
  assert.equal(marketTapTarget({ x: 135, y: 60 }), null)
  assert.equal(marketTapTarget({ x: 480, y: 470 }), null)
  assert.equal(marketZoneAt(marketTapTarget({ x: 135, y: 275 })), "source")
  assert.equal(marketZoneAt(marketTapTarget({ x: 820, y: 275 })), "market")
})
test("tap travel stops at destination and evaluates once per visit", () => {
  const gate = new MarketDeliveryGate()
  let position = { x: 245, y: 346 },
    arrivals = 0
  for (let time = 0; time < 8000; time += 16) {
    const next = approachMarket(position, { x: 700, y: 346 }, 16)
    position = next.position
    assert.ok(
      position.x >= marketBounds.left && position.x <= marketBounds.right
    )
    assert.ok(
      position.y >= marketBounds.top && position.y <= marketBounds.bottom
    )
    if (gate.tick(marketZoneAt(position), true, next.arrived, time)) arrivals++
  }
  assert.deepEqual(position, { x: 700, y: 346 })
  assert.equal(arrivals, 1)
})
test("tap travel bounds long frames and does not move for a negative delta", () => {
  const start = { x: 480, y: 346 },
    target = { x: 245, y: 346 }
  assert.deepEqual(
    approachMarket(start, target, 5000),
    approachMarket(start, target, 50)
  )
  assert.deepEqual(approachMarket(start, target, -10).position, start)
})
