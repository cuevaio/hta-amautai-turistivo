import { test } from "node:test"
import assert from "node:assert/strict"
import { MarketDeliveryGate } from "../src/game-runtime/market-delivery.ts"
test("a stopped arrival submits once, even after the next task or API response", () => {
  const gate = new MarketDeliveryGate()
  assert.equal(gate.tick("road", true, true, 0), false)
  assert.equal(gate.tick("market", true, false, 100), false)
  assert.equal(gate.tick("market", true, true, 200), false)
  assert.equal(gate.tick("market", true, true, 399), false)
  assert.equal(gate.tick("market", true, true, 400), true)
  for (let time = 500; time <= 10000; time += 100)
    assert.equal(gate.tick("market", true, true, time), false)
  assert.equal(gate.tick("market", false, true, 11000), false)
  assert.equal(gate.tick("market", true, true, 12000), false)
})
test("leaving and returning creates exactly one further attempt", () => {
  const gate = new MarketDeliveryGate()
  gate.tick("market", true, true, 0)
  assert.equal(gate.tick("market", true, true, 200), true)
  gate.tick("road", true, false, 300)
  gate.tick("market", true, true, 600)
  assert.equal(gate.tick("market", true, true, 800), true)
  assert.equal(gate.tick("market", true, true, 1000), false)
})
test("moving or disabled arrival cannot consume an attempt", () => {
  const gate = new MarketDeliveryGate()
  gate.tick("market", true, true, 0)
  gate.tick("market", false, true, 100)
  assert.equal(gate.tick("market", false, true, 1000), false)
  gate.tick("market", true, false, 1100)
  gate.tick("market", true, true, 1200)
  assert.equal(gate.tick("market", true, true, 1400), true)
})
