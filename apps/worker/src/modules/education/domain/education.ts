import { curriculumCatalog } from "./catalog.ts"

export type Actor = { tenantId: string; userId: string }
export type EducationContext = {
  location: string
  region: "" | "coast" | "highlands" | "jungle"
  setting: "" | "urban" | "rural"
  language: string
}
export type ProfileValues = {
  role: "teacher"
  level: "primary"
  area: "mathematics"
  grade: 2
  context: EducationContext
}
export type TeacherProfile = ProfileValues & { updatedAt: string }
export type SessionValues = {
  title: string
  level: "primary"
  area: "mathematics"
  grade: 2
  catalogVersion: string
  competenceId: string
  capacityIds: string[]
  purpose: string
  performance: string
  situation: string
  approachIds: string[]
  moment: "" | "start" | "development" | "closing"
  durationMinutes: number | null
  context: EducationContext
}
export type LearningSession = SessionValues & {
  id: string
  version: number
  createdAt: string
  updatedAt: string
}
export class EducationError extends Error {
  code:
    | "invalid_education_input"
    | "education_not_found"
    | "education_version_conflict"
    | "education_profile_required"
  constructor(code: EducationError["code"]) {
    super(code)
    this.code = code
  }
}
export function validateProfile(input: ProfileValues) {
  if (
    input.role !== "teacher" ||
    input.level !== "primary" ||
    input.area !== "mathematics" ||
    !curriculumCatalog.grades.some(
      (g) => g.grade === input.grade && g.enabled
    ) ||
    input.context.location.length > 200 ||
    input.context.language.length > 100 ||
    !["", "coast", "highlands", "jungle"].includes(input.context.region) ||
    !["", "urban", "rural"].includes(input.context.setting)
  )
    throw new EducationError("invalid_education_input")
}
export function validateSession(input: SessionValues) {
  validateProfile({ ...input, role: "teacher" })
  const competence = curriculumCatalog.competencies.find(
    (c) => c.id === input.competenceId
  )
  if (
    input.title.trim().length < 3 ||
    input.title.length > 120 ||
    input.catalogVersion !== curriculumCatalog.version ||
    [input.purpose, input.performance, input.situation].some(
      (value) => value.length > 1500
    ) ||
    (input.competenceId !== "" && !competence) ||
    input.capacityIds.some(
      (id) => !competence?.capacities.some((c) => c.id === id)
    ) ||
    new Set(input.capacityIds).size !== input.capacityIds.length ||
    input.approachIds.some(
      (id) => !curriculumCatalog.approaches.some((a) => a.id === id)
    ) ||
    new Set(input.approachIds).size !== input.approachIds.length ||
    !["", "start", "development", "closing"].includes(input.moment) ||
    (input.durationMinutes !== null &&
      (!Number.isInteger(input.durationMinutes) ||
        input.durationMinutes < 1 ||
        input.durationMinutes > 240))
  )
    throw new EducationError("invalid_education_input")
}
export function missingFields(input: SessionValues) {
  return [
    !input.competenceId && "Competencia",
    !input.capacityIds.length && "Capacidades",
    !input.purpose.trim() && "Propósito de aprendizaje",
    !input.situation.trim() && "Situación significativa",
    !input.moment && "Momento de la sesión",
    input.durationMinutes === null && "Tiempo",
  ].filter((item): item is string => !!item)
}
