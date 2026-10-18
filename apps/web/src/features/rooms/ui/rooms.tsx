import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import type {
  CargoRegion,
  CargoParticipant,
  CargoRoom,
} from "@amautai/contracts"
import { useMessages } from "@/shared/i18n/use-messages"
import { useRooms } from "../model/use-rooms"
import { NurseryPlayer } from "./nursery-player"
import { MarketPlayer } from "./market-player"
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
const gameNames = {
  cargo: "Alimenta a tu comunidad · Multiplicación",
  market: "La ruta del mercado · Sumas y restas",
  nursery: "El vivero de las decenas · Unidades y decenas",
}
const regions = { coast: "Costa", highlands: "Sierra", jungle: "Selva" }
export function Rooms() {
  const { roomId, participantId } = useParams()
  return participantId && roomId ? (
    <RoomPlayer
      key={roomId + participantId}
      roomId={roomId}
      participantId={participantId}
    />
  ) : (
    <RoomManager key={roomId ?? "list"} roomId={roomId} />
  )
}
function RoomPlayer({
  roomId,
  participantId,
}: {
  roomId: string
  participantId: string
}) {
  const data = useRooms(roomId),
    { m } = useMessages()
  if (data.loadError)
    return (
      <div role="alert">
        <p>{m(data.loadError)}</p>
        <Button onClick={data.refresh}>{m("Reintentar")}</Button>
      </div>
    )
  if (!data.room) return <p role="status">{m("Cargando el juego…")}</p>
  if (data.room.kind === "nursery") {
    const nextStudent = data.participants.find(
      (p) => p.id !== participantId && !p.started
    )
    return (
      <NurseryPlayer
        roomId={roomId}
        participantId={participantId}
        nextStudent={nextStudent}
      />
    )
  }
  return data.room.kind === "market" ? (
    <MarketPlayer roomId={roomId} participantId={participantId} />
  ) : (
    <CargoPlayer roomId={roomId} participantId={participantId} />
  )
}
function RoomManager({ roomId }: { roomId?: string }) {
  const { m, formatDate, locale } = useMessages()
  const nav = useNavigate()
  const data = useRooms(roomId)
  const [region, setRegion] = useState<CargoRegion>("coast")
  const [kind, setKind] = useState<CargoRoom["kind"]>("market")
  const [mode, setMode] = useState<CargoRoom["mode"]>("practice")
  const [name, setName] = useState("")
  const [roomName, setRoomName] = useState("")
  const [deletingRoom, setDeletingRoom] = useState<CargoRoom | null>(null)
  const [removing, setRemoving] = useState<CargoParticipant | null>(null)
  const number = new Intl.NumberFormat(locale)
  const items = (Object.keys(regions) as CargoRegion[]).map((value) => ({
    value,
    label: m(regions[value]),
  }))
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-2xl font-semibold break-words">
            {roomId
              ? data.room?.name || m("Sala de juego")
              : m("Salas de juego")}
          </h1>
          <p className="text-muted-foreground">
            {m(gameNames[data.room?.kind ?? kind])}
          </p>
        </div>
        {roomId && (
          <div className="flex flex-wrap gap-2">
            {data.room && (
              <Button
                variant="ghost"
                disabled={data.busy || data.loading}
                onClick={() => setDeletingRoom(data.room)}
              >
                {m("Eliminar sala")}
              </Button>
            )}
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link to="/dashboard/rooms" />}
            >
              {m("Ver salas")}
            </Button>
          </div>
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
          className="grid items-end gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault()
            void data.create(
              region,
              (room) => nav("/dashboard/rooms/" + room.id),
              kind,
              kind !== "cargo" ? mode : "challenge",
              roomName.trim()
            )
          }}
        >
          <Field className="min-w-0 self-start sm:col-span-2 lg:col-span-1">
            <FieldLabel htmlFor="room-name">
              {m("Nombre de la sala")}
            </FieldLabel>
            <Input
              id="room-name"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder={m("Por ejemplo: 2.º A · Matemática")}
              autoComplete="off"
              required
              maxLength={80}
              disabled={data.busy}
            />
          </Field>
          <Field className="min-w-0 sm:col-span-2 lg:col-span-2">
            <FieldLabel htmlFor="room-game">{m("Juego")}</FieldLabel>
            <Select
              items={Object.entries(gameNames).map(([value, label]) => ({
                value,
                label: m(label),
              }))}
              value={kind}
              onValueChange={(value) => {
                if (value) setKind(value as CargoRoom["kind"])
              }}
              disabled={data.busy}
            >
              <SelectTrigger
                id="room-game"
                className="w-full min-w-0"
                aria-describedby="room-game-objective"
              >
                <SelectValue className="truncate">
                  {m(gameNames[kind]).split(" · ")[0]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                className="p-1"
              >
                {Object.entries(gameNames).map(([value, label]) => {
                  const [title, objective] = m(label).split(" · ")
                  return (
                    <SelectItem key={value} value={value} className="py-3">
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="font-medium">{title}</span>
                        <span className="text-xs text-muted-foreground">
                          {objective}
                        </span>
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <p
              id="room-game-objective"
              className="text-sm text-muted-foreground"
            >
              {m(gameNames[kind]).split(" · ")[1]}
            </p>
          </Field>
          {kind !== "cargo" && (
            <Field className="min-w-0">
              <FieldLabel htmlFor="room-mode">{m("Modalidad")}</FieldLabel>
              <Select
                items={[
                  { value: "practice", label: m("Práctica adaptativa") },
                  { value: "challenge", label: m("Desafío de la sala") },
                ]}
                value={mode}
                onValueChange={(v) => {
                  if (v) setMode(v)
                }}
                disabled={data.busy}
              >
                <SelectTrigger id="room-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="practice">
                    {m("Práctica adaptativa")}
                  </SelectItem>
                  <SelectItem value="challenge">
                    {m("Desafío de la sala")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field className="min-w-0">
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
          <Button
            type="submit"
            className="justify-self-start"
            disabled={data.busy || data.loading || !roomName.trim()}
          >
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
                {m(
                  data.room.mode === "practice" && data.room.kind !== "cargo"
                    ? "Puntos de práctica personal; las dificultades pueden ser distintas."
                    : "Clasificación por puntos. Los empates comparten posición."
                )}
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
                        <TableCell>
                          {data.room?.kind !== "cargo" &&
                          data.room?.mode === "practice"
                            ? "—"
                            : number.format(rank)}
                        </TableCell>
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
                                    "/dashboard/rooms/" +
                                    roomId +
                                    "/play/" +
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
                <div className="min-w-0 flex-1 basis-64 break-words">
                  <p className="font-medium">
                    {room.name || m("Sala de juego")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {m(gameNames[room.kind])} · {m(regions[room.region])}
                    {room.kind !== "cargo" && (
                      <>
                        {" "}
                        ·{" "}
                        {m(
                          room.mode === "practice"
                            ? "Práctica adaptativa"
                            : "Desafío de la sala"
                        )}
                      </>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(room.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    nativeButton={false}
                    disabled={data.busy || data.loading}
                    variant="outline"
                    render={<Link to={"/dashboard/rooms/" + room.id} />}
                  >
                    {m("Abrir sala")}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={data.busy || data.loading}
                    onClick={() => setDeletingRoom(room)}
                    aria-label={m("Eliminar sala {{name}}", {
                      name: room.name || m("Sala de juego"),
                    })}
                  >
                    {m("Eliminar sala")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <AlertDialog
        open={!!deletingRoom}
        onOpenChange={(open) => {
          if (!open && !data.busy) setDeletingRoom(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m("Eliminar sala")}</AlertDialogTitle>
            <AlertDialogDescription>
              {m(
                "Se eliminarán la sala {{name}}, sus estudiantes y todos sus puntos. Esta acción no se puede deshacer.",
                { name: deletingRoom?.name || m("Sala de juego") }
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
                if (deletingRoom)
                  void data.deleteRoom(deletingRoom.id).then((ok) => {
                    if (ok) {
                      setDeletingRoom(null)
                      if (roomId) nav("/dashboard/rooms")
                    }
                  })
              }}
            >
              {m(data.busy ? "Eliminando sala…" : "Eliminar sala")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
