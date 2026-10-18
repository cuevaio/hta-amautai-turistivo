import { test } from "node:test"
import assert from "node:assert/strict"
import {
  phoneEdit,
  nationalPhone,
  isPeruvianMobile,
} from "../src/shared/lib/peruvian-phone.ts"

test("phone edits accept up to nine digits and recognize a pasted Peruvian prefix", () => {
  for (const value of [
    "923253218",
    "923 253 218",
    "+51 923 253 218",
    "0051 923253218",
    "51923253218",
  ])
    assert.equal(phoneEdit(value), "923253218", value)
  for (const value of ["", "9", "92325321"])
    assert.equal(phoneEdit(value), value)
  assert.equal(nationalPhone("+51923253218"), "923253218")
})

test("overlong, nonnumeric and foreign edits are rejected without truncating a recipient", () => {
  for (const value of [
    "9232532180",
    "+51 9232532180",
    "abc923253218",
    "+1 2025550123",
    "92325e218",
  ])
    assert.equal(phoneEdit(value), null, value)
  assert.equal(isPeruvianMobile("923253218"), true)
  for (const value of ["92325321", "9232532180", "823253218", "+51923253218"])
    assert.equal(isPeruvianMobile(value), false)
})
