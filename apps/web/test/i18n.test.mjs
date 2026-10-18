import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import ts from "typescript"
import { createInstance } from "i18next"
import { i18nOptions } from "../src/shared/i18n/options.ts"
import {
  languageStorageKey,
  readLocale,
  resolveLocale,
  saveLocale,
} from "../src/shared/i18n/locales.ts"
import {
  spanishMessages,
  chankaMessages,
  aymaraMessages,
} from "../src/shared/i18n/messages.ts"
import { dateLocale, formatDate } from "../src/shared/i18n/format.ts"

test("language preference accepts only explicit supported varieties and survives restricted storage", () => {
  for (const locale of ["es-PE", "quy-PE", "ay-PE"]) {
    const values = new Map()
    const storage = {
      getItem: (key) => values.get(key),
      setItem: (key, value) => values.set(key, value),
    }
    assert.equal(saveLocale(locale, storage), locale)
    assert.equal(values.get(languageStorageKey), locale)
    assert.equal(readLocale(storage), locale)
  }
  for (const invalid of [
    null,
    "",
    "en",
    "qu",
    "quz-PE",
    "__proto__",
    "<script>",
  ]) {
    assert.equal(resolveLocale(invalid), "es-PE")
  }
  const blocked = {
    getItem() {
      throw Error("blocked")
    },
    setItem() {
      throw Error("blocked")
    },
  }
  assert.equal(readLocale(blocked), "es-PE")
  assert.equal(saveLocale("ay-PE", blocked), "ay-PE")
})

test("switching language translates real UI messages and uses readable Spanish for unknown text", async () => {
  const instance = createInstance()
  await instance.init({ ...i18nOptions, lng: "es-PE" })
  assert.equal(instance.t("Guardar borrador"), "Guardar borrador")
  for (const [locale, messages] of [
    ["quy-PE", chankaMessages],
    ["ay-PE", aymaraMessages],
  ]) {
    await instance.changeLanguage(locale)
    assert.equal(instance.t("Guardar borrador"), messages["Guardar borrador"])
    assert.equal(
      instance
        .t("Paso {{step}} de {{total}}", { step: 1, total: 2 })
        .includes("{{"),
      false
    )
    assert.equal(
      instance.t("Servicio no traducido", {
        defaultValue: "Servicio no traducido",
      }),
      "Servicio no traducido"
    )
  }
  await instance.changeLanguage("es-PE")
  assert.equal(
    instance.t("Datos pendientes", { count: 1 }),
    "1 dato por completar"
  )
  assert.equal(
    instance.t("Datos pendientes", { count: 2 }),
    "2 datos por completar"
  )
})

