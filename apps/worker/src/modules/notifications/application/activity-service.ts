import type { Actor } from "../domain/notification.ts"
import { NotificationError } from "../domain/notification.ts"
import {
  activityTypes,
  includesChannel,
  type ActivityPreference,
  type ActivityType,
  type NotificationChannel,
} from "../domain/activity.ts"
import type { EmailAccount } from "../domain/email.ts"

export interface ActivityPreferences {
  list(actor: Actor): Promise<ActivityPreference[]>
  save(
    actor: Actor,
    type: ActivityType,
    channel: NotificationChannel
  ): Promise<void>
}
type Channels = {
  email: { configured: boolean; verified: boolean; optedOut: boolean }
  whatsapp: { registered: boolean }
}
export function activityPreferences(repo: ActivityPreferences) {
  return {
    async overview(actor: Actor, channels: Channels) {
      const saved = await repo.list(actor)
      return {
        preferences: activityTypes.map((type) => ({
          type,
          channel:
            saved.find((p) => p.type === type)?.channel ??
            (channels.email.optedOut ? "none" : "email"),
        })),
      }
    },
    async save(
      actor: Actor,
      preference: ActivityPreference,
      channels: Channels
    ) {
      if (
        includesChannel(preference.channel, "email") &&
        (!channels.email.configured || !channels.email.verified)
      )
        throw new NotificationError("email_verification_required")
      if (
        includesChannel(preference.channel, "whatsapp") &&
        !channels.whatsapp.registered
      )
        throw new NotificationError("whatsapp_not_registered")
      await repo.save(actor, preference.type, preference.channel)
    },
  }
}
// Internal application entrypoint. Producers must authorize the recipient relationship
// within the tenant before calling this function. No public event-injection endpoint.
export function activityNotifications(deps: {
  preferences: ActivityPreferences
  email: (
    actor: Actor,
    account: EmailAccount,
    input: {
      title: string
      scheduledAt: number
      requestKey: string
      eventType: ActivityType
    }
  ) => Promise<unknown>
  whatsapp: (
    actor: Actor,
    input: {
      title: string
      scheduledAt: number
      requestKey: string
      eventType: ActivityType
    }
  ) => Promise<unknown>
}) {
  return async (
    actor: Actor,
    account: EmailAccount,
    event: { id: string; type: ActivityType; title: string; at: number }
  ) => {
    const preferences = await deps.preferences.list(actor)
    const channel =
      preferences.find((p) => p.type === event.type)?.channel ?? "email"
    const input = {
      title: event.title,
      scheduledAt: event.at,
      requestKey: event.id,
      eventType: event.type,
    }
    // Each channel has its own idempotent outbox; one outage must not block the other.
    return Promise.allSettled([
      ...(includesChannel(channel, "email")
        ? [deps.email(actor, account, input)]
        : []),
      ...(includesChannel(channel, "whatsapp")
        ? [deps.whatsapp(actor, input)]
        : []),
    ])
  }
}
