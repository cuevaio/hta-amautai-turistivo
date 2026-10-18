import { test } from "node:test"
import assert from "node:assert/strict"
import {
  newSession,
  sessionSummary,
  missingSessionFields,
} from "../src/features/education/model/session.ts"
const catalog = {
  version: "test-v1",
  competencies: [
    {
      id: "quantity",
      label: "Resuelve problemas de cantidad",
      capacities: [{ id: "count", label: "Capacidad verificada" }],
    },
  ],
  approaches: [{ id: "environment", label: "Ambiental" }],
}
test("a new draft snapshots the profile without inferring a region, language or purpose", () => {
  const profile = {
    context: {
      location: "Un distrito",
      region: "",
      setting: "rural",
      language: "",
    },
  }
  const draft = newSession(profile, catalog)
  profile.context.location = "Ubicación editada después"
  assert.equal(draft.context.location, "Un distrito")
  assert.equal(draft.context.region, "")
  assert.equal(draft.context.language, "")
  assert.equal(draft.purpose, "")
  assert.equal(draft.grade, 2)
  assert.ok(missingSessionFields(draft).includes("Capacidades"))
})
test("copyable summary retains teacher input and labels missing data and unverified performance", () => {
  const draft = {
    ...newSession(
      {
        context: {
          location: "Comunidad",
          region: "jungle",
          setting: "urban",
          language: "Idioma indicado",
        },
      },
      catalog
    ),
    title: "Mi cosecha",
    competenceId: "quantity",
    capacityIds: ["count"],
    performance: "Texto escrito por la docente",
    approachIds: ["environment"],
  }
  const summary = sessionSummary(draft, catalog)
  assert.ok(summary.includes("Resuelve problemas de cantidad"))
  assert.ok(summary.includes("Capacidad verificada"))
  assert.ok(summary.includes("sin verificar como cita oficial"))
  assert.ok(summary.includes("Texto escrito por la docente"))
  assert.ok(summary.includes("Propósito de aprendizaje: Por completar"))
  assert.ok(summary.includes("Región geográfica: Selva"))
  assert.ok(summary.includes("Ámbito: Urbano"))
  assert.ok(!summary.includes("Inicio ("))
  assert.ok(!summary.includes("Relevos de Pizarra"))
})
