import { useRef, useState, type FormEvent } from "react"
import {
  accountProfileInput,
  type AccountProfileRole,
} from "@amautai/contracts"
import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router"
import { useMessages } from "@/shared/i18n/use-messages"
import { BrandLogo } from "@/shared/ui/brand-logo"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { useProfile } from "../model/profile-provider"

export function ProfileTypeSelection() {
  const { m, locale } = useMessages()
  const { save } = useProfile()
  const navigate = useNavigate()
  const [role, setRole] = useState<AccountProfileRole | "">("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [phone, setPhone] = useState("")
  const [consent, setConsent] = useState(false)
  const [phoneError, setPhoneError] = useState("")
  const submitting = useRef(false)
  const phoneInput = useRef<HTMLInputElement>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!role || submitting.current) return
    setPhoneError("")
    const input = accountProfileInput.safeParse({
      role,
      phone,
      consent,
      locale,
    })
    if (!input.success) {
      setPhoneError("Escribe un número válido con código de país.")
      phoneInput.current?.focus()
      return
    }
    submitting.current = true
    setBusy(true)
    setError("")
    try {
      await save(input.data)
      navigate(role === "teacher" ? "/registro/docente" : "/registro/familia", {
        replace: true,
      })
    } catch {
      setError("No pudimos guardar tu perfil")
      setBusy(false)
      submitting.current = false
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/70 p-5 sm:p-8">
      <section className="w-full max-w-2xl rounded-4xl bg-card p-6 text-card-foreground sm:p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <BrandLogo className="h-10 w-40" />
          <LanguageSelector compact />
        </div>
        <div className="mb-7 flex flex-col gap-2">
          <h1 className="text-xl font-semibold sm:text-2xl">
            {m("Elige tu perfil")}
          </h1>
          <p className="text-muted-foreground">{m("¿Cómo usarás Amautai?")}</p>
        </div>
        <form onSubmit={(event) => void submit(event)}>
          <p id="profile-type-label" className="mb-3 text-sm font-medium">
            {m("Selecciona una opción")}
          </p>
          <ToggleGroup
            aria-labelledby="profile-type-label"
            value={role ? [role] : []}
            onValueChange={(values) =>
              setRole((values[0] as AccountProfileRole | undefined) ?? "")
            }
            disabled={busy}
            variant="outline"
            orientation="vertical"
            className="mx-auto grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <ToggleGroupItem
              value="teacher"
              className="h-auto min-h-0 flex-col items-stretch gap-0 overflow-hidden rounded-xl border-2 p-0 text-left whitespace-normal aria-pressed:border-primary"
            >
              <img
                src="/images/profile-selection/teacher.webp"
                alt=""
                aria-hidden="true"
                className="aspect-[4/3] w-full object-cover"
              />
              <span className="flex min-w-0 flex-col gap-1 px-4 py-3">
                <span className="text-base font-semibold">{m("Profesor")}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {m("Crear experiencias de aprendizaje para tu grupo.")}
                </span>
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="parent"
              className="h-auto min-h-0 flex-col items-stretch gap-0 overflow-hidden rounded-xl border-2 p-0 text-left whitespace-normal aria-pressed:border-primary"
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-t-xl">
                <img
                  src="/images/profile-selection/family.webp"
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full origin-bottom scale-105 object-cover"
                />
              </div>
              <span className="flex min-w-0 flex-col gap-1 px-4 py-3">
                <span className="text-base font-semibold">
                  {m("Padre o madre")}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {m("Acompañar el aprendizaje en casa.")}
                </span>
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="mt-6 flex flex-col gap-4">
            <Field data-invalid={!!phoneError}>
              <FieldLabel htmlFor="registration-phone">
                {m("Número de WhatsApp")}
              </FieldLabel>
              <Input
                id="registration-phone"
                ref={phoneInput}
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+51 999 999 999"
                maxLength={32}
                required
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value)
                  setPhoneError("")
                }}
                disabled={busy}
                aria-invalid={!!phoneError}
                aria-describedby={
                  phoneError
                    ? "registration-phone-hint registration-phone-error"
                    : "registration-phone-hint"
                }
              />
              <FieldDescription id="registration-phone-hint">
                {m(
                  "Incluye el código de país. Te enviaremos una bienvenida automática a Amautai."
                )}
              </FieldDescription>
              {phoneError && (
                <FieldError id="registration-phone-error">
                  {m(phoneError)}
                </FieldError>
              )}
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="registration-consent"
                name="consent"
                required
                checked={consent}
                onCheckedChange={setConsent}
                disabled={busy}
              />
              <FieldLabel
                htmlFor="registration-consent"
                className="text-sm font-normal"
              >
                {m(
                  "Acepto recibir la bienvenida y los avisos que elija por WhatsApp. Puedo desactivarlos en Notificaciones."
                )}
              </FieldLabel>
            </Field>
          </div>
          {error && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {m(error)}
            </p>
          )}
          <div className="mt-7 flex justify-end">
            <Button
              type="submit"
              disabled={!role || !phone.trim() || !consent || busy}
            >
              {busy ? m("Guardando…") : m("Continuar")}
              {!busy && <ArrowRight aria-hidden="true" />}
            </Button>
          </div>
        </form>
      </section>
    </main>
  )
}
