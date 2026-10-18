import {
  validateFamilyProfile,
  type Actor,
  type AccountProfile,
  type FamilyProfile,
  type FamilyProfileInput,
  type ProfileRegistration,
  type ProfileWelcome,
} from "../domain/profile.ts"

export interface ProfileRepository {
  find(actor: Actor): Promise<AccountProfile | null>
  save(actor: Actor, input: ProfileRegistration): Promise<AccountProfile>
  pendingWelcomes(now: number, actor?: Actor): Promise<ProfileWelcome[]>
  completeWelcome(actor: Actor, now: number): Promise<void>
  expireWelcomes(now: number): Promise<void>
}

export interface FamilyProfileRepository {
  find(actor: Actor): Promise<FamilyProfile | null>
  save(actor: Actor, input: FamilyProfileInput): Promise<FamilyProfile>
}

export function profileService(repository: ProfileRepository) {
  return {
    get: (actor: Actor) => repository.find(actor),
    save: (actor: Actor, input: ProfileRegistration) =>
      repository.save(actor, input),
  }
}

export type ProfileService = ReturnType<typeof profileService>

export async function dispatchProfileWelcomes(
  repository: ProfileRepository,
  welcome: (input: ProfileWelcome) => Promise<void>,
  now = Date.now(),
  actor?: Actor
) {
  if (!actor) await repository.expireWelcomes(now)
  for (const input of await repository.pendingWelcomes(now, actor)) {
    try {
      await welcome(input)
      await repository.completeWelcome(input, now)
    } catch {
      // Keep the durable registration event for the next minute's retry.
      console.info("amautai_profile_welcome_deferred")
    }
  }
}

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
