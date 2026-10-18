import { z } from "zod"

export const projectInput = z
  .object({
    name: z.string().trim().min(3).max(100),
    description: z.string().trim().max(1000),
    status: z.enum(["idea", "building", "ready"]),
  })
  .strict()

export type ProjectInput = z.infer<typeof projectInput>
export type Project = ProjectInput & {
  id: string
  version: number
  created_at: string
  updated_at: string
}

export const credentialsInput = z
  .object({ email: z.email().max(254), password: z.string().min(1).max(256) })
  .strict()
export const signupInput = credentialsInput
  .extend({
    password: z.string().min(12).max(256),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().max(100).optional(),
  })
  .strict()
export const verificationInput = z
  .object({ code: z.string().regex(/^\d{6}$/) })
  .strict()
export const recoveryInput = z.object({ email: z.email().max(254) }).strict()
export const resetPasswordInput = z
  .object({ newPassword: z.string().min(12).max(256) })
  .strict()
export type AuthResult = {
  authenticated?: boolean
  verificationRequired?: boolean
}
export type User = {
  id: string
  email: string
  emailVerified: boolean
  firstName: string | null
  lastName: string | null
  profilePictureUrl: string | null
}
export type Tenant = {
  id: string
  name: string
  kind: "personal" | "organization"
}
export type Session = { user: User; tenant: Tenant; database: string }

export const notificationPhoneInput = z
  .object({
    phone: z
      .string()
      .trim()
      .max(32)
      .transform(
        (value) => "+" + value.replace(/[\s()-]/g, "").replace(/^\+/, "")
      )
      .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/)),
    consent: z.literal(true),
  })
  .strict()
export const notificationVerifyInput = z
  .object({ code: z.string().regex(/^\d{6}$/) })
  .strict()
export const notificationPreferencesInput = z
  .object({
    enabled: z.boolean(),
    timezone: z
      .string()
      .max(100)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: value })
          return true
        } catch {
          return false
        }
      }),
  })
  .strict()
export const notificationScheduleInput = z
  .object({
    title: z.string().trim().min(3).max(240),
    scheduledAt: z.number().int(),
    requestKey: z.uuid(),
  })
  .strict()
export type NotificationOverview = {
  contact: {
    phone: string | null
    registered: boolean
    enabled: boolean
    timezone: string
  } | null
  connection: string
  notifications: {
    id: string
    kind: string
    title: string
    status: string
    scheduledAt: number
    createdAt: number
    error: string | null
  }[]
}

export const emailPreferencesInput = z.object({ enabled: z.boolean() }).strict()
export const emailTestInput = z.object({ requestKey: z.uuid() }).strict()
export type EmailNotificationOverview = {
  channel: "email"
  configured: boolean
  contact: { email: string; verified: boolean; enabled: boolean }
  notifications: {
    id: string
    kind: string
    title: string
    status: string
    scheduledAt: number
    createdAt: number
    error: string | null
  }[]
}

export { activityPreferenceInput } from "./activity.ts"
export type { ActivityPreference, ActivitySettings } from "./activity.ts"
