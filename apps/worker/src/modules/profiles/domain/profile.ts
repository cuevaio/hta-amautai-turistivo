export type Actor = { tenantId: string; userId: string }
export type AccountProfile = {
  role: "teacher" | "parent"
  updatedAt: string
}
export type ProfileRole = AccountProfile["role"]
export type FamilyProfileInput = {
  grade: number
  location: string
  language: string
}
export type FamilyProfile = FamilyProfileInput & { updatedAt: string }
export class FamilyProfileError extends Error {
  constructor(readonly code: "invalid_family_profile") {
    super(code)
  }
}

export function validateFamilyProfile(input: FamilyProfileInput) {
  if (
    !Number.isInteger(input.grade) ||
    input.grade < 1 ||
    input.grade > 6 ||
    input.location.trim().length === 0 ||
    input.location.trim().length > 200 ||
    input.language.trim().length === 0 ||
    input.language.trim().length > 100
  )
    throw new FamilyProfileError("invalid_family_profile")
}
