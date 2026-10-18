import { z } from "zod"
export const roomInput = z
  .object({ region: z.enum(["coast", "highlands", "jungle"]) })
  .strict()
export const participantInput = z
  .object({ name: z.string().trim().min(1).max(80) })
  .strict()
export const cargoCollectInput = z
  .object({
    version: z.number().int().min(1),
    value: z.number().int().min(1).max(10),
  })
  .strict()
export const cargoPauseInput = z
  .object({ version: z.number().int().min(1), paused: z.boolean() })
  .strict()
export type CargoRegion = z.infer<typeof roomInput>["region"]
export type CargoChallenge = { groupCount: number; unitsPerGroup: number }
export type CargoParticipant = {
  id: string
  name: string
  score: number
  solved: number
  started: boolean
  caught: number
  mistakes: number
  paused: boolean
  version: number
}
export type CargoRoom = { id: string; region: CargoRegion; createdAt: string }
export type CargoRun = {
  participant: CargoParticipant
  room: CargoRoom
  challenge: CargoChallenge
}
export type CargoAnswer = {
  participant: CargoParticipant
  challenge: CargoChallenge
}
