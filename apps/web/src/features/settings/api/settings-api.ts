import { api } from "@/shared/api/client"
export const settingsApi = {
  health: (signal?: AbortSignal) =>
    api<{ status: string; database: string }>("/api/health", { signal }),
}
