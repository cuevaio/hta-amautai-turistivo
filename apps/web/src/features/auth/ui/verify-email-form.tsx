import { useState } from "react"
import { useMessages } from "@/shared/i18n/use-messages"
import { useEmailVerification } from "../model/use-email-verification"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@workspace/ui/components/field"

export function VerifyEmailForm() {
  const { m, errorMessage } = useMessages()
  const { pending, error, submit } = useEmailVerification()
  const [code, setCode] = useState("")
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">{m("Revisa tu correo")}</h1>
          <p className="text-sm text-muted-foreground">
            {m(
              "Escribe el código de verificación que recibiste para continuar."
            )}
          </p>
        </div>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="code">{m("Código de verificación")}</FieldLabel>
          <InputOTP
            id="code"
            name="code"
            maxLength={6}
            pattern="[0-9]*"
            autoComplete="one-time-code"
            inputMode="numeric"
            required
            disabled={pending}
            value={code}
            onChange={setCode}
            aria-label={m("Código de verificación")}
            aria-invalid={!!error}
            aria-describedby="code-help"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} aria-invalid={!!error} />
              <InputOTPSlot index={1} aria-invalid={!!error} />
              <InputOTPSlot index={2} aria-invalid={!!error} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} aria-invalid={!!error} />
              <InputOTPSlot index={4} aria-invalid={!!error} />
              <InputOTPSlot index={5} aria-invalid={!!error} />
            </InputOTPGroup>
          </InputOTP>
          <FieldDescription id="code-help">
            {m("El código tiene 6 dígitos.")}
          </FieldDescription>
        </Field>
        {error && (
          <FieldDescription role="alert">
            {errorMessage(error)}
          </FieldDescription>
        )}
        <Field>
          <Button type="submit" disabled={pending}>
            {pending ? m("Verificando…") : m("Verificar y continuar")}
          </Button>
          <FieldDescription>
            {m("Si no llega, revisa spam o")}{" "}
            <Link to="/iniciar-sesion">{m("inicia sesión otra vez")}</Link>
            {m("para solicitar un nuevo código.")}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
