import { EmailNotifications } from "./email-notifications"
import { useRef, useState } from "react"
import { BellIcon, RefreshCwIcon } from "lucide-react"
import { useNotifications } from "../model/use-notifications"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@workspace/ui/components/field"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@workspace/ui/components/empty"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  dispatching: "Procesando",
  accepted: "En cola de envío",
  sent: "Enviado",
  delivered: "Entregado",
  read: "Leído",
  failed: "Fallido",
  expired: "Vencido",
  cancelled: "Cancelado",
  uncertain: "Envío por confirmar",
}
const connectionLabels: Record<string, string> = {
  connected: "WhatsApp conectado",
  needs_pairing: "Falta vincular el número emisor",
  starting: "Iniciando conexión",
  connecting: "Conectando WhatsApp",
  disconnected: "WhatsApp desconectado",
  logged_out: "El emisor necesita vincularse nuevamente",
  unavailable: "Servicio de WhatsApp no disponible",
}
export function Notifications() {
  const n = useNotifications()
  const [phone, setPhone] = useState("+51"),
    [consent, setConsent] = useState(""),
    [code, setCode] = useState("")
  const [title, setTitle] = useState(""),
    [date, setDate] = useState("")
  const [validation, setValidation] = useState("")
  const scheduleKey = useRef<string | null>(null),
    testKey = useRef<string | null>(null)
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (n.loading && !n.data)
    return (
      <section
        aria-label="Cargando notificaciones"
        aria-busy="true"
        className="flex max-w-3xl flex-col gap-5 py-4"
      >
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </section>
    )
  const contact = n.data?.contact
  const ready = !!contact?.verified && contact.enabled
  const timezone = contact?.timezone || localZone
  const format = (value: number) =>
    new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(value)
  async function requestCode(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setValidation("")
    if (!/^\+[1-9]\d{7,14}$/.test(phone) || consent !== "yes") {
      setValidation(
        "Escribe el número con + y código de país, y acepta recibir los avisos."
      )
      return
    }
    await n.requestCode(phone)
  }
  async function schedule(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setValidation("")
    const at = new Date(date).getTime()
    if (
      title.trim().length < 3 ||
      !Number.isFinite(at) ||
      at < Date.now() ||
      at > Date.now() + 30 * 86400000
    ) {
      setValidation(
        "Escribe al menos 3 caracteres y elige una fecha futura dentro de los próximos 30 días."
      )
      return
    }
    scheduleKey.current ||= crypto.randomUUID()
    if (await n.schedule(title.trim(), at, scheduleKey.current)) {
      setTitle("")
      setDate("")
      scheduleKey.current = null
    }
  }
  return (
    <section className="flex max-w-3xl flex-col gap-6 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Notificaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Recibe tus recordatorios personales por WhatsApp y email.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Actualizar notificaciones"
          disabled={n.busy}
          onClick={() => void n.refresh()}
        >
          <RefreshCwIcon />
        </Button>
      </div>
      {n.data && (
        <p role="status" className="text-sm text-muted-foreground">
          {connectionLabels[n.data.connection] || "Servicio no disponible"}.
        </p>
      )}
      {(n.error || validation) && (
        <p role="alert" className="text-sm text-destructive">
          {validation || n.error}
        </p>
      )}
      {n.notice && (
        <p role="status" className="text-sm">
          {n.notice}
        </p>
      )}
      {!n.data ? (
        <Button variant="outline" onClick={() => void n.refresh()}>
          Reintentar
        </Button>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <h2 className="font-medium">Tu número de WhatsApp</h2>
            {contact?.phone && (
              <p className="text-sm">
                {contact.phone} ·{" "}
                {contact.verified ? "Verificado" : "Pendiente de verificación"}
              </p>
            )}
            {contact?.verified && (
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={contact.enabled ? "default" : "secondary"}>
                  {contact.enabled ? "Avisos activos" : "Avisos desactivados"}
                </Badge>
                <Button
                  variant="outline"
                  disabled={n.busy}
                  onClick={() => void n.preferences(!contact.enabled, timezone)}
                >
                  {contact.enabled ? "Desactivar avisos" : "Activar avisos"}
                </Button>
              </div>
            )}
            <form onSubmit={requestCode}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="whatsapp-phone">
                    {contact?.verified
                      ? "Cambiar número"
                      : "Número con código de país"}
                  </FieldLabel>
                  <Input
                    id="whatsapp-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+51987654321"
                    required
                    maxLength={16}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={n.busy}
                  />
                  <FieldDescription>
                    Al solicitar un código se pausarán los avisos y se
                    cancelarán los pendientes. Máximo 5 códigos al día.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="whatsapp-consent">
                    Consentimiento
                  </FieldLabel>
                  <NativeSelect
                    id="whatsapp-consent"
                    required
                    value={consent}
                    onChange={(e) => setConsent(e.target.value)}
                    disabled={n.busy}
                  >
                    <NativeSelectOption value="">
                      Selecciona una opción
                    </NativeSelectOption>
                    <NativeSelectOption value="yes">
                      Acepto recibir el código y recordatorios en este número
                    </NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Button
                  type="submit"
                  disabled={n.busy || n.data.connection !== "connected"}
                >
                  Solicitar código
                </Button>
              </FieldGroup>
            </form>
            {!!contact?.verificationExpiresAt &&
              (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setValidation("")
                    if (await n.verify(code)) setCode("")
                  }}
                >
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="whatsapp-code">
                        Código recibido por WhatsApp
                      </FieldLabel>
                      <Input
                        id="whatsapp-code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        disabled={n.busy}
                      />
                      <FieldDescription>
                        Vence a las {format(contact.verificationExpiresAt)}.
                        Máximo 5 intentos.
                      </FieldDescription>
                    </Field>
                    <Button type="submit" disabled={n.busy}>
                      Verificar número
                    </Button>
                  </FieldGroup>
                </form>
              )}
          </div>
          <Separator />
          <div className="flex flex-col gap-4">
            <h2 className="font-medium">Programar un recordatorio</h2>
            <p className="text-sm text-muted-foreground">
              Se enviará a tu propio número. La integración automática con
              tareas educativas estará disponible cuando exista ese módulo.
            </p>
            <form onSubmit={schedule}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="reminder-title">
                    Qué quieres recordar
                  </FieldLabel>
                  <Input
                    id="reminder-title"
                    required
                    minLength={3}
                    maxLength={240}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      scheduleKey.current = null
                    }}
                    disabled={n.busy || !ready}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="reminder-date">
                    Fecha y hora ({localZone})
                  </FieldLabel>
                  <Input
                    id="reminder-date"
                    type="datetime-local"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value)
                      scheduleKey.current = null
                    }}
                    disabled={n.busy || !ready}
                  />
                  <FieldDescription>
                    Hasta 30 días de anticipación. El procesamiento puede tardar
                    un minuto. Los avisos vencen una hora después de la fecha
                    elegida.
                  </FieldDescription>
                </Field>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={n.busy || !ready}>
                    Programar recordatorio
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={n.busy || !ready}
                    onClick={async () => {
                      testKey.current ||= crypto.randomUUID()
                      if (await n.test(testKey.current)) testKey.current = null
                    }}
                  >
                    Enviar prueba
                  </Button>
                </div>
                {!ready && (
                  <p className="text-sm text-muted-foreground">
                    Verifica tu número y activa los avisos para continuar.
                  </p>
                )}
              </FieldGroup>
            </form>
          </div>
          <Separator />
          <div className="flex flex-col gap-3">
            <h2 className="font-medium">Historial</h2>
            <p className="text-sm text-muted-foreground">
              Últimos 50 avisos · {timezone}. Se actualiza cada 15 segundos.
              «Enviado» no confirma entrega.
            </p>
            {!n.data.notifications.length ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BellIcon />
                  </EmptyMedia>
                  <EmptyTitle>Aún no tienes avisos</EmptyTitle>
                  <EmptyDescription>
                    Los códigos y recordatorios aparecerán aquí con su estado
                    real.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="flex flex-col divide-y">
                {n.data.notifications.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-sm font-medium break-words">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(item.scheduledAt)}
                      </p>
                      {item.error === "gateway_unavailable" &&
                        item.status === "pending" && (
                          <p className="text-xs text-muted-foreground">
                            Esperando al servicio de WhatsApp; se reintentará
                            antes del vencimiento.
                          </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {statusLabels[item.status] || item.status}
                      </Badge>
                      {item.status === "pending" &&
                        item.kind !== "verification" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={n.busy}
                            onClick={() => void n.cancel(item.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
      <EmailNotifications />
    </section>
  )
}
