import { z } from "zod"
import type { EmailProvider } from "../application/email-ports.ts"
const core = "urn:ietf:params:jmap:core",
  mail = "urn:ietf:params:jmap:mail",
  submission = "urn:ietf:params:jmap:submission"
const responses = z.object({
  methodResponses: z.array(
    z.tuple([z.string(), z.record(z.string(), z.unknown()), z.string()])
  ),
})
const sessionSchema = z.object({
  apiUrl: z.url(),
  primaryAccounts: z.record(z.string(), z.string()),
})
const createdSchema = z.object({
  created: z.record(z.string(), z.object({ id: z.string() })).optional(),
  notCreated: z.record(z.string(), z.unknown()).optional(),
})
export function stalwartEmail(config: {
  sessionUrl?: string
  username?: string
  password?: string
  from?: string
}): EmailProvider {
  let sessionUrl: URL | undefined
  try {
    const url = new URL(config.sessionUrl || "")
    if (url.protocol === "https:" && !url.username && !url.password)
      sessionUrl = url
  } catch {
    /* Missing configuration disables this channel. */
  }
  const enabled = !!(
    sessionUrl &&
    config.username &&
    config.password &&
    z.email().safeParse(config.from).success
  )
  return {
    configured: () => enabled,
    async send(item) {
      if (!enabled) return { status: "retry", error: "email_not_configured" }
      const bytes = new TextEncoder().encode(
        config.username + ":" + config.password
      )
      const headers = {
        Authorization:
          "Basic " +
          btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join("")),
        "Content-Type": "application/json",
      }
      let submitting = false
      try {
        const discovery = await fetch(sessionUrl!.href, {
          headers,
          signal: AbortSignal.timeout(8000),
          redirect: "manual",
        })
        if (!discovery.ok)
          return { status: "retry", error: "email_unavailable" }
        const session = sessionSchema.parse(await discovery.json())
        const api = new URL(session.apiUrl)
        if (api.origin !== sessionUrl!.origin || api.username || api.password)
          return { status: "failed", error: "invalid_email_endpoint" }
        const accountId = session.primaryAccounts[submission]
        if (!accountId || session.primaryAccounts[mail] !== accountId)
          return { status: "failed", error: "email_account_unavailable" }
        async function call(methodCalls: unknown[]) {
          const res = await fetch(api.href, {
            method: "POST",
            headers,
            body: JSON.stringify({
              using: [core, mail, submission],
              methodCalls,
            }),
            signal: AbortSignal.timeout(15000),
            redirect: "manual",
          })
          if (!res.ok) throw new Error("email_unavailable")
          return responses.parse(await res.json()).methodResponses
        }
        const setup = await call([
          ["Identity/get", { accountId }, "identity"],
          [
            "Mailbox/query",
            { accountId, filter: { role: "drafts" } },
            "drafts",
          ],
        ])
        const identities = z
          .object({
            list: z.array(z.object({ id: z.string(), email: z.string() })),
          })
          .parse(
            setup.find(
              (r) => r[0] === "Identity/get" && r[2] === "identity"
            )?.[1]
          ).list
        const identity = identities.find(
          (i) => i.email.toLowerCase() === config.from!.toLowerCase()
        )
        const mailbox = z
          .object({ ids: z.array(z.string()) })
          .parse(
            setup.find(
              (r) => r[0] === "Mailbox/query" && r[2] === "drafts"
            )?.[1]
          ).ids[0]
        if (!identity || !mailbox)
          return { status: "failed", error: "email_identity_unavailable" }
        submitting = true
        const result = await call([
          [
            "Email/set",
            {
              accountId,
              create: {
                message: {
                  mailboxIds: { [mailbox]: true },
                  keywords: { $draft: true },
                  from: [{ name: "Amautai", email: config.from }],
                  to: [{ email: item.email }],
                  subject: item.title,
                  textBody: [{ partId: "text", type: "text/plain" }],
                  bodyValues: { text: { value: item.body } },
                  messageId: [item.id + "@" + config.from!.split("@")[1]],
                },
              },
            },
            "message",
          ],
          [
            "EmailSubmission/set",
            {
              accountId,
              create: {
                send: { emailId: "#message", identityId: identity.id },
              },
              onSuccessDestroyEmail: ["#send"],
            },
            "submit",
          ],
        ])
        const submitted = result.find(
          (r) => r[0] === "EmailSubmission/set" && r[2] === "submit"
        )
        if (submitted) {
          const data = createdSchema.parse(submitted[1])
          if (data.created?.send)
            return { status: "accepted", providerId: data.created.send.id }
          if (data.notCreated?.send)
            return { status: "failed", error: "email_rejected" }
        }
        const message = result.find(
          (r) => r[0] === "Email/set" && r[2] === "message"
        )
        if (message && createdSchema.parse(message[1]).notCreated?.message)
          return { status: "failed", error: "email_rejected" }
        return { status: "uncertain", error: "submission_unknown" }
      } catch {
        return submitting
          ? { status: "uncertain", error: "submission_unknown" }
          : { status: "retry", error: "email_unavailable" }
      }
    },
  }
}
