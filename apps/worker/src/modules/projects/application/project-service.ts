import { ProjectError, projectValues } from "../domain/project.ts"
import type { Project, ProjectValues } from "../domain/project.ts"
export type Actor = { userId: string; tenantId: string }
export type WriteResult = "ok" | "not_found" | "version_conflict"
export interface ProjectRepository {
  list(tenantId: string): Promise<Project[]>
  find(tenantId: string, id: string): Promise<Project | null>
  create(actor: Actor, id: string, values: ProjectValues): Promise<Project>
  update(
    tenantId: string,
    id: string,
    values: ProjectValues,
    version: number
  ): Promise<WriteResult>
  remove(tenantId: string, id: string, version: number): Promise<WriteResult>
}
export function createProjectService(
  repository: ProjectRepository,
  nextId: () => string
) {
  async function get(actor: Actor, id: string) {
    const project = await repository.find(actor.tenantId, id)
    if (!project) throw new ProjectError("not_found")
    return project
  }
  function checkVersion(version: number) {
    if (!Number.isInteger(version) || version < 1)
      throw new ProjectError("validation_failed")
  }
  return {
    list: (actor: Actor) => repository.list(actor.tenantId),
    get,
    create: (actor: Actor, input: ProjectValues) =>
      repository.create(actor, nextId(), projectValues(input)),
    async update(
      actor: Actor,
      id: string,
      input: ProjectValues,
      version: number
    ) {
      checkVersion(version)
      const result = await repository.update(
        actor.tenantId,
        id,
        projectValues(input),
        version
      )
      if (result !== "ok") throw new ProjectError(result)
      return get(actor, id)
    },
    async remove(actor: Actor, id: string, version: number) {
      checkVersion(version)
      const result = await repository.remove(actor.tenantId, id, version)
      if (result !== "ok") throw new ProjectError(result)
    },
  }
}
export type ProjectService = ReturnType<typeof createProjectService>
export { ProjectError } from "../domain/project.ts"
export type { Project } from "../domain/project.ts"
