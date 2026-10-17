import type { Actor } from "../domain/notification.ts"
import type {
  EmailContact,
  EmailNotification,
  EmailStatus,
} from "../domain/email.ts"
export type EmailResult = {
  status: "accepted" | "failed" | "uncertain" | "retry"
  providerId?: string
  error?: string
}
export interface EmailProvider {
  configured(): boolean
  send(item: EmailNotification): Promise<EmailResult>
}
export interface EmailRepository {
  contact(actor: Actor): Promise<EmailContact | null>
  list(actor: Actor): Promise<EmailNotification[]>
  challenge(item: EmailNotification, hash: string): Promise<void>
  confirm(
    actor: Actor,
    email: string,
    hash: string,
    now: number
  ): Promise<boolean>
  preferences(actor: Actor, email: string, enabled: boolean): Promise<void>
  enqueue(item: EmailNotification): Promise<EmailNotification>
  cancel(actor: Actor, id: string): Promise<boolean>
  claim(now: number): Promise<EmailNotification[]>
  eligible(item: EmailNotification, now: number): Promise<boolean>
  finish(
    item: EmailNotification,
    status: EmailStatus,
    error: string | null,
    providerId: string | null,
    now: number
  ): Promise<void>
  retry(item: EmailNotification, now: number): Promise<void>
  cleanup(now: number): Promise<void>
}
