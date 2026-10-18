import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import type { CargoRegion, CargoParticipant } from "@amautai/contracts"
import { useMessages } from "@/shared/i18n/use-messages"
import { useRooms } from "../model/use-rooms"
import { CargoPlayer } from "./cargo-player"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@workspace/ui/components/alert-dialog"
const regions = { coast: "Costa", highlands: "Sierra", jungle: "Selva" }
export function Rooms() {
  const { roomId, participantId } = useParams()
  return participantId && roomId ? (
    <CargoPlayer
      key={roomId + participantId}
      roomId={roomId}
      participantId={participantId}
    />
  ) : (
    <RoomManager key={roomId ?? "list"} roomId={roomId} />
  )
}
function RoomManager({ roomId }: { roomId?: string }) {
  const { m, formatDate, locale } = useMessages()
  const nav = useNavigate()
  const data = useRooms(roomId)
  const [region, setRegion] = useState<CargoRegion>("coast")
  const [name, setName] = useState("")
  const [removing, setRemoving] = useState<CargoParticipant | null>(null)
  const number = new Intl.NumberFormat(locale)
  const items = (Object.keys(regions) as CargoRegion[]).map((value) => ({
    value,
    label: m(regions[value]),
  }))
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            {m(roomId ? "Sala de juego" : "Salas de juego")}
          </h1>
          <p className="text-muted-foreground">
            {m("Alimenta a tu comunidad · Multiplicación")}
          </p>
        </div>
        {roomId && (
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link to="/panel/salas" />}
          >
            {m("Ver salas")}
          </Button>
        )}
      </header>
      <dl className="grid gap-3 rounded-xl border p-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">
            {m("Área curricular")}
          </dt>
          <dd>{m("Matemática")}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">
            {m("Nivel y grado")}
          </dt>
          <dd>{m("Primaria · 2.º grado")}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">{m("Competencia")}</dt>
          <dd>{m("Resuelve problemas de cantidad")}</dd>
        </div>
      </dl>
      {!roomId && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void data.create(region, (room) =>
              nav("/panel/salas/" + room.id)
            )
          }}
        >
          <Field className="w-full sm:max-w-xs">
            <FieldLabel htmlFor="room-region">
              {m("Contexto / situación significativa")}
            </FieldLabel>
            <Select
              items={items}
              value={region}
              onValueChange={(value) => {
                if (value) setRegion(value)
              }}
              disabled={data.busy}
            >
              <SelectTrigger id="room-region" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Button type="submit" disabled={data.busy || data.loading}>
            {m(data.busy ? "Creando sala…" : "Crear sala")}
          </Button>
        </form>
      )}
      {data.loadError && (
        <div role="alert" className="space-y-3">
          <p>{m(data.loadError)}</p>
          <Button onClick={data.refresh}>{m("Reintentar")}</Button>
        </div>
      )}
      {data.loading && <p role="status">{m("Cargando sala…")}</p>}
      {data.error && (
        <p role="alert" className="text-destructive">
          {m(data.error)}
        </p>
      )}
      {roomId && data.room && (
        <>
          <p className="font-medium">
            {m(regions[data.room.region])} ·{" "}
            {m("Partida continua. Tres errores terminan el intento.")}
          </p>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              void data.add(name).then((ok) => {
                if (ok) setName("")
              })
            }}
          >
            <Field className="w-full sm:max-w-sm">
              <FieldLabel htmlFor="participant-name">
                {m("Nombre del estudiante")}
              </FieldLabel>
              <Input
                id="participant-name"
                autoComplete="off"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={m("Por ejemplo: Juan Pérez")}
                disabled={data.busy}
              />
            </Field>
            <Button
              type="submit"
              disabled={data.busy || data.loading || !name.trim()}
            >
              {m("Añadir estudiante")}
            </Button>
          </form>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableCaption>
                {m("Clasificación por puntos. Los empates comparten posición.")}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  {[
                    "Posición",
                    "Estudiante",
                    "Puntos",
                    "Estado",
                    "Acciones",
                  ].map((label) => (
                    <TableHead key={label}>{m(label)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data.participants.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center">
                      {m("Añade estudiantes para iniciar las pruebas.")}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.participants.map((p) => {
                    const rank =
                      data.participants.findIndex(
                        (other) => other.score === p.score
                      ) + 1
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{number.format(rank)}</TableCell>
                        <TableCell className="max-w-72 font-medium break-words whitespace-normal">
                          {p.name}
                        </TableCell>
                        <TableCell>{number.format(p.score)}</TableCell>
                        <TableCell>
                          {m(
                            p.mistakes >= 3
                              ? "Perdió"
                              : p.started
                                ? "En curso"
                                : "Pendiente"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              nativeButton={false}
                              variant="outline"
                              disabled={data.busy || data.loading}
                              render={
                                <Link
                                  to={
                                    "/panel/salas/" +
                                    roomId +
                                    "/jugar/" +
                                    p.id
                                  }
                                />
                              }
                            >
                              {m(
                                p.mistakes >= 3
                                  ? "Ver puntaje"
                                  : p.started
                                    ? "Continuar prueba"
                                    : "Iniciar prueba"
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              disabled={data.busy || data.loading}
                              onClick={() => setRemoving(p)}
                              aria-label={m(
                                "Eliminar participación de {{name}}",
                                { name: p.name }
                              )}
                            >
                              {m("Eliminar participación")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <AlertDialog
            open={!!removing}
            onOpenChange={(open) => {
              if (!open && !data.busy) setRemoving(null)
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {m("Eliminar participación")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {m(
                    "Se eliminarán la participación y los puntos de {{name}} en esta sala.",
                    { name: removing?.name ?? "" }
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {data.error && (
                <p role="alert" className="text-destructive">
                  {m(data.error)}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={data.busy}>
                  {m("Cancelar")}
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  disabled={data.busy}
                  onClick={() => {
                    if (removing)
                      void data.remove(removing.id).then((ok) => {
                        if (ok) setRemoving(null)
                      })
                  }}
                >
                  {m("Eliminar participación")}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      {!roomId && !data.loadError && (
        <div className="divide-y rounded-xl border">
          {!data.rooms.length && !data.loading ? (
            <p className="p-6 text-muted-foreground">
              {m("Todavía no creaste salas.")}
            </p>
          ) : (
            data.rooms.map((room) => (
              <div
                key={room.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-medium">
                    {m("Sala de juego")} · {m(regions[room.region])}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(room.createdAt)}
                  </p>
                </div>
                <Button
                  nativeButton={false}
                  variant="outline"
                  render={<Link to={"/panel/salas/" + room.id} />}
                >
                  {m("Abrir sala")}
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}
