import { useLoginForm } from "../model/use-login-form"
import { Link } from "react-router"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field"

export function LoginForm({
  mode = "login",
  className,
  ...props
}: React.ComponentProps<"form"> & { mode?: "login" | "signup" }) {
  const { signup, pending, error, issues, submit, oauth } = useLoginForm(mode)
  return (
    <form
      {...props}
      className={cn("flex flex-col gap-6", className)}
      onSubmit={submit}
    >
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Construye desde aquí
          </p>
          <h1 className="text-3xl font-semibold">
            {signup ? "Crea tu cuenta" : "Bienvenido a Amautai"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {signup
              ? "Tu próximo proyecto empieza con una cuenta."
              : "Un espacio para convertir ideas en proyectos."}
          </p>
        </div>
        <Field className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            type="button"
            disabled={pending}
            onClick={() => oauth("google")}
          >
            <img
              src="/brand/providers/google.svg"
              width={16}
              height={16}
              alt=""
              aria-hidden="true"
              data-icon="inline-start"
            />
            Google
          </Button>
          <Button
            variant="outline"
            type="button"
            disabled={pending}
            onClick={() => oauth("github")}
          >
            <img
              src="/brand/providers/github-light.svg"
              width={16}
              height={16}
              alt=""
              aria-hidden="true"
              data-icon="inline-start"
              className="dark:hidden"
            />
            <img
              src="/brand/providers/github-dark.svg"
              width={16}
              height={16}
              alt=""
              aria-hidden="true"
              data-icon="inline-start"
              className="hidden dark:block"
            />
            GitHub
          </Button>
        </Field>
        <FieldSeparator>
          {signup ? "O regístrate con tu correo" : "O entra con tu correo"}
        </FieldSeparator>
        {signup && (
          <Field data-invalid={!!issues.firstName}>
            <FieldLabel htmlFor="firstName">Nombre</FieldLabel>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              required
              maxLength={100}
              aria-invalid={!!issues.firstName}
              aria-describedby={
                issues.firstName ? "firstName-error" : undefined
              }
              disabled={pending}
            />
            {issues.firstName && (
              <FieldDescription id="firstName-error">
                {issues.firstName}
              </FieldDescription>
            )}
          </Field>
        )}
        <Field data-invalid={!!issues.email}>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="tu@ejemplo.com"
            required
            maxLength={254}
            aria-invalid={!!issues.email}
            aria-describedby={issues.email ? "email-error" : undefined}
            disabled={pending}
          />
          {issues.email && (
            <FieldDescription id="email-error">{issues.email}</FieldDescription>
          )}
        </Field>
        <Field data-invalid={!!issues.password}>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            required
            minLength={signup ? 12 : 1}
            maxLength={256}
            aria-invalid={!!issues.password}
            aria-describedby="password-help"
            disabled={pending}
          />
          <FieldDescription id="password-help">
            {issues.password ||
              (signup
                ? "Al menos 12 caracteres. Evita contraseñas comunes o reutilizadas."
                : "")}
          </FieldDescription>
        </Field>
        {signup && (
          <Field data-invalid={!!issues.confirm}>
            <FieldLabel htmlFor="confirm">Confirmar contraseña</FieldLabel>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              maxLength={256}
              aria-invalid={!!issues.confirm}
              aria-describedby={issues.confirm ? "confirm-error" : undefined}
              disabled={pending}
            />
            {issues.confirm && (
              <FieldDescription id="confirm-error">
                {issues.confirm}
              </FieldDescription>
            )}
          </Field>
        )}
        {new URLSearchParams(window.location.search).has("password_reset") && (
          <FieldDescription role="status">
            Tu contraseña fue actualizada. Inicia sesión con la nueva
            contraseña.
          </FieldDescription>
        )}
        {error && <FieldDescription role="alert">{error}</FieldDescription>}
        <Field>
          <Button type="submit" disabled={pending}>
            {pending
              ? signup
                ? "Creando cuenta…"
                : "Entrando…"
              : signup
                ? "Crear cuenta"
                : "Iniciar sesión"}
          </Button>
          <FieldDescription className="text-center">
            {signup ? "¿Ya tienes una cuenta? " : "¿No tienes una cuenta? "}
            <Link to={signup ? "/login" : "/signup"}>
              {signup ? "Inicia sesión" : "Crear cuenta"}
            </Link>
          </FieldDescription>
        </Field>
        <FieldDescription className="text-center">
          <Link to="/forgot-password">Olvidé mi contraseña</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
