import type {
  Actor,
  Contact,
  Notification,
  Status,
} from "../domain/notification.ts"
export interface NotificationRepository {
  contact(actor: Actor): Promise<Contact | null>
  list(actor: Actor): Promise<Notification[]>
  register(actor: Actor, phone: string, now: number): Promise<void>
  preferences(actor: Actor, enabled: boolean, timezone: string): Promise<void>
  enqueue(item: Notification): Promise<Notification>
  welcome(item: Notification): Promise<void>
  cancel(actor: Actor, id: string): Promise<boolean>
  claim(
    now: number,
    target?: Actor & { requestKey: string }
  ): Promise<Notification[]>
  track(now: number): Promise<Notification[]>
  eligible(item: Notification, now: number): Promise<boolean>
  update(
    id: string,
    status: Status,
    error?: string | null,
    providerId?: string | null
  ): Promise<void>
  retry(item: Notification, now: number): Promise<void>
  cleanup(now: number): Promise<void>
}
export interface WhatsAppGateway {
  connection(): Promise<string>
  send(item: Notification): Promise<{ status: Status; providerId?: string }>
  status(id: string): Promise<{ status: Status; providerId?: string } | null>
}
export type VerificationCrypto = {
  code(): string
  hash(id: string, code: string): Promise<string>
  id(): string
}
