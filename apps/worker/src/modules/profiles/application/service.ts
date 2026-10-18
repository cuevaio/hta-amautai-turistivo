import {
  validateFamilyProfile,
  type Actor,
  type AccountProfile,
  type FamilyProfile,
  type FamilyProfileInput,
  type ProfileRole,
} from "../domain/profile.ts"

export interface ProfileRepository {
  find(actor: Actor): Promise<AccountProfile | null>
  save(actor: Actor, role: ProfileRole): Promise<AccountProfile>
}

export interface FamilyProfileRepository {
  find(actor: Actor): Promise<FamilyProfile | null>
  save(actor: Actor, input: FamilyProfileInput): Promise<FamilyProfile>
}

export function profileService(repository: ProfileRepository) {
  return {
    get: (actor: Actor) => repository.find(actor),
    save: (actor: Actor, role: ProfileRole) => repository.save(actor, role),
  }
}

export type ProfileService = ReturnType<typeof profileService>

export function familyProfileService(repository: FamilyProfileRepository) {
  return {
    get: (actor: Actor) => repository.find(actor),
    async save(actor: Actor, input: FamilyProfileInput) {
      validateFamilyProfile(input)
      return repository.save(actor, input)
    },
  }
}

export type FamilyProfileService = ReturnType<typeof familyProfileService>
