import { test } from "node:test"
import assert from "node:assert/strict"
import {
  familyHomePath,
  familyPlayPath,
  familyCatalog,
} from "../src/features/rooms/model/family-catalog.ts"
import {
  spanishMessages,
  chankaMessages,
  aymaraMessages,
} from "../src/shared/i18n/messages.ts"
test("family return links restore the selected child and keep identifiers encoded", () => {
  assert.equal(familyHomePath(), "/panel")
  const id = "d8ca1770-369d-4a30-a362-aec2d0cb8289"
  const home = new URL(familyHomePath(id), "http://localhost")
  assert.equal(home.pathname, "/panel")
  assert.equal(home.searchParams.get("hijo"), id)
  assert.equal(
    new URL(
      familyHomePath("x&hijo=other"),
      "http://localhost"
    ).searchParams.get("hijo"),
    "x&hijo=other"
  )
  assert.equal(familyPlayPath("a/b", "c?d"), "/panel/familia/jugar/a%2Fb/c%3Fd")
})
test("the family catalogue exposes only the five active teacher games and fully localized choices", () => {
  assert.deepEqual(familyCatalog.map((g) => g.kind).sort(), [
    "builder",
    "cargo",
    "fair",
    "market",
    "nursery",
  ])
  for (const g of familyCatalog)
    for (const dict of [spanishMessages, chankaMessages, aymaraMessages])
      for (const key of [g.name, g.topic, g.description])
        assert.ok(dict[key]?.trim(), key)
})
