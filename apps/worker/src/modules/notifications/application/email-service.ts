import type { Actor } from "../domain/notification.ts"
import { validSchedule } from "../domain/notification.ts"
import {
  EmailError,
  requireEmail,
  type EmailNotification,
} from "../domain/email.ts"
import type { EmailProvider, EmailRepository, EmailResult } from "./email-ports.ts"
import type { VerificationCrypto } from "./ports.ts"
export function emailService(
  repo: EmailRepository,
  provider: EmailProvider,
  secure: VerificationCrypto,
  clock = Date.now
) {
  function item(
    actor: Actor,
    email: string,
    kind: EmailNotification["kind"],
    title: string,
    body: string,
    at: number,
    key: string
  ): EmailNotification {
    const now = clock()
    return {
      ...actor,
      id: secure.id(),
      email,
      kind,
      title,
      body,
      scheduled_at: at,
      expires_at: at + (kind === "verification" ? 600000 : 3600000),
      created_at: now,
      attempts: 0,
      request_key: key,
      status: "pending",
      last_error: null,
      provider_id: null,
    }
  }
  function available() {
    if (!provider.configured()) throw new EmailError("email_not_configured")
  }
  return {
    async overview(actor: Actor, email: string) {
      const [contact, items] = await Promise.all([
        repo.contact(actor),
        repo.list(actor),
      ])
      return {
        channel: "email" as const,
        configured: provider.configured(),
        contact: {
          email,
          verified: contact?.email === email && !!contact.verified_at,
          enabled: contact?.email === email && !!contact.enabled,
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
    async requestCode(actor: Actor, email: string) {
      available()
      const code = secure.code()
      const n = item(
        actor,
        email,
        "verification",
        "Verifica tu correo en Amautai",
        "Tu código de verificación es " +
          code +
          ". Vence en 10 minutos. No lo compartas.",
        clock(),
        secure.id()
      )
      await repo.challenge(n, await secure.hash("email:" + n.id, code))
    },
    async verify(actor: Actor, email: string, code: string) {
      const contact = await repo.contact(actor)
      if (
        !contact?.challenge_id ||
        contact.email !== email ||
        !(await repo.confirm(
          actor,
          email,
          await secure.hash("email:" + contact.challenge_id, code),
          clock()
        ))
      )
        throw new EmailError("invalid_email_code")
    },
    async preferences(actor: Actor, email: string, enabled: boolean) {
      if (enabled) {
        available()
        const contact = await repo.contact(actor)
        if (!contact?.verified_at || contact.email !== email)
          throw new EmailError("email_not_verified")
      }
      await repo.preferences(actor, email, enabled)
    },
    async schedule(
      actor: Actor,
      email: string,
      input: { title: string; scheduledAt: number; requestKey: string },
      test = false
    ) {
      available()
      requireEmail(await repo.contact(actor), email)
      const at = test ? clock() : input.scheduledAt
      validSchedule(at, clock())
      const title = test ? "Mensaje de prueba de Amautai" : input.title
      return repo.enqueue(
        item(
          actor,
          email,
          test ? "test" : "reminder",
          title,
          test
            ? "Tus notificaciones por email están activas."
            : "Amautai · Recordatorio: " +
                title +
                "\nRevisa tus actividades en https://amautai.urday.dev/dashboard",
          at,
          input.requestKey
        )
      )
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
    // A thrown provider operation may already have submitted the message.
    const result: EmailResult = await provider
      .send(n)
      .catch(() => ({
        status: "uncertain" as const,
        error: "submission_unknown",
      }))
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
