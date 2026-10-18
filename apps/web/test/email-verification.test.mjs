import { test } from "node:test"
import assert from "node:assert/strict"
import { createEmailVerification } from "../src/features/auth/model/email-verification.ts"

test("one submission recovers a transient session failure without consuming the code twice", async () => {
  let writes = 0,
    reads = 0
  const verification = createEmailVerification(async (code) => {
    assert.equal(code, "012345")
    writes++
  })
  assert.equal(
    await verification.continue("012345", async () => ++reads === 2),
    "complete"
  )
  assert.equal(writes, 1)
  assert.equal(reads, 2)
  assert.equal(verification.isAccepted(), true)
})

test("persistent session failures preserve accepted verification for a later read-only retry", async () => {
  let writes = 0,
    reads = 0
  const verification = createEmailVerification(async () => {
    writes++
  })
  assert.equal(
    await verification.continue("123456", async () => {
      reads++
      return false
    }),
    "session-unavailable"
  )
  assert.equal(reads, 2)
  assert.equal(await verification.continue("", async () => true), "complete")
  assert.equal(writes, 1)
})

test("invalid input and rejected codes remain retryable; concurrent submits do not duplicate requests", async () => {
  let writes = 0,
    finish
  const verification = createEmailVerification(async () => {
    writes++
    if (writes === 1) throw Error("incorrect code")
    await new Promise((resolve) => {
      finish = resolve
    })
  })
  const read = async () => true
  await assert.rejects(() => verification.continue("12x456", read), /6 dígitos/)
  assert.equal(writes, 0)
  await assert.rejects(
    () => verification.continue("123456", read),
    /incorrect code/
  )
  assert.equal(verification.isAccepted(), false)
  const first = verification.continue("654321", read)
  assert.equal(await verification.continue("654321", read), "pending")
  finish()
  assert.equal(await first, "complete")
  assert.equal(writes, 2)
})
