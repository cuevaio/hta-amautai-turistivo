import { useMessages } from "@/shared/i18n/use-messages"
import { usePasswordRecovery } from "../model/use-password-recovery"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@workspace/ui/components/field"

export function PasswordRecoveryForm({ reset = false }: { reset?: boolean }) {
  const { m, errorMessage } = useMessages()

  const { valid, pending, sent, error, invalid, submit } =
    usePasswordRecovery(reset)
  if (reset && valid === null)
    return (
      <div className="flex flex-col gap-4">
        <p role="status">{m("Comprobando enlace…")}</p>
        {error && <p role="alert">{errorMessage(error)}</p>}
      </div>
    )
  if (reset && !valid)
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">
          {m("Necesitas un enlace nuevo")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {m(
            "Este enlace no está disponible o venció. Solicita otro para recuperar tu contraseña."
          )}
        </p>
        <Button nativeButton={false} render={<Link to="/recuperar-contrasena" />}>
          {m("Solicitar nuevo enlace")}
        </Button>
      </div>
    )
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">
            {reset
              ? m("Nueva contraseña")
              : sent
                ? m("Revisa tu correo")
                : m("Recupera tu cuenta")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {reset
              ? m("Elige una contraseña que no hayas usado antes.")
              : sent
                ? m(
                    "Si existe una cuenta con ese correo, recibirás un enlace para recuperar tu contraseña. Revisa también spam."
                  )
                : m(
                    "Te enviaremos un enlace para elegir una nueva contraseña."
                  )}
          </p>
        </div>
        {!sent &&
          (reset ? (
            <>
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="newPassword">
                  {m("Nueva contraseña")}
                </FieldLabel>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={256}
                  disabled={pending}
                  aria-invalid={invalid}
                  aria-describedby="new-password-help"
                />
                <FieldDescription id="new-password-help">
                  {m(
                    "Al menos 12 caracteres. Evita contraseñas comunes o reutilizadas."
                  )}
                </FieldDescription>
              </Field>
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="confirm">
                  {m("Confirmar contraseña")}
                </FieldLabel>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={256}
                  disabled={pending}
                  aria-invalid={invalid}
                />
              </Field>
            </>
          ) : (
            <Field data-invalid={invalid}>
              <FieldLabel htmlFor="recovery-email">
                {m("Correo electrónico")}
              </FieldLabel>
              <Input
                id="recovery-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                disabled={pending}
                aria-invalid={invalid}
                placeholder="tu@ejemplo.com"
              />
            </Field>
          ))}
        {error && (
          <FieldDescription role="alert">
            {errorMessage(error)}
          </FieldDescription>
        )}
        {!sent && (
          <Field>
            <Button type="submit" disabled={pending}>
              {pending
                ? m("Procesando…")
                : reset
                  ? m("Guardar nueva contraseña")
                  : m("Enviar enlace de recuperación")}
            </Button>
          </Field>
        )}
        <FieldDescription className="text-center">
          <Link to="/iniciar-sesion">{m("Volver a iniciar sesión")}</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
