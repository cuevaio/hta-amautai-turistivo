import type {
  CurriculumCatalog,
  EducationContext,
  LearningSessionInput,
  TeacherProfile,
} from "@amautai/contracts"
import { learningSessionInput } from "@amautai/contracts"
export const sessionValues = (input: unknown): LearningSessionInput =>
  learningSessionInput.strip().parse(input)
export const emptyContext: EducationContext = {
  location: "",
  region: "",
  setting: "",
  language: "",
}
export function newSession(
  profile: TeacherProfile,
  catalog: CurriculumCatalog
): LearningSessionInput {
  return {
    title: "",
    level: "primary",
    area: "mathematics",
    grade: 2,
    catalogVersion: catalog.version,
    competenceId: "",
    capacityIds: [],
    purpose: "",
    performance: "",
    situation: "",
    approachIds: [],
    moment: "",
    durationMinutes: null,
    context: { ...profile.context },
  }
}
export const momentLabels = {
  start: "Inicio",
  development: "Desarrollo",
  closing: "Cierre",
}
export function missingSessionFields(input: LearningSessionInput) {
  return [
    !input.competenceId && "Competencia",
    !input.capacityIds.length && "Capacidades",
    !input.purpose.trim() && "Propósito de aprendizaje",
    !input.situation.trim() && "Situación significativa",
    !input.moment && "Momento de la sesión",
    input.durationMinutes === null && "Tiempo",
  ].filter((v): v is string => !!v)
}
export function sessionSummary(
  input: LearningSessionInput,
  catalog: CurriculumCatalog,
  translate: (message: string) => string = (message) => message
) {
  const competence = catalog.competencies.find(
    (c) => c.id === input.competenceId
  )
  const regions = { coast: "Costa", highlands: "Sierra", jungle: "Selva" }
  const settings = { urban: "Urbano", rural: "Rural" }
  const text = (value: string) => value || translate("Por completar")
  const field = (label: string, value: string) =>
    translate(label) + ": " + value
  return [
    input.title || translate("Borrador de sesión de aprendizaje"),
    translate("Primaria · 2.º grado · Ciclo III · Matemática"),
    field(
      "Competencia",
      competence ? translate(competence.label) : translate("Por completar")
    ),
    field(
      "Capacidades",
      competence?.capacities
        .filter((c) => input.capacityIds.includes(c.id))
        .map((c) => translate(c.label))
        .join("; ") || translate("Por completar")
    ),
    field("Propósito de aprendizaje", text(input.purpose)),
    field(
      "Desempeño o precisión aportado por el docente (sin verificar como cita oficial)",
      input.performance || translate("No indicado")
    ),
    field("Situación significativa", text(input.situation)),
    field(
      "Enfoques transversales",
      catalog.approaches
        .filter((a) => input.approachIds.includes(a.id))
        .map((a) => translate(a.label))
        .join("; ") || translate("No indicados")
    ),
    field(
      "Momento de la sesión",
      input.moment
        ? translate(momentLabels[input.moment])
        : translate("Por completar")
    ),
    field(
      "Tiempo previsto",
      input.durationMinutes === null
        ? translate("Por completar")
        : input.durationMinutes + " min"
    ),
    field(
      "Ubicación o comunidad",
      input.context.location || translate("No indicada")
    ),
    field(
      "Región geográfica",
      input.context.region
        ? translate(regions[input.context.region])
        : translate("No indicada")
    ),
    field(
      "Ámbito",
      input.context.setting
        ? translate(settings[input.context.setting])
        : translate("No indicado")
    ),
    field(
      "Idioma principal",
      input.context.language || translate("No indicado")
    ),
    translate(
      "Borrador organizado a partir de los datos del docente. No contiene actividades generadas ni acredita validación curricular."
    ),
  ].join("\n\n")
}
