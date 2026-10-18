import { useMessages } from "@/shared/i18n/use-messages"
import { useState } from "react"
import {
  motion,
  stagger,
  useReducedMotion,
  type Variants,
  type HTMLMotionProps,
} from "motion/react"
import { MailIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
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
} from "@workspace/ui/components/field"

const MotionButton = motion.create(Button)
const MotionDescription = motion.create(FieldDescription)
const entrance: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: "easeOut" },
  },
}
const sequence: Variants = {
  visible: { transition: { delayChildren: stagger(0.075) } },
}

export function LoginForm({
  mode = "login",
  className,
  ...props
}: HTMLMotionProps<"div"> & { mode?: "login" | "signup" }) {
  const { m, errorMessage } = useMessages()
  const reducedMotion = useReducedMotion()

  const { signup, pending, error, issues, submit, oauth } = useLoginForm(mode)
  const [emailOpen, setEmailOpen] = useState(() =>
    new URLSearchParams(window.location.search).has("password_reset")
  )
  return (
    <motion.div
      {...props}
      className={cn("flex flex-col gap-6", className)}
      initial={reducedMotion ? false : "hidden"}
      animate="visible"
      variants={sequence}
    >
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <motion.p
            variants={entrance}
            className="text-xs font-medium text-muted-foreground"
          >
            {m("Aprender empieza aquí")}
          </motion.p>
          <motion.h1 variants={entrance} className="text-2xl font-semibold">
            {signup ? m("Crea tu cuenta") : m("Bienvenido a Amautai")}
          </motion.h1>
          <motion.p
            variants={entrance}
            className="text-sm text-muted-foreground"
          >
            {signup
              ? m(
                  "Crea tu cuenta para acompañar el aprendizaje de matemáticas."
                )
              : m("Un espacio para enseñar y aprender matemáticas.")}
          </motion.p>
        </div>
        <Field>
          <MotionButton
            variants={entrance}
            className="h-auto min-h-9 py-1.5 whitespace-normal"
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
            {signup
              ? m("Crear cuenta con Google")
              : m("Iniciar sesión con Google")}
          </MotionButton>
          <MotionButton
            variants={entrance}
            className="h-auto min-h-9 py-1.5 whitespace-normal"
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
            {signup
              ? m("Crear cuenta con GitHub")
              : m("Iniciar sesión con GitHub")}
          </MotionButton>
          <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
            <DialogTrigger
              render={
                <MotionButton
                  variants={entrance}
                  className="h-auto min-h-9 py-1.5 whitespace-normal"
                  variant="outline"
                  type="button"
                />
              }
            >
              <MailIcon data-icon="inline-start" />
              {signup
                ? m("Crear cuenta con correo")
                : m("Iniciar sesión con correo")}
            </DialogTrigger>
            <DialogContent
              closeLabel={m("Cerrar")}
              className="max-h-[calc(100svh-2rem)] overflow-y-auto"
            >
              <DialogHeader>
                <DialogTitle>
                  {signup
                    ? m("Crea tu cuenta con correo")
                    : m("Iniciar sesión con correo")}
                </DialogTitle>
                {signup && (
                  <DialogDescription>
                    {m("Ingresa tus datos para crear tu cuenta en Amautai.")}
                  </DialogDescription>
                )}
              </DialogHeader>
              <form noValidate onSubmit={submit} aria-busy={pending}>
                <FieldGroup>
                  {signup && (
                    <Field data-invalid={!!issues.firstName}>
                      <FieldLabel htmlFor="firstName">{m("Nombre")}</FieldLabel>
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
                          {m(issues.firstName)}
                        </FieldDescription>
                      )}
                    </Field>
                  )}
                  <Field data-invalid={!!issues.email}>
                    <FieldLabel htmlFor="email">
                      {m("Correo electrónico")}
                    </FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      placeholder="tu@ejemplo.com"
                      required
                      maxLength={254}
                      aria-invalid={!!issues.email}
                      aria-describedby={
                        issues.email ? "email-error" : undefined
                      }
                      disabled={pending}
                    />
                    {issues.email && (
                      <FieldDescription id="email-error">
                        {m(issues.email)}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field data-invalid={!!issues.password}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <FieldLabel htmlFor="password">
                        {m("Contraseña")}
                      </FieldLabel>
                      {!signup && (
                        <Link
                          to="/recuperar-contrasena"
                          className="text-sm underline-offset-4 hover:underline"
                        >
                          {m("Olvidé mi contraseña")}
                        </Link>
                      )}
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={
                        signup ? "new-password" : "current-password"
                      }
                      required
                      minLength={signup ? 12 : 1}
                      maxLength={256}
                      aria-invalid={!!issues.password}
                      aria-describedby="password-help"
                      disabled={pending}
                    />
                    <FieldDescription id="password-help">
                      {m(issues.password || "") ||
                        (signup
                          ? m(
                              "Al menos 12 caracteres. Evita contraseñas comunes o reutilizadas."
                            )
                          : "")}
                    </FieldDescription>
                  </Field>
                  {signup && (
                    <Field data-invalid={!!issues.confirm}>
                      <FieldLabel htmlFor="confirm">
                        {m("Confirmar contraseña")}
                      </FieldLabel>
                      <Input
                        id="confirm"
                        name="confirm"
                        type="password"
                        autoComplete="new-password"
                        required
                        maxLength={256}
                        aria-invalid={!!issues.confirm}
                        aria-describedby={
                          issues.confirm ? "confirm-error" : undefined
                        }
                        disabled={pending}
                      />
                      {issues.confirm && (
                        <FieldDescription id="confirm-error">
                          {m(issues.confirm)}
                        </FieldDescription>
                      )}
                    </Field>
                  )}
                  {new URLSearchParams(window.location.search).has(
                    "password_reset"
                  ) && (
                    <FieldDescription role="status">
                      {m(
                        "Tu contraseña fue actualizada. Inicia sesión con la nueva contraseña."
                      )}
                    </FieldDescription>
                  )}
                  {error && (
                    <FieldDescription role="alert">
                      {errorMessage(error)}
                    </FieldDescription>
                  )}
                  <Field>
                    <Button type="submit" disabled={pending}>
                      {pending
                        ? signup
                          ? m("Creando cuenta…")
                          : m("Entrando…")
                        : signup
                          ? m("Crear cuenta")
                          : m("Iniciar sesión")}
                    </Button>
                    <FieldDescription className="text-center">
                      {signup
                        ? m("¿Ya tienes una cuenta?")
                        : m("¿No tienes una cuenta?")}{" "}
                      <Link to={signup ? "/iniciar-sesion" : "/crear-cuenta"}>
                        {signup ? m("Inicia sesión") : m("Crear cuenta")}
                      </Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </DialogContent>
          </Dialog>
        </Field>
        {!emailOpen && error && (
          <FieldDescription role="alert">
            {errorMessage(error)}
          </FieldDescription>
        )}
        <MotionDescription variants={entrance} className="text-center">
          {signup ? m("¿Ya tienes una cuenta?") : m("¿No tienes una cuenta?")}{" "}
          <Link to={signup ? "/iniciar-sesion" : "/crear-cuenta"}>
            {signup ? m("Inicia sesión") : m("Crear cuenta")}
          </Link>
        </MotionDescription>
      </FieldGroup>
    </motion.div>
  )
}
