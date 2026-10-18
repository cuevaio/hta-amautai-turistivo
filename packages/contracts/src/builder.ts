import { z } from "zod"
import type { CargoRoom, CargoParticipant } from "./rooms.ts"
export const builderShape = z.enum([
  "triangle",
  "square",
  "rectangle",
  "circle",
])
export type BuilderShape = z.infer<typeof builderShape>
export type BuilderPlacement = { shape: BuilderShape; rotation: number }
export const builderAnswerInput = z
  .object({
    version: z.number().int().min(1),
    shape: builderShape,
    rotation: z.number().int().min(0).max(3),
  })
  .strict()
export type BuilderTask = {
  id: number
  skill: number
  band: number
  cursor: number
  targets: BuilderShape[]
  pieces: BuilderPlacement[]
  rotatable: boolean
}
export type BuilderRun = {
  room: CargoRoom
  participant: CargoParticipant
  task: BuilderTask
  helped: boolean
  attempts: number
  streak: number
  bands: number[]
  evidence: { correct: number; assisted: number; errors: number }[]
  feedback: "" | "correct" | "wrong" | "help"
  delta: number
}
