import { useMessages } from "@/shared/i18n/use-messages"
import { useState } from "react"
import {
  notificationPhoneInput,
  type ActivityPreference,
} from "@amautai/contracts"
import { useNotifications } from "../model/use-notifications"
import { useEmailNotifications } from "../model/use-email-notifications"
import { useActivitySettings } from "../model/use-activity-settings"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
const types = {
  task_assigned: {
    title: "Tareas asignadas",
    description: "Cuando te asignen una nueva tarea.",
  },
  task_due: {
    title: "Vencimientos",
    description: "Cuando se acerque la fecha límite de una tarea pendiente.",
  },
  new_message: {
    title: "Mensajes nuevos",
    description: "Cuando recibas un mensaje nuevo.",
  },
}
export function Notifications() {
  const { m, errorMessage } = useMessages()

  const n = useNotifications(),
    email = useEmailNotifications(),
    settings = useActivitySettings()
  const [phoneError, setPhoneError] = useState("")
  const busy = n.busy || email.busy || settings.busy
  const emailReady = !!email.data?.configured && !!email.data.contact.verified
  const whatsappReady = !!n.data?.contact?.registered
  const error = phoneError || settings.error || n.error || email.error
  const notice = settings.notice || n.notice
  return (
    <section className="flex max-w-4xl flex-col gap-6 py-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{m("Notificaciones")}</h1>
        <p className="text-sm text-muted-foreground">
          {m("Elige cómo recibir cada aviso automático.")}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(error)}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {m(notice)}
        </p>
      )}
      {!settings.data || !n.data || !email.data ? (
        <>
          <Skeleton
            className="h-48 w-full"
            aria-label={m("Cargando preferencias")}
          />
          {error && (
            <Button
              variant="outline"
              onClick={() => {
                void settings.refresh()
                void n.refresh()
                void email.refresh()
              }}
            >
              {m("Reintentar")}
            </Button>
          )}
        </>
      ) : (
        <>
          <FieldGroup>
            {settings.data.preferences.map((preference) => (
              <Field
                key={preference.type}
                orientation="responsive"
                className="border-b pb-5"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel htmlFor={"channel-" + preference.type}>
                    {m(types[preference.type].title)}
                  </FieldLabel>
                  <FieldDescription>
                    {m(types[preference.type].description)}
                  </FieldDescription>
                </div>
                <div className="w-full sm:w-64">
                  <Select
                    items={[
                      { value: "email", label: m("Recibir por email") },
                      { value: "whatsapp", label: m("Recibir por WhatsApp") },
                      { value: "both", label: m("Recibir por ambos") },
                      { value: "none", label: m("No recibir notificaciones") },
                    ]}
                    value={preference.channel}
                    disabled={busy}
                    onValueChange={(channel) => {
                      if (channel !== null)
                        void settings.save({
                          ...preference,
                          channel: channel as ActivityPreference["channel"],
                        })
                    }}
                  >
                    <SelectTrigger
                      id={"channel-" + preference.type}
                      className="w-full min-w-0 sm:w-52"
                    >
                      <SelectValue className="min-w-0 truncate" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectGroup>
                        <SelectItem value="email" disabled={!emailReady}>
                          <span className="whitespace-normal">
                            {m("Recibir por email")}
                          </span>
                        </SelectItem>
                        <SelectItem value="whatsapp" disabled={!whatsappReady}>
                          <span className="whitespace-normal">
                            {m("Recibir por WhatsApp")}
                          </span>
                        </SelectItem>
                        <SelectItem
                          value="both"
                          disabled={!emailReady || !whatsappReady}
                        >
                          <span className="whitespace-normal">
                            {m("Recibir por ambos")}
                          </span>
                        </SelectItem>
                        <SelectItem value="none">
                          <span className="whitespace-normal">
                            {m("No recibir notificaciones")}
                          </span>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </Field>
            ))}
          </FieldGroup>
          <p className="text-sm text-muted-foreground">
            {m(
              "Tus preferencias quedan guardadas. Los avisos comenzarán cuando estén disponibles los módulos de tareas y mensajería."
            )}
          </p>
          <Separator />
          <div className="flex flex-col gap-2">
            <h2 className="font-medium">{m("Datos de contacto")}</h2>
            <p className="text-sm">
              {m("Email:")}
              {email.data.contact.email}
            </p>
            {!emailReady && (
              <p className="text-sm text-muted-foreground">
                {m(
                  "El email necesita estar verificado en el acceso y el servicio de correo disponible."
                )}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {m(
                "Los correos de verificación y recuperación de contraseña se envían siempre, independientemente de estas preferencias."
              )}
            </p>
          </div>
          <form
            noValidate
            onSubmit={async (e) => {
              e.preventDefault()
              setPhoneError("")
              const form = new FormData(e.currentTarget)
              const input = notificationPhoneInput.safeParse({
                phone: form.get("phone"),
                consent: true,
              })
              if (!input.success) {
                setPhoneError("Escribe un número válido con código de país.")
                return
              }
              await n.register(input.data.phone)
            }}
          >
            <FieldGroup>
              <Field data-invalid={!!phoneError}>
                <FieldLabel htmlFor="whatsapp-phone">
                  {m("Número de WhatsApp")}
                </FieldLabel>
                <Input
                  id="whatsapp-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+51987654321"
                  maxLength={32}
                  required
                  defaultValue={n.data.contact?.phone || ""}
                  disabled={busy}
                  aria-invalid={!!phoneError}
                />
                <FieldDescription>
                  {m(
                    "Al guardar aceptas recibir los avisos que elijas en este número. Incluye el código de país."
                  )}
                </FieldDescription>
                {phoneError && (
                  <FieldError>{errorMessage(phoneError)}</FieldError>
                )}
              </Field>
              <Button type="submit" disabled={busy}>
                {m("Guardar número")}
              </Button>
            </FieldGroup>
          </form>
          {n.data.connection !== "connected" && (
            <p className="text-sm text-muted-foreground">
              {m(
                "WhatsApp está temporalmente en pausa. Tus preferencias se conservan."
              )}
            </p>
          )}
        </>
      )}
    </section>
  )
}
