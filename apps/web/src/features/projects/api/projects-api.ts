import { api } from "@/shared/api/client"
import type { Project, ProjectInput } from "@amautai/contracts"
export const projectsApi = {
  list: (signal?: AbortSignal) =>
    api<{ projects: Project[] }>("/api/projects", { signal }),
  get: (id: string) =>
    api<{ project: Project }>("/api/projects/" + encodeURIComponent(id)),
  create: (values: ProjectInput) =>
    api("/api/projects", { method: "POST", body: JSON.stringify(values) }),
  update: (id: string, values: ProjectInput, version: number) =>
    api("/api/projects/" + encodeURIComponent(id), {
      method: "PUT",
      body: JSON.stringify({ ...values, version }),
    }),
  remove: (id: string, version: number) =>
    api("/api/projects/" + encodeURIComponent(id), {
      method: "DELETE",
      body: JSON.stringify({ version }),
    }),
}
