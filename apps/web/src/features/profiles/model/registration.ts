import type {
  AccountProfile,
  AccountProfileInput,
  FamilyProfile,
} from "@amautai/contracts"

export function normalizeRegistrationPhone(value: string) {
  const number = value.replace(/[\s()+.-]/gu, "")
  if (number.startsWith("0051")) return number.slice(4)
  if (number.length > 9 && number.startsWith("51")) return number.slice(2)
  return number
}

export function isRegistrationPhoneValid(value: string) {
  return /^9\d{8}$/.test(value)
}

type RegistrationApi = {
  save(input: AccountProfileInput): Promise<{ profile: AccountProfile }>
  getFamily(): Promise<{ profile: FamilyProfile | null }>
}

export async function saveProfileRegistration(
  api: RegistrationApi,
  input: AccountProfileInput
) {
  // A subsequent read failure must not report an already committed save as failed.
  const { profile } = await api.save(input)
  try {
    const familyProfile =
      profile.role === "parent" ? (await api.getFamily()).profile : null
    return { profile, familyProfile, error: "" }
  } catch (error) {
    return {
      profile,
      familyProfile: null,
      error:
        error instanceof Error ? error.message : "No pudimos cargar tu perfil",
    }
  }
}
