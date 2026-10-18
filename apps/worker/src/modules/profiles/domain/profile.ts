export type Actor = { tenantId: string; userId: string }
export type AccountProfile = {
  role: "teacher" | "parent"
  updatedAt: string
}
export type ProfileRole = AccountProfile["role"]
export type ProfileRegistration = {
  role: ProfileRole
  phone: string
  consent: true
  locale: "es-PE" | "quy-PE" | "ay-PE"
}
export type ProfileWelcome = Actor & ProfileRegistration & { createdAt: number }
export type FamilyProfileInput = {
  grade: number
  location: string
  language: string
}
export type FamilyProfile = FamilyProfileInput & { updatedAt: string }
export class FamilyProfileError extends Error {
  readonly code: "invalid_family_profile"

  constructor(code: "invalid_family_profile") {
    super(code)
    this.code = code
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