test("every static translated UI message has nonempty catalogs with matching interpolation variables", () => {
  const root = path.resolve(import.meta.dirname, "../src")
  const variables = (text) =>
    [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()
  for (const file of fs
    .readdirSync(root, { recursive: true })
    .filter((file) => /\.tsx?$/.test(file))) {
    if (file.startsWith("shared/i18n")) continue
    const source = fs.readFileSync(path.join(root, file), "utf8")
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(ast) === "m" &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        const key = node.arguments[0].text
        for (const messages of [
          spanishMessages,
          chankaMessages,
          aymaraMessages,
        ]) {
          assert.ok(messages[key]?.trim(), `${file}: missing ${key}`)
          assert.deepEqual(
            variables(messages[key]),
            variables(key),
            `${file}: interpolation mismatch for ${key}`
          )
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
  }
})

test("date formatting handles limited Intl locale support without breaking the screen", () => {
  for (const locale of ["es-PE", "quy-PE", "ay-PE"]) {
    assert.ok(dateLocale(locale))
    assert.equal(
      typeof formatDate("2026-10-17T12:00:00Z", locale, {
        timeZone: "UTC",
        dateStyle: "short",
      }),
      "string"
    )
  }
  assert.equal(formatDate("invalid", "quy-PE"), "—")
})

import vm from "node:vm"
import { curriculumCatalog } from "../../worker/src/modules/education/domain/catalog.ts"
import {
  sessionSummary,
  newSession,
} from "../src/features/education/model/session.ts"

test("curriculum labels and summary boilerplate translate while teacher content and original sources survive", () => {
  const original = JSON.stringify(curriculumCatalog)
  const input = newSession(
    {
      context: {
        location: "Mi comunidad",
        language: "Mi idioma",
        region: "highlands",
        setting: "rural",
      },
    },
    curriculumCatalog
  )
  Object.assign(input, {
    title: "Mi título",
    purpose: "Mi propósito",
    situation: "Mi situación",
    competenceId: curriculumCatalog.competencies[0].id,
    capacityIds: [curriculumCatalog.competencies[0].capacities[0].id],
  })
  const labels = [
    ...curriculumCatalog.competencies.flatMap((c) => [
      c.label,
      ...c.capacities.map((x) => x.label),
    ]),
    ...curriculumCatalog.approaches.map((x) => x.label),
    ...curriculumCatalog.sources.map((x) => x.title),
  ]
  for (const messages of [chankaMessages, aymaraMessages]) {
    for (const key of labels) {
      assert.ok(messages[key], key)
      assert.notEqual(messages[key], key)
    }
    const summary = sessionSummary(input, curriculumCatalog, (key) => {
      assert.ok(messages[key], key)
      return messages[key]
    })
    for (const value of [
      "Mi título",
      "Mi propósito",
      "Mi situación",
      "Mi comunidad",
      "Mi idioma",
    ])
      assert.ok(summary.includes(value))
    for (const value of [
      "Por completar",
      "Competencia:",
      "Capacidades:",
      "Región geográfica:",
      "Borrador organizado",
    ])
      assert.ok(!summary.includes(value), value)
  }
  assert.equal(JSON.stringify(curriculumCatalog), original)
})

test("visible source messages from API, models and JSX have translations", () => {
  const root = path.resolve(import.meta.dirname, "../src")
  const excluded = new Set([
    "AuthProvider required",
    "EducationProvider required",
    "use client",
    "useTheme must be used within a ThemeProvider",
  ])
  for (const file of fs
    .readdirSync(root, { recursive: true })
    .filter((f) => /\.tsx?$/.test(f))) {
    if (file.startsWith("shared/i18n")) continue
    const source = fs.readFileSync(path.join(root, file), "utf8")
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
    function visit(node) {
      if (ts.isJsxText(node)) {
        const value = node.text.trim()
        if (/[A-Za-záéíóúñ]/.test(value))
          assert.equal(value, "Amautai", file + ": untranslated JSX " + value)
      }
      if (ts.isStringLiteral(node)) {
        const value = node.text.trim()
        if (
          /[áéíóúñ¿¡…]/i.test(value) &&
          !value.startsWith("http") &&
          !excluded.has(value)
        ) {
          for (const messages of [
            spanishMessages,
            chankaMessages,
            aymaraMessages,
          ])
            assert.ok(messages[value], file + ": " + value)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
  }
})

test("early loading follows saved locale and restricted storage is safe", () => {
  const html = fs.readFileSync(
    path.resolve(import.meta.dirname, "../index.html"),
    "utf8"
  )
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1]
  for (const locale of ["es-PE", "quy-PE", "ay-PE", "invalid", null]) {
    const el = {},
      document = { documentElement: {}, getElementById: () => el }
    vm.runInNewContext(script, {
      document,
      localStorage: { getItem: () => locale },
    })
    const expected = resolveLocale(locale)
    assert.equal(document.documentElement.lang, expected)
    const messages = {
      "es-PE": spanishMessages,
      "quy-PE": chankaMessages,
      "ay-PE": aymaraMessages,
    }[expected]
    assert.equal(el.textContent, messages["Preparando Amautai…"])
  }
  const document = { documentElement: {}, getElementById: () => ({}) }
  assert.doesNotThrow(() =>
    vm.runInNewContext(script, {
      document,
      localStorage: {
        getItem() {
          throw Error("blocked")
        },
      },
    })
  )
})

test("unsupported indigenous date locales avoid Spanish month names and day periods", () => {
  for (const locale of ["quy-PE", "ay-PE"]) {
    if (Intl.DateTimeFormat.supportedLocalesOf([locale]).length) continue
    const value = formatDate("2026-10-17T23:40:00Z", locale, {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "UTC",
    })
    assert.match(value, /17\/10\/2026/)
    assert.match(value, /23:40/)
    assert.doesNotMatch(value, /octubre|p\.?\s?m/i)
  }
})
