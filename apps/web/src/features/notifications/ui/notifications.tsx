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
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
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
        <h1 className="text-2xl font-semibold">
          Notificaciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Elige cómo recibir cada aviso automático.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {!settings.data || !n.data || !email.data ? (
        <>
          <Skeleton
            className="h-48 w-full"
            aria-label="Cargando preferencias"
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
              Reintentar
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
                    {types[preference.type].title}
                  </FieldLabel>
                  <FieldDescription>
                    {types[preference.type].description}
                  </FieldDescription>
                </div>
                <NativeSelect
                  id={"channel-" + preference.type}
                  className="w-full sm:w-64"
                  value={preference.channel}
                  disabled={busy}
                  onChange={(e) =>
                    void settings.save({
                      ...preference,
                      channel: e.target.value as ActivityPreference["channel"],
                    })
                  }
                >
                  <NativeSelectOption value="email" disabled={!emailReady}>
                    Recibir por email
                  </NativeSelectOption>
                  <NativeSelectOption
                    value="whatsapp"
                    disabled={!whatsappReady}
                  >
                    Recibir por WhatsApp
                  </NativeSelectOption>
                  <NativeSelectOption
                    value="both"
                    disabled={!emailReady || !whatsappReady}
                  >
                    Recibir por ambos
                  </NativeSelectOption>
                  <NativeSelectOption value="none">
                    No recibir notificaciones
                  </NativeSelectOption>
                </NativeSelect>
              </Field>
            ))}
          </FieldGroup>
          <p className="text-sm text-muted-foreground">
            Tus preferencias quedan guardadas. Los avisos comenzarán cuando
            estén disponibles los módulos de tareas y mensajería.
          </p>
          <Separator />
          <div className="flex flex-col gap-2">
            <h2 className="font-medium">Datos de contacto</h2>
            <p className="text-sm">Email: {email.data.contact.email}</p>
            {!emailReady && (
              <p className="text-sm text-muted-foreground">
                El email necesita estar verificado en el acceso y el servicio de
                correo disponible.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Los correos de verificación y recuperación de contraseña se envían
              siempre, independientemente de estas preferencias.
            </p>
          </div>
          <form
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
                  Número de WhatsApp
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
                  Al guardar aceptas recibir los avisos que elijas en este
                  número. Incluye el código de país.
                </FieldDescription>
                {phoneError && <FieldError>{phoneError}</FieldError>}
              </Field>
              <Button type="submit" disabled={busy}>
                Guardar número
              </Button>
            </FieldGroup>
          </form>
          {n.data.connection !== "connected" && (
            <p className="text-sm text-muted-foreground">
              WhatsApp está temporalmente en pausa. Tus preferencias se
              conservan.
            </p>
          )}
        </>
      )}
    </section>
  )
}
