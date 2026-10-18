import { api } from "@/shared/api/client"
import type {
  CurriculumCatalog,
  TeacherProfile,
  TeacherProfileInput,
  LearningSession,
  LearningSessionInput,
} from "@amautai/contracts"
export const educationApi = {
  catalog: (signal?: AbortSignal) =>
    api<CurriculumCatalog>("/api/education/catalog", { signal }),
  profile: (signal?: AbortSignal) =>
    api<{ profile: TeacherProfile | null }>("/api/education/profile", {
      signal,
    }),
  saveProfile: (input: TeacherProfileInput) =>
    api<{ profile: TeacherProfile }>("/api/education/profile", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  list: (signal?: AbortSignal) =>
    api<{ sessions: LearningSession[] }>("/api/learning-sessions", { signal }),
  get: (id: string, signal?: AbortSignal) =>
    api<{ session: LearningSession }>(
      "/api/learning-sessions/" + encodeURIComponent(id),
      { signal }
    ),
  save: (input: LearningSessionInput, id?: string, version?: number) =>
    api<{ session: LearningSession }>(
      "/api/learning-sessions" + (id ? "/" + encodeURIComponent(id) : ""),
      {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(id ? { ...input, version } : input),
      }
    ),
}
