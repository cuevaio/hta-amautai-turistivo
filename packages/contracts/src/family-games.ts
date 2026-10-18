import { z } from "zod"
import type { CargoRegion } from "./rooms.ts"
export const familyChildInput = z
  .object({
    name: z.string().trim().min(1).max(80),
    region: z.enum(["coast", "highlands", "jungle"]),
  })
  .strict()
export const familyChildUpdateInput = familyChildInput
  .extend({ version: z.number().int().min(1) })
  .strict()
export const familyGameInput = z
  .object({
    childId: z.uuid(),
    kind: z.enum(["cargo", "market", "nursery", "fair", "builder"]),
    requestId: z.uuid(),
  })
  .strict()
export type FamilyGameKind = z.infer<typeof familyGameInput>["kind"]
export type FamilyChild = {
  id: string
  name: string
  region: CargoRegion
  createdAt: string
  version: number
}
export type FamilyGameSession = {
  id: string
  childId: string
  name: string
  region: CargoRegion
  kind: FamilyGameKind
  createdAt: string
  participantId: string
  score: number
  solved: number
  mistakes: number
  started: boolean
}
