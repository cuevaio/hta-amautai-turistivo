import { useMessages } from "@/shared/i18n/use-messages"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import type {
  CurriculumCatalog,
  LearningSession,
  LearningSessionInput,
} from "@amautai/contracts"
import { useEducation } from "../model/education-provider"
import { useSessions, useSessionEditor } from "../model/use-sessions"
import {
  missingSessionFields,
  newSession,
  sessionSummary,
  sessionValues,
} from "../model/session"
import { SessionFields } from "./session-fields"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty"
import { PlusIcon, BookOpenIcon, ArrowLeftIcon, CopyIcon } from "lucide-react"
function Summary({
  values,
  catalog,
  id = "session-summary",
}: {
  values: LearningSessionInput
  catalog: CurriculumCatalog
  id?: string
}) {
  const { m } = useMessages()

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id}>{m("Resumen del borrador")}</FieldLabel>
        <Textarea
          id={id}
          readOnly
          rows={22}
          value={sessionSummary(values, catalog, m)}
        />
      </Field>
      <p className="text-sm text-muted-foreground">
        {m(
          "Este borrador organiza tus datos; requiere revisión docente y no acredita validación curricular."
        )}
      </p>
      <div className="flex flex-col gap-2 text-sm">
        {catalog.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            {m(source.title)}
          </a>
        ))}
      </div>
    </FieldGroup>
  )
}
function SessionEditor({
  initial,
  existing,
  catalog,
}: {
  initial: LearningSessionInput
  existing: LearningSession | null
  catalog: CurriculumCatalog
}) {
  const { m, errorMessage } = useMessages()

  const editor = useSessionEditor(initial, existing)
  const [view, setView] = useState<"edit" | "summary">(
    existing ? "summary" : "edit"
  )
  const navigate = useNavigate()
  const missing = missingSessionFields(editor.values)
  return (
    <div className="flex max-w-3xl flex-col gap-6 py-4">
      <Button
        nativeButton={false}
        variant="ghost"
        className="self-start"
        render={<Link to="/panel/sesiones" />}
        disabled={editor.busy}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        {m("Todas las sesiones")}
      </Button>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">
          {existing
            ? m("Borrador de sesión")
            : m("Nueva sesión de aprendizaje")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {m("Matemática · 2.º de Primaria · Ciclo III")}
        </p>
        <Badge variant="secondary" className="self-start">
          {missing.length
            ? m("Borrador · Datos por completar")
            : m("Borrador · Datos completos")}
        </Badge>
      </div>
      {missing.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {m("Por completar:")}
          {missing.map((field) => m(field)).join(", ")}
          {m(". Puedes guardar con un título.")}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant={view === "edit" ? "default" : "outline"}
          onClick={() => setView("edit")}
        >
          {m("Editar borrador")}
        </Button>
        <Button
          type="button"
          variant={view === "summary" ? "default" : "outline"}
          onClick={() => setView("summary")}
        >
          {m("Ver resumen")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void editor.copy(sessionSummary(editor.values, catalog, m))
          }
        >
          <CopyIcon data-icon="inline-start" />
          {m("Copiar borrador")}
        </Button>
      </div>
      {view === "summary" ? (
        <Summary values={editor.values} catalog={catalog} />
      ) : (
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault()
            const result = await editor.save()
            if (result && !existing)
              navigate("/panel/sesiones/" + result.id, { replace: true })
          }}
          className="flex flex-col gap-6"
        >
          <SessionFields
            values={editor.values}
            onChange={editor.setValues}
            catalog={catalog}
            busy={editor.busy}
            issues={editor.issues}
          />
          <Button
            type="submit"
            className="self-start"
            disabled={editor.busy || editor.conflict}
          >
            {editor.busy ? m("Guardando…") : m("Guardar borrador")}
          </Button>
        </form>
      )}
      {editor.error && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(editor.error)}
        </p>
      )}
      {editor.notice && (
        <p role="status" className="text-sm">
          {m(editor.notice)}
        </p>
      )}
      {editor.conflict && (
        <section className="flex flex-col gap-4 rounded-lg border p-4">
          <h2 className="font-medium">{m("Hay una versión más reciente")}</h2>
          <p className="text-sm">
            {m(
              "Tus cambios siguen en el formulario. Puedes copiarlos y comparar con la versión guardada antes de continuar."
            )}
          </p>
          <Button
            className="self-start"
            variant="outline"
            disabled={editor.busy}
            onClick={() => void editor.loadLatest()}
          >
            {m("Ver versión guardada")}
          </Button>
          {editor.latest && (
            <>
              <Summary
                values={editor.latest}
                catalog={catalog}
                id="latest-summary"
              />
              <p className="text-sm text-muted-foreground">
                {m(
                  "La siguiente acción sustituye los cambios que todavía no guardaste."
                )}
              </p>
              <Button
                className="self-start"
                variant="outline"
                onClick={editor.useLatest}
              >
                {m("Usar versión guardada")}
              </Button>
            </>
          )}
        </section>
      )}
    </div>
  )
}
export function LearningSessions({ sessionId }: { sessionId?: string }) {
  const { m, errorMessage, formatDate } = useMessages()

  const { profile, catalog } = useEducation()
  const data = useSessions(sessionId)
  if (data.loading || !profile || !catalog)
    return (
      <div
        role="status"
        aria-label={m("Cargando sesiones")}
        className="flex max-w-3xl flex-col gap-4 py-6"
      >
        <Skeleton className="h-12" />
        <Skeleton className="h-48" />
        <span className="sr-only">{m("Cargando sesiones…")}</span>
      </div>
    )
  if (data.error)
    return (
      <div className="flex flex-col items-start gap-4 py-6">
        <p role="alert">{errorMessage(data.error)}</p>
        <Button onClick={data.retry}>{m("Reintentar")}</Button>
        <Link to="/panel/sesiones" className="text-sm underline">
          {m("Volver a sesiones")}
        </Link>
      </div>
    )
  if (sessionId)
    return (
      <SessionEditor
        key={sessionId}
        initial={
          data.session
            ? sessionValues(data.session)
            : newSession(profile, catalog)
        }
        existing={data.session}
        catalog={catalog}
      />
    )
  return (
    <section className="flex max-w-4xl flex-col gap-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">
            {m("Sesiones de aprendizaje")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {m(
              "Organiza tus propósitos y contexto. Guarda y revisa los borradores de Matemática."
            )}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link to="/panel/sesiones/new" />}
        >
          <PlusIcon data-icon="inline-start" />
          {m("Nueva sesión")}
        </Button>
      </div>
      {!data.sessions.length ? (
        <Empty className="min-h-72 border">
          <EmptyHeader>
            <BookOpenIcon className="mx-auto text-muted-foreground" />
            <EmptyTitle>{m("Tu primera sesión empieza aquí")}</EmptyTitle>
            <EmptyDescription>
              {m(
                "Elige qué trabajará tu grupo y guarda un borrador, incluso si aún faltan datos."
              )}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link to="/panel/sesiones/new" />}
            >
              {m("Crear mi primera sesión")}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {data.sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Link
                  to={"/panel/sesiones/" + session.id}
                  className="font-medium break-words underline-offset-4 hover:underline"
                >
                  {session.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {m("2.º de Primaria · Ciclo III · Actualizada")}{" "}
                  {formatDate(session.updatedAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <Badge variant="secondary" className="self-start">
                  {session.missingFields.length
                    ? m("Datos pendientes", {
                        count: session.missingFields.length,
                      })
                    : m("Datos completos · Requiere revisión")}
                </Badge>
              </div>
              <Button
                nativeButton={false}
                variant="outline"
                render={<Link to={"/panel/sesiones/" + session.id} />}
              >
                {m("Abrir")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
