import type { Actor } from "../domain/notification.ts"
import { validSchedule } from "../domain/notification.ts"
import {
  EmailError,
  requireEmail,
  type EmailAccount,
  type EmailNotification,
} from "../domain/email.ts"
import type {
  EmailProvider,
  EmailRepository,
  EmailResult,
} from "./email-ports.ts"

export function emailService(
  repo: EmailRepository,
  provider: EmailProvider,
  secure: { id(): string },
  clock = Date.now
) {
  function available() {
    if (!provider.configured()) throw new EmailError("email_not_configured")
  }
  async function sync(actor: Actor, account: EmailAccount) {
    if (!account.emailVerified)
      throw new EmailError("email_verification_required")
    await repo.syncAccount(actor, account.email, clock())
  }
  return {
    async overview(actor: Actor, account: EmailAccount) {
      const [contact, items] = await Promise.all([
        repo.contact(actor),
        repo.list(actor),
      ])
      return {
        channel: "email" as const,
        configured: provider.configured(),
        contact: {
          email: account.email,
          verified: account.emailVerified,
          enabled: account.emailVerified && !contact?.opted_out,
        },
        notifications: items.map((n) => ({
          id: n.id,
          kind: n.kind,
          title: n.title,
          status: n.status,
          scheduledAt: n.scheduled_at,
          createdAt: n.created_at,
          error: n.last_error,
        })),
      }
    },
    async preferences(actor: Actor, account: EmailAccount, enabled: boolean) {
      if (enabled) available()
      await sync(actor, account)
      await repo.preferences(actor, account.email, enabled)
    },
    async schedule(
      actor: Actor,
      account: EmailAccount,
      input: {
        title: string
        scheduledAt: number
        requestKey: string
        eventType?: string
      },
      test = false
    ) {
      available()
      await sync(actor, account)
      requireEmail(await repo.contact(actor), account.email)
      const now = clock(),
        at = test ? now : input.scheduledAt
      validSchedule(at, now)
      const title = test ? "Mensaje de prueba de Amautai" : input.title
      const n: EmailNotification = {
        ...actor,
        id: secure.id(),
        email: account.email,
        kind: test ? "test" : "reminder",
        event_type: input.eventType || null,
        title,
        body: test
          ? "Tus notificaciones por email están activas."
          : (input.eventType ? "Amautai · " : "Amautai · Recordatorio: ") +
            title +
            "\nRevisa tus actividades en https://amautai.urday.dev/dashboard",
        scheduled_at: at,
        expires_at: at + 3600000,
        created_at: now,
        attempts: 0,
        request_key: input.requestKey,
        status: "pending",
        last_error: null,
        provider_id: null,
      }
      return repo.enqueue(n)
    },
    async cancel(actor: Actor, id: string) {
      if (!(await repo.cancel(actor, id)))
        throw new EmailError("email_not_pending")
    },
  }
}
export async function dispatchEmail(
  repo: EmailRepository,
  provider: EmailProvider,
  now = Date.now()
) {
  if (!provider.configured()) return
  await repo.cleanup(now)
  for (const n of await repo.claim(now)) {
    if (!(await repo.eligible(n, now))) {
      await repo.finish(n, "cancelled", null, null, now)
      continue
    }
    const result: EmailResult = await provider
      .send(n)
      .catch(() => ({ status: "uncertain", error: "submission_unknown" }))
    if (result.status === "retry" && n.attempts < 5) await repo.retry(n, now)
    else
      await repo.finish(
        n,
        result.status === "retry" ? "failed" : result.status,
        result.error || null,
        result.providerId || null,
        now
      )
  }
}
