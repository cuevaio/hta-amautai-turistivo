import {
  NotificationError,
  requireContact,
  validSchedule,
  type Actor,
} from "../domain/notification.ts"
import type {
  NotificationRepository,
  WhatsAppGateway,
  VerificationCrypto,
} from "./ports.ts"
export function notificationService(
  repo: NotificationRepository,
  gateway: WhatsAppGateway,
  secure: VerificationCrypto,
  clock = Date.now
) {
  return {
    async overview(actor: Actor) {
      const [contact, items, connection] = await Promise.all([
        repo.contact(actor),
        repo.list(actor),
        gateway.connection().catch(() => "unavailable"),
      ])
      return {
        contact: contact
          ? {
              phone: contact.phone,
              verified: !!contact.verified_at,
              enabled: !!contact.enabled,
              timezone: contact.timezone,
              verificationExpiresAt: contact.challenge_expires,
            }
          : null,
        notifications: items.map(
          ({
            id,
            kind,
            title,
            status,
            scheduled_at,
            created_at,
            last_error,
          }) => ({
            id,
            kind,
            title,
            status,
            scheduledAt: scheduled_at,
            createdAt: created_at,
            error: last_error || null,
          })
        ),
        connection,
      }
    },
    async requestCode(actor: Actor, phone: string) {
      if ((await gateway.connection()) !== "connected")
        throw new NotificationError("whatsapp_unavailable")
      const id = secure.id(),
        code = secure.code(),
        now = clock()
      await repo.challenge(actor, {
        id,
        phone,
        hash: await secure.hash(id, code),
        body:
          "Amautai: tu código de verificación es " +
          code +
          ". Vence en 10 minutos. No lo compartas.",
        now,
      })
    },
    async verify(actor: Actor, code: string) {
      const id = await repo.challengeId(actor)
      if (
        !id ||
        !(await repo.confirm(actor, await secure.hash(id, code), clock()))
      )
        throw new NotificationError("invalid_whatsapp_code")
    },
    async preferences(actor: Actor, enabled: boolean, timezone: string) {
      if (enabled) {
        const contact = await repo.contact(actor)
        if (!contact?.verified_at)
          throw new NotificationError("whatsapp_not_verified")
      }
      await repo.preferences(actor, enabled, timezone)
    },
    async schedule(
      actor: Actor,
      input: { title: string; scheduledAt: number; requestKey: string },
      test = false
    ) {
      const contact = await repo.contact(actor)
      requireContact(contact)
      const now = clock(),
        at = test ? now : input.scheduledAt
      validSchedule(at, now)
      const title = test ? "Mensaje de prueba" : input.title
      return repo.enqueue({
        ...actor,
        id: secure.id(),
        phone: contact.phone,
        kind: test ? "test" : "reminder",
        title,
        body: test
          ? "Amautai: tus notificaciones por WhatsApp están activas."
          : "Amautai · Recordatorio: " +
            title +
            String.fromCharCode(10) +
            "Revisa tus actividades en https://amautai.urday.dev/dashboard/notifications",
        status: "pending",
        scheduled_at: at,
        expires_at: at + 3600000,
        created_at: now,
        attempts: 0,
        request_key: input.requestKey,
      })
    },
    async cancel(actor: Actor, id: string) {
      if (!(await repo.cancel(actor, id)))
        throw new NotificationError("notification_not_pending")
    },
  }
}
export async function dispatchNotifications(
  repo: NotificationRepository,
  gateway: WhatsAppGateway,
  now = Date.now()
) {
  await repo.cleanup(now)
  for (const item of await repo.track(now)) {
    try {
      const result = await gateway.status(item.id)
      if (result)
        await repo.update(item.id, result.status, null, result.providerId)
    } catch {
      /* Persist state until the next bounded polling cycle. */
    }
  }
  for (const item of await repo.claim(now)) {
    if (!(await repo.eligible(item, Date.now()))) {
      await repo.update(item.id, "cancelled")
      continue
    }
    try {
      const result = await gateway.send(item)
      await repo.update(item.id, result.status, null, result.providerId)
    } catch {
      await repo.retry(item, now)
    }
  }
}
