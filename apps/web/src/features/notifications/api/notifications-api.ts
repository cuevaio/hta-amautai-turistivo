import { api } from "@/shared/api/client"
import type { NotificationOverview } from "@amautai/contracts"
const root = "/api/notifications"
export const notificationsApi = {
  overview: (signal?: AbortSignal) =>
    api<NotificationOverview>(root, { signal }),
  phone: (phone: string) =>
    api(root + "/phone", {
      method: "POST",
      body: JSON.stringify({ phone, consent: true }),
    }),
  verify: (code: string) =>
    api(root + "/verify", { method: "POST", body: JSON.stringify({ code }) }),
  preferences: (enabled: boolean, timezone: string) =>
    api(root + "/preferences", {
      method: "PUT",
      body: JSON.stringify({ enabled, timezone }),
    }),
  schedule: (title: string, scheduledAt: number, requestKey: string) =>
    api(root, {
      method: "POST",
      body: JSON.stringify({ title, scheduledAt, requestKey }),
    }),
  test: (requestKey: string) =>
    api(root + "/test", {
      method: "POST",
      body: JSON.stringify({ requestKey }),
    }),
  cancel: (id: string) =>
    api(root + "/" + encodeURIComponent(id), { method: "DELETE" }),
}
