import type { Region } from "./cargo.ts"
export type FamilyKind = "cargo" | "market" | "nursery" | "fair" | "builder"
export type FamilyChild = {
  id: string
  name: string
  region: Region
  createdAt: string
  version: number
}
export type FamilyGame = {
  id: string
  childId: string
  name: string
  region: Region
  kind: FamilyKind
  createdAt: string
  participantId: string
  score: number
  solved: number
  mistakes: number
  started: boolean
}
export class FamilyGameError extends Error {
  readonly code:
    | "child_not_found"
    | "duplicate_child"
    | "family_limit"
    | "family_conflict"
    | "invalid_family_game"
  constructor(code: FamilyGameError["code"]) {
    super(code)
    this.code = code
  }
}
export function validFamilyKind(kind: string): kind is FamilyKind {
  return ["cargo", "market", "nursery", "fair", "builder"].includes(kind)
}
