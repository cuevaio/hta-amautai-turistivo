import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router"
import { PlusIcon, PencilIcon, Trash2Icon, ArrowRightIcon } from "lucide-react"
import type {
  CargoRegion,
  FamilyChild,
  FamilyGameKind,
} from "@amautai/contracts"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useMessages } from "@/shared/i18n/use-messages"
import {
  familyCatalog,
  familyRegions,
  familyPlayPath,
  familyHomePath,
} from "../model/family-catalog"
import { useFamilyGames } from "../model/use-family-games"

export function FamilyGames() {
  const { m, locale, formatDate } = useMessages()
  const data = useFamilyGames(),
    navigate = useNavigate()
  const location = useLocation()
  const selected = new URLSearchParams(location.search).get("hijo") ?? ""
  const setSelected = (id: string) =>
    navigate(familyHomePath(id), { replace: true })
  const [kind, setKind] = useState<FamilyGameKind>("market")
  const [editor, setEditor] = useState<{ child?: FamilyChild } | null>(null)
  const [name, setName] = useState("")
  const [region, setRegion] = useState<CargoRegion>("coast")
  const [removing, setRemoving] = useState<FamilyChild | null>(null)
  const child = data.children.find((c) => c.id === selected) ?? data.children[0]
  const games = data.games.filter((g) => g.childId === child?.id)
  const catalog = familyCatalog.find((c) => c.kind === kind)!
  const number = new Intl.NumberFormat(locale)
  const openEditor = (c?: FamilyChild) => {
    data.clearError()
    setName(c?.name ?? "")
    setRegion(c?.region ?? "coast")
    setEditor({ child: c })
  }
  return (
    <section className="mx-auto w-full max-w-6xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            {m("Aprendemos en familia")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {m("Juegos de Matemática para 2.º de Primaria.")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => openEditor()}
          disabled={data.busy || data.loading}
        >
          <PlusIcon aria-hidden="true" />
          {m("Añadir hijo")}
        </Button>
      </header>
      {data.error && (
        <div
          role="alert"
          className="space-y-2 rounded-xl border border-destructive/40 p-4"
        >
          <p>{m(data.error)}</p>
          <Button variant="outline" onClick={data.refresh} disabled={data.busy}>
            {m("Actualizar")}
          </Button>
        </div>
      )}
      {data.loading && !data.children.length ? (
        <div
          role="status"
          aria-label={m("Cargando tu familia…")}
          className="space-y-4"
        >
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <span className="sr-only">{m("Cargando tu familia…")}</span>
        </div>
      ) : data.error && !data.children.length ? null : !child ? (
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">
            {m("Crea el primer perfil de tu hijo")}
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {m(
              "Solo necesitamos un nombre o apodo y el contexto del juego. No hace falta un apellido."
            )}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {m("Juegos de Matemática para 2.º de Primaria.")}
          </p>
          <Button
            className="mt-5"
            onClick={() => openEditor()}
            disabled={data.busy || !!data.loadError}
          >
            <PlusIcon aria-hidden="true" />
            {m("Añadir hijo")}
          </Button>
        </div>
      ) : (
        <>
          <section
            aria-labelledby="family-child-title"
            className="border-y py-4"
          >
            <div className="flex flex-wrap items-end gap-4">
              <Field className="w-full min-w-0 sm:max-w-sm sm:flex-1">
                <FieldLabel id="family-child-title" htmlFor="family-child">
                  {m("¿Quién va a jugar?")}
                </FieldLabel>
                <Select
                  value={child.id}
                  items={data.children.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  onValueChange={(v) => {
                    if (v) setSelected(v)
                  }}
                  disabled={data.busy || data.loading}
                >
                  <SelectTrigger id="family-child" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data.children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <p className="pb-2 text-sm text-muted-foreground">
                {m("2.º de Primaria")} · {m(familyRegions[child.region])}
              </p>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                <Button
                  variant="ghost"
                  disabled={data.busy || data.loading}
                  onClick={() => openEditor(child)}
                >
                  <PencilIcon aria-hidden="true" />
                  {m("Editar perfil")}
                </Button>
                <Button
                  variant="ghost"
                  disabled={data.busy || data.loading}
                  onClick={() => setRemoving(child)}
                  aria-label={m("Eliminar perfil de {{name}}", {
                    name: child.name,
                  })}
                >
                  <Trash2Icon aria-hidden="true" />
                  {m("Eliminar")}
                </Button>
              </div>
            </div>
          </section>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (child)
                void data.create(child.id, kind, (g) =>
                  navigate(familyPlayPath(g.id, g.participantId))
                )
            }}
            className="space-y-4"
          >
            <fieldset
              disabled={data.busy || data.loading || !!data.loadError}
              className="space-y-3"
            >
              <legend className="text-lg font-semibold">
                {m("¿Qué practicará hoy?")}
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {familyCatalog.map((c) => (
                  <label
                    key={c.kind}
                    className="relative flex cursor-pointer flex-col gap-2 rounded-xl border bg-card p-4 transition-colors has-checked:border-foreground has-checked:bg-muted/50 has-focus-visible:ring-2 has-focus-visible:ring-ring has-disabled:cursor-default has-disabled:opacity-60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{m(c.topic)}</span>
                      <input
                        className="size-4 shrink-0 accent-primary"
                        type="radio"
                        name="family-game"
                        value={c.kind}
                        checked={kind === c.kind}
                        onChange={() => setKind(c.kind)}
                        aria-label={m(c.topic)}
                      />
                    </div>
                    <span className="text-sm font-medium">{m(c.name)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
              <div className="max-w-prose min-w-0 space-y-1">
                <p className="font-medium break-words">
                  {m("Para {{name}}", { name: child.name })} ·{" "}
                  {m(catalog.topic)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {m(
                    "Práctica personal. El puntaje se guarda automáticamente."
                  )}
                </p>
              </div>
              <Button
                type="submit"
                disabled={data.busy || data.loading || !!data.loadError}
              >
                {data.busy ? m("Preparando…") : m("Crear y jugar")}
                <ArrowRightIcon aria-hidden="true" />
              </Button>
            </div>
          </form>
          <section aria-labelledby="family-history-title" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="family-history-title" className="text-lg font-semibold">
                {m("Partidas de {{name}}", { name: child.name })}
              </h2>
              <Button
                variant="ghost"
                disabled={data.busy || data.loading}
                onClick={data.refresh}
              >
                {m("Actualizar")}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {m(
                "El progreso es personal. Los puntos de juegos distintos no se comparan."
              )}
            </p>
            {!games.length ? (
              <p className="rounded-xl border p-5 text-muted-foreground">
                {m("Todavía no hay partidas. Elige un juego para empezar.")}
              </p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {games.map((g) => (
                  <li
                    key={g.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                      <p className="font-medium">
                        {m(
                          familyCatalog.find((c) => c.kind === g.kind)?.name ??
                            "Juego"
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(g.createdAt)} · {m(familyRegions[g.region])}
                      </p>
                      <p className="mt-1 text-sm">
                        <strong className="mr-3 font-semibold tabular-nums">
                          {m("{{score}} puntos", {
                            score: number.format(g.score),
                          })}
                        </strong>
                        {m("Retos completados: {{count}}", {
                          count: number.format(g.solved),
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {m(
                          g.mistakes >= 3
                            ? "Fin de la partida"
                            : g.started
                              ? "En progreso"
                              : "Lista para jugar"
                        )}
                      </span>
                      <Button
                        nativeButton={false}
                        variant="outline"
                        render={
                          <Link to={familyPlayPath(g.id, g.participantId)} />
                        }
                        disabled={data.busy || data.loading}
                      >
                        {m(
                          g.mistakes >= 3
                            ? "Ver resultado"
                            : g.started
                              ? "Continuar"
                              : "Jugar"
                        )}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      <Dialog
        open={!!editor}
        onOpenChange={(open) => {
          if (!open && !data.busy) setEditor(null)
        }}
      >
        <DialogContent showCloseButton={!data.busy} closeLabel={m("Cerrar")}>
          <DialogHeader>
            <DialogTitle>
              {m(editor?.child ? "Editar perfil" : "Añadir hijo")}
            </DialogTitle>
            <DialogDescription>
              {m(
                "Usa un nombre o apodo. Estos juegos están diseñados para 2.º de Primaria."
              )}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              void data
                .saveChild(name, region, editor?.child, (saved) =>
                  setSelected(saved.id)
                )
                .then((ok) => {
                  if (ok) setEditor(null)
                })
            }}
          >
            <Field>
              <FieldLabel htmlFor="family-child-name">
                {m("Nombre o apodo")}
              </FieldLabel>
              <Input
                id="family-child-name"
                autoComplete="off"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={data.busy}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="family-child-region">
                {m("Contexto del juego")}
              </FieldLabel>
              <Select
                value={region}
                onValueChange={(v) => {
                  if (v) setRegion(v as CargoRegion)
                }}
                items={Object.entries(familyRegions).map(([value, label]) => ({
                  value,
                  label: m(label),
                }))}
                disabled={data.busy}
              >
                <SelectTrigger id="family-child-region" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(familyRegions).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {m(label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <p className="text-sm text-muted-foreground">
              {m(
                "Los cambios se aplican a los juegos nuevos. Las partidas anteriores se conservan."
              )}
            </p>
            {data.error && (
              <p role="alert" className="text-sm text-destructive">
                {m(data.error)}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditor(null)}
                disabled={data.busy}
              >
                {m("Cancelar")}
              </Button>
              <Button type="submit" disabled={data.busy || !name.trim()}>
                {m(data.busy ? "Guardando…" : "Guardar")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open && !data.busy) setRemoving(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {m("¿Eliminar el perfil de {{name}}?", { name: removing?.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {m(
                "Se eliminarán este perfil y todas sus partidas y resultados. Esta acción no se puede deshacer."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {data.error && <p role="alert">{m(data.error)}</p>}
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
                    if (ok) {
                      setRemoving(null)
                      setSelected("")
                    }
                  })
              }}
            >
              {m(data.busy ? "Eliminando…" : "Eliminar")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
