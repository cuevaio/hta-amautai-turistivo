export const activityTypes = [
  "task_assigned",
  "task_due",
  "new_message",
] as const
export type ActivityType = (typeof activityTypes)[number]
export type NotificationChannel = "email" | "whatsapp" | "both" | "none"
export type ActivityPreference = {
  type: ActivityType
  channel: NotificationChannel
}
export const includesChannel = (
  choice: NotificationChannel,
  channel: "email" | "whatsapp"
) => choice === "both" || choice === channel
