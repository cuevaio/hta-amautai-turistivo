import { z } from "zod"
export const activityPreferenceInput = z
  .object({
    type: z.enum(["task_assigned", "task_due", "new_message"]),
    channel: z.enum(["email", "whatsapp", "both", "none"]),
  })
  .strict()
export type ActivityPreference = z.infer<typeof activityPreferenceInput>
export type ActivitySettings = { preferences: ActivityPreference[] }
