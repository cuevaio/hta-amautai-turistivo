import { z } from "zod"
import type { AuthMailer } from "../application/auth-service.ts"
import type { TransactionalEmailProvider } from "../../../shared/application/email.ts"
const verification = z.object({
  id: z.string(),
  email: z.email(),
  code: z.string().regex(/^\d{6}$/),
})
const recovery = z.object({
  id: z.string(),
  email: z.email(),
  passwordResetUrl: z.url(),
})
export function authMailer(provider: TransactionalEmailProvider): AuthMailer {
  async function send(id: string, email: string, title: string, body: string) {
    if (!provider.configured())
      throw { code: "auth_email_unavailable", status: 503 }
    const result = await provider.send({ id, email, title, body })
    // Never silently fall back to another sender or retry an uncertain submission.
    if (result.status !== "accepted")
      throw { code: "auth_email_unavailable", status: 503 }
  }
  return {
    async verification(input) {
      const data = verification.parse(input)
      await send(
        data.id,
        data.email,
        "Verifica tu correo en Amautai",
        "Tu código de verificación de Amautai es: " +
          data.code +
          "\n\nEscríbelo en la pantalla de acceso. Si no solicitaste este correo, puedes ignorarlo."
      )
    },
    async recovery(input) {
      const data = recovery.parse(input)
      const url = new URL(data.passwordResetUrl)
      if (
        ![
          "https://amautai.turistivo.com",
          "https://amautai.urday.dev",
        ].includes(url.origin) ||
        url.pathname !== "/api/auth/password-reset/start" ||
        !url.searchParams.get("token")
      )
        throw { code: "auth_email_unavailable", status: 503 }
      await send(
        data.id,
        data.email,
        "Recupera tu contraseña de Amautai",
        "Solicitaste recuperar tu contraseña de Amautai. Abre este enlace para elegir una nueva:\n\n" +
          url.href +
          "\n\nSi no lo solicitaste, ignora este correo. Tu contraseña no cambiará."
      )
    },
  }
}
