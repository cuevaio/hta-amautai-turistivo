import type { Actor } from "./notification.ts"
export type EmailStatus =
  | "pending"
  | "dispatching"
  | "accepted"
  | "failed"
  | "uncertain"
  | "cancelled"
  | "expired"
export type EmailAccount = { email: string; emailVerified: boolean }
export type EmailContact = {
  email: string
  enabled: number
  verified_at: number | null
  opted_out: number
}
export type EmailNotification = Actor & {
  event_type?: string | null
  id: string
  email: string
  kind: "verification" | "test" | "reminder"
  title: string
  body: string
  status: EmailStatus
  scheduled_at: number
  expires_at: number
  created_at: number
  attempts: number
  request_key: string
  last_error: string | null
  provider_id: string | null
}
export class EmailError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}
export function requireEmail(
  contact: EmailContact | null,
  email: string
): asserts contact is EmailContact {
  if (!contact?.verified_at || contact.email !== email)
    throw new EmailError("email_verification_required")
  if (!contact.enabled || contact.opted_out)
    throw new EmailError("email_disabled")
}
