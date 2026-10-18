import { z } from "zod"

export const educationContextInput = z
  .object({
    location: z.string().trim().max(200),
    region: z.enum(["", "coast", "highlands", "jungle"]),
    setting: z.enum(["", "urban", "rural"]),
    language: z.string().trim().max(100),
  })
  .strict()
export const teacherProfileInput = z
  .object({
    role: z.literal("teacher"),
    level: z.literal("primary"),
    area: z.literal("mathematics"),
    grade: z.literal(2),
    context: educationContextInput,
  })
  .strict()
export const learningSessionInput = z
  .object({
    title: z.string().trim().min(3).max(120),
    level: z.literal("primary"),
    area: z.literal("mathematics"),
    grade: z.literal(2),
    catalogVersion: z.string().max(50),
    competenceId: z.string().max(80),
    capacityIds: z.array(z.string().max(80)).max(4),
    purpose: z.string().trim().max(1500),
    performance: z.string().trim().max(1500),
    situation: z.string().trim().max(1500),
    approachIds: z.array(z.string().max(80)).max(7),
    moment: z.enum(["", "start", "development", "closing"]),
    durationMinutes: z.number().int().min(1).max(240).nullable(),
    context: educationContextInput,
  })
  .strict()
export const learningSessionUpdate = learningSessionInput
  .extend({ version: z.number().int().positive() })
  .strict()
export type EducationContext = z.infer<typeof educationContextInput>
export type TeacherProfileInput = z.infer<typeof teacherProfileInput>
export type TeacherProfile = TeacherProfileInput & { updatedAt: string }
export type LearningSessionInput = z.infer<typeof learningSessionInput>
export type LearningSession = LearningSessionInput & {
  id: string
  version: number
  createdAt: string
  updatedAt: string
  missingFields: string[]
}
export type CurriculumCatalog = {
  version: string
  grades: { grade: number; cycle: string; enabled: boolean }[]
  competencies: {
    id: string
    label: string
    pdfPage: number
    capacities: { id: string; label: string }[]
  }[]
  approaches: { id: string; label: string }[]
  sources: { title: string; url: string }[]
}
