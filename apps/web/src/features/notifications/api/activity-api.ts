import { api } from "@/shared/api/client"
import type { ActivityPreference, ActivitySettings } from "@amautai/contracts"
export const activityApi = {
  overview: (signal?: AbortSignal) =>
    api<ActivitySettings>("/api/notifications/settings", { signal }),
  save: (preference: ActivityPreference) =>
    api<{ saved: true }>("/api/notifications/settings", {
      method: "PUT",
      body: JSON.stringify(preference),
    }),
}
