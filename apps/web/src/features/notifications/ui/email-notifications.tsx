import { useRef, useState } from "react"
import { useEmailNotifications } from "../model/use-email-notifications"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@workspace/ui/components/field"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@workspace/ui/components/empty"
const labels:Record<string,string>={pending:"Pendiente",dispatching:"Procesando",accepted:"Aceptado por el servidor",failed:"Fallido",uncertain:"Resultado incierto",cancelled:"Cancelado",expired:"Vencido"}
export function EmailNotifications() {
 const n=useEmailNotifications()
 const [code,setCode]=useState(""),[title,setTitle]=useState(""),[date,setDate]=useState("")
 const [validation,setValidation]=useState("")
 const scheduleKey=useRef<string|null>(null),testKey=useRef<string|null>(null)
 const ready=!!(n.data?.configured && n.data.contact.verified && n.data.contact.enabled)
 return <section aria-labelledby="email-heading" className="flex flex-col gap-4">
  <Separator/>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h2 id="email-heading" className="font-medium">Correo electrónico</h2>
   <Button variant="outline" disabled={n.busy} onClick={()=>void n.refresh()}>Actualizar email</Button>
  </div>
  {n.loading && !n.data && <Skeleton className="h-20 w-full" aria-label="Cargando email"/>}
  {(n.error || validation) && <p role="alert" className="text-sm text-destructive">{validation || n.error}</p>}
  {n.notice && <p role="status" className="text-sm">{n.notice}</p>}
  {n.data && <>
   <p className="text-sm break-all">{n.data.contact.email}</p>
   {!n.data.configured && <p role="status" className="text-sm text-muted-foreground">El envío de email aún no está habilitado. Podrás activar tus avisos cuando esté disponible.</p>}
   <Badge variant={ready?"default":"secondary"}>{ready?"Avisos por email activos":n.data.contact.verified?"Avisos por email desactivados":"Correo pendiente de verificación"}</Badge>
   {n.data.contact.verified ? <Button variant="outline" disabled={n.busy || !n.data.configured && !n.data.contact.enabled} onClick={()=>void n.preferences(!n.data!.contact.enabled)}>{n.data.contact.enabled?"Desactivar email":"Activar email"}</Button> : <>
    <p className="text-sm text-muted-foreground">Al solicitar el código aceptas recibir la verificación y tus recordatorios personales en el correo de tu cuenta. El código vence en 10 minutos.</p>
    <Button disabled={n.busy || !n.data.configured} onClick={()=>void n.requestCode()}>Aceptar y solicitar código por email</Button>
    <form onSubmit={async e=>{e.preventDefault();if(await n.verify(code))setCode("")}}>
     <FieldGroup>
      <Field><FieldLabel htmlFor="email-notification-code">Código recibido por email</FieldLabel><Input id="email-notification-code" required pattern="[0-9]{6}" maxLength={6} inputMode="numeric" autoComplete="one-time-code" value={code} disabled={n.busy || !n.data.configured} onChange={e=>setCode(e.target.value)}/></Field>
      <Button type="submit" disabled={n.busy || !n.data.configured}>Verificar correo</Button>
     </FieldGroup>
    </form>
   </>}
   <form onSubmit={async e=>{
    e.preventDefault();setValidation("")
    const at=new Date(date).getTime()
    if(title.trim().length<3 || !Number.isFinite(at) || at<Date.now() || at>Date.now()+30*86400000){setValidation("Escribe al menos 3 caracteres y elige una fecha futura dentro de los próximos 30 días.");return}
    scheduleKey.current ||= crypto.randomUUID()
    if(await n.schedule(title.trim(),at,scheduleKey.current)){setTitle("");setDate("");scheduleKey.current=null}
   }}>
    <FieldGroup>
     <Field><FieldLabel htmlFor="email-reminder-title">Recordatorio por email</FieldLabel><Input id="email-reminder-title" required minLength={3} maxLength={240} value={title} disabled={n.busy || !ready} onChange={e=>{setTitle(e.target.value);scheduleKey.current=null}}/></Field>
     <Field><FieldLabel htmlFor="email-reminder-date">Fecha y hora ({Intl.DateTimeFormat().resolvedOptions().timeZone})</FieldLabel><Input id="email-reminder-date" type="datetime-local" required value={date} disabled={n.busy || !ready} onChange={e=>{setDate(e.target.value);scheduleKey.current=null}}/><FieldDescription>Hasta 30 días de anticipación. El aviso vence una hora después de la fecha elegida.</FieldDescription></Field>
     <div className="flex flex-wrap gap-3"><Button type="submit" disabled={n.busy || !ready}>Programar email</Button><Button type="button" variant="outline" disabled={n.busy || !ready} onClick={async()=>{testKey.current ||= crypto.randomUUID();if(await n.test(testKey.current))testKey.current=null}}>Enviar email de prueba</Button></div>
    </FieldGroup>
   </form>
   <h3 className="text-sm font-medium">Historial de email</h3>
   <p className="text-sm text-muted-foreground">Últimos 50 avisos. Se actualiza cada 15 segundos. La aceptación del servidor no confirma entrega en la bandeja del destinatario.</p>
   {n.data.notifications.length?<ul className="flex flex-col gap-3">{n.data.notifications.map(item=><li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
    <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{new Date(item.scheduledAt).toLocaleString("es-PE")}</p></div>
    <Badge variant="secondary">{labels[item.status] || "Estado desconocido"}</Badge>
    {item.status==="pending" && <Button variant="outline" size="sm" disabled={n.busy} onClick={()=>void n.cancel(item.id)}>Cancelar email</Button>}
   </li>)}</ul>:<Empty><EmptyHeader><EmptyTitle>Aún no tienes emails</EmptyTitle><EmptyDescription>Tus verificaciones y recordatorios aparecerán aquí.</EmptyDescription></EmptyHeader></Empty>}
  </>}
 </section>
}
