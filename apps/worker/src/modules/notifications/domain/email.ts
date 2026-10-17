import type { Actor } from "./notification.ts"
export type EmailStatus =
  | "pending"
  | "dispatching"
  | "accepted"
  | "failed"
  | "uncertain"
  | "cancelled"
  | "expired"
export type EmailContact = {
  email: string
  enabled: number
  verified_at: number | null
  challenge_id: string | null
}
export type EmailNotification = Actor & {
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
  if (!contact?.enabled || !contact.verified_at || contact.email !== email)
    throw new EmailError("email_not_verified")
}
