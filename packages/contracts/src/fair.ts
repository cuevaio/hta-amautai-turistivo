import { z } from "zod"
import type { CargoParticipant, CargoRoom } from "./rooms.ts"
export const fairAnswerInput = z
  .object({
    version: z.number().int().min(1),
    answer: z.number().int().min(1).max(20),
  })
  .strict()
export type FairTask = {
  id: number
  skill: number
  band: number
  target: number
  base: number
  leftA: number
  leftB: number
  operation: "add" | "remove"
  choices: number[]
}
export type FairRun = {
  room: CargoRoom
  participant: CargoParticipant
  task: FairTask
  helped: boolean
  attempts: number
  streak: number
  bands: number[]
  evidence: { correct: number; assisted: number; errors: number }[]
  feedback: "" | "correct" | "wrong" | "help"
  delta: number
}
