import {
  EducationError,
  validateProfile,
  validateSession,
} from "../domain/education.ts"
import type {
  Actor,
  ProfileValues,
  TeacherProfile,
  SessionValues,
  LearningSession,
} from "../domain/education.ts"

export interface EducationRepository {
  profile(actor: Actor): Promise<TeacherProfile | null>
  saveProfile(actor: Actor, values: ProfileValues): Promise<TeacherProfile>
  list(actor: Actor): Promise<LearningSession[]>
  find(actor: Actor, id: string): Promise<LearningSession | null>
  create(
    actor: Actor,
    id: string,
    values: SessionValues
  ): Promise<LearningSession>
  update(
    actor: Actor,
    id: string,
    values: SessionValues,
    version: number
  ): Promise<boolean>
}
export function educationService(repo: EducationRepository, id: () => string) {
  async function get(actor: Actor, sessionId: string) {
    const session = await repo.find(actor, sessionId)
    if (!session) throw new EducationError("education_not_found")
    return session
  }
  return {
    profile: (actor: Actor) => repo.profile(actor),
    async saveProfile(actor: Actor, values: ProfileValues) {
      validateProfile(values)
      return repo.saveProfile(actor, values)
    },
    list: (actor: Actor) => repo.list(actor),
    get,
    async create(actor: Actor, values: SessionValues) {
      validateSession(values)
      if (!(await repo.profile(actor)))
        throw new EducationError("education_profile_required")
      return repo.create(actor, id(), values)
    },
    async update(
      actor: Actor,
      sessionId: string,
      values: SessionValues,
      version: number
    ) {
      validateSession(values)
      if (!Number.isInteger(version) || version < 1)
        throw new EducationError("invalid_education_input")
      await get(actor, sessionId)
      if (!(await repo.update(actor, sessionId, values, version)))
        throw new EducationError("education_version_conflict")
      return get(actor, sessionId)
    },
  }
}
export type EducationService = ReturnType<typeof educationService>
