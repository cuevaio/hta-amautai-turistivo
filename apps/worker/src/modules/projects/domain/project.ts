export type ProjectValues = {
  name: string
  description: string
  status: "idea" | "building" | "ready"
}
export type Project = ProjectValues & {
  id: string
  version: number
  createdAt: string
  updatedAt: string
}
export class ProjectError extends Error {
  code: "not_found" | "version_conflict" | "validation_failed"
  constructor(code: ProjectError["code"]) {
    super(code)
    this.code = code
  }
}
export function projectValues(input: ProjectValues): ProjectValues {
  const name = input.name.trim()
  const description = input.description.trim()
  if (
    name.length < 3 ||
    name.length > 100 ||
    description.length > 1000 ||
    !["idea", "building", "ready"].includes(input.status)
  )
    throw new ProjectError("validation_failed")
  return { name, description, status: input.status }
}
