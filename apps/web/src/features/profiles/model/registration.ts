import type {
  AccountProfile,
  AccountProfileInput,
  FamilyProfile,
} from "@amautai/contracts"

export {
  nationalPhone as normalizeRegistrationPhone,
  isPeruvianMobile as isRegistrationPhoneValid,
} from "../../../shared/lib/peruvian-phone.ts"

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
