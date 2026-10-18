import { z } from "zod"
import type { CargoParticipant, CargoRoom } from "./rooms.ts"
export const nurseryAnswerInput = z
  .object({
    version: z.number().int().min(1),
    trays: z.number().int().min(0).max(9),
    units: z.number().int().min(0).max(99),
  })
  .strict()
  .refine((v) => v.trays * 10 + v.units <= 99)
export type NurseryTask = {
  id: number
  skill: number
  band: number
  target: number
  initialTrays: number
  initialUnits: number
}
export type NurseryRun = {
  room: CargoRoom
  participant: CargoParticipant
  task: NurseryTask
  helped: boolean
  attempts: number
  streak: number
  bands: number[]
  evidence: { correct: number; assisted: number; errors: number }[]
  feedback: "" | "correct" | "wrong" | "help"
  delta: number
}
