import { test } from "node:test"
import assert from "node:assert/strict"
import {
  normalizeRegistrationPhone,
  isRegistrationPhoneValid,
  saveProfileRegistration,
} from "../src/features/profiles/model/registration.ts"

test("registration accepts complete local, formatted and country-prefixed Peruvian mobiles", () => {
  for (const input of [
    "999999999",
    "999 999 999",
    "+51 999 999 999",
    "51 (999) 999-999",
    "0051 999 999 999",
  ]) {
    const phone = normalizeRegistrationPhone(input)
    assert.equal(phone, "999999999", input)
    assert.equal(isRegistrationPhoneValid(phone), true, input)
  }
})
test("invalid or overlong phone numbers stay invalid instead of becoming another recipient", () => {
  for (const input of [
    "",
    "999 999",
    "123456789",
    "9999999990",
    "+51 9999999990",
    "+1 202 555 0123",
    "abc999999999",
  ])
    assert.equal(
      isRegistrationPhoneValid(normalizeRegistrationPhone(input)),
      false,
      input
    )
  assert.equal(normalizeRegistrationPhone("9999999990").length, 10)
})
const input = {
  role: "parent",
  phone: "+51999999999",
  consent: true,
  locale: "es-PE",
}
const profile = { role: "parent", updatedAt: "2026-10-18T12:00:00Z" }
test("a committed parent profile survives a failed family lookup and can be recovered by reading", async () => {
  let writes = 0,
    reads = 0
  const api = {
    async save() {
      writes++
      return { profile }
    },
    async getFamily() {
      reads++
      throw Error("temporary outage")
    },
  }
  const result = await saveProfileRegistration(api, input)
  assert.deepEqual(result, {
    profile,
    familyProfile: null,
    error: "temporary outage",
  })
  assert.equal(writes, 1)
  assert.equal(reads, 1)
  const family = {
    grade: 2,
    location: "Cusco",
    language: "Español",
    updatedAt: profile.updatedAt,
  }
  api.getFamily = async () => {
    reads++
    return { profile: family }
  }
  assert.deepEqual(await api.getFamily(), { profile: family })
  assert.equal(writes, 1)
})
test("failed saves propagate without attempting family onboarding; teachers skip the family API", async () => {
  let reads = 0
  await assert.rejects(
    () =>
      saveProfileRegistration(
        {
          async save() {
            throw Error("storage unavailable")
          },
          async getFamily() {
            reads++
            return { profile: null }
          },
        },
        input
      ),
    /storage unavailable/
  )
  assert.equal(reads, 0)
  const teacher = { ...profile, role: "teacher" }
  const result = await saveProfileRegistration(
    {
      async save() {
        return { profile: teacher }
      },
      async getFamily() {
        assert.fail("teacher should not call family endpoint")
      },
    },
    { ...input, role: "teacher" }
  )
  assert.deepEqual(result, { profile: teacher, familyProfile: null, error: "" })
})
