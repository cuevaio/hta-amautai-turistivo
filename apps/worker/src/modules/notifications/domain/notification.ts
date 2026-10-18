export type Actor = { tenantId: string; userId: string }
export type Status =
  | "pending"
  | "dispatching"
  | "accepted"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "expired"
  | "cancelled"
  | "uncertain"
export type Contact = {
  phone: string | null
  verified_at: number | null
  consent_at: number | null
  enabled: number
  timezone: string
  challenge_expires: number | null
}
export type Notification = Actor & {
  event_type?: string | null
  id: string
  kind: "verification" | "reminder" | "test"
  phone: string
  title: string
  body: string
  status: Status
  scheduled_at: number
  expires_at: number
  created_at: number
  attempts: number
  request_key: string
  provider_id?: string | null
  last_error?: string | null
}
export class NotificationError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}
export function requireContact(
  contact: Contact | null
): asserts contact is Contact & { phone: string } {
  if (!contact?.phone || !contact.consent_at || !contact.enabled)
    throw new NotificationError("whatsapp_not_registered")
}
export function validSchedule(at: number, now: number) {
  if (!Number.isSafeInteger(at) || at < now - 60000 || at > now + 30 * 86400000)
    throw new NotificationError("invalid_schedule")
}
