import { useMessages } from "@/shared/i18n/use-messages"
import { useEmailVerification } from "../model/use-email-verification"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@workspace/ui/components/field"

export function VerifyEmailForm() {
  const { m, errorMessage } = useMessages()

  const { pending, error, submit } = useEmailVerification()
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
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            required
            disabled={pending}
            aria-invalid={!!error}
            aria-describedby="code-help"
          />
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
            <Link to="/login">{m("inicia sesión otra vez")}</Link>
            {m("para solicitar un nuevo código.")}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
