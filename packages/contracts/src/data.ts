import { z } from "zod"
import type { CargoParticipant, CargoRoom } from "./rooms.ts"
export const dataAnswerInput = z
  .object({
    version: z.number().int().min(1),
    answer: z.number().int().min(0).max(20),
  })
  .strict()
export type DataTask = {
  id: number
  skill: number
  band: number
  counts: number[]
  registered: number[]
  votes: number[]
  cursor: number
  unit: 1 | 2
  category: number
  compare: number
  choices: number[]
}
export type DataRun = {
  room: CargoRoom
  participant: CargoParticipant
  task: DataTask
  helped: boolean
  attempts: number
  streak: number
  bands: number[]
  evidence: { correct: number; assisted: number; errors: number }[]
  feedback: "" | "correct" | "wrong" | "help"
  delta: number
}
