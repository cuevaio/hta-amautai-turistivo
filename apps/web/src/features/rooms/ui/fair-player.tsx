import { useState } from "react"
import { Link } from "react-router"
import type { FairFrame } from "@/game-runtime/equality-fair"
import { Button } from "@workspace/ui/components/button"
import { useMessages } from "@/shared/i18n/use-messages"
import { useFairRun } from "../model/use-fair-run"
import { FairCanvas } from "./fair-canvas"
const skills = [
  "Igualar cantidades",
  "Completar una suma",
  "Encontrar cuánto retirar",
  "Igualar dos expresiones",
]
export function FairPlayer({
  roomId,
  participantId,
  returnTo,
  returnLabel,
  nextStudent,
}: {
  roomId: string
  participantId: string
  returnLabel?: string
  returnTo?: string
  nextStudent?: { id: string; name: string }
}) {
  const game = useFairRun(roomId, participantId),
    { m, locale } = useMessages()
  const [choice, setChoice] = useState<{
    version: number
    value: number | null
  }>({ version: -1, value: null })
  const [submitted, setSubmitted] = useState<{
    task: number
    total: number
  } | null>(null)
  const back = (
    <Button
      nativeButton={false}
      variant="outline"
      render={<Link to={returnTo ?? "/panel/salas/" + roomId} />}
    >
      {m(returnLabel ?? "Ver resultados")}
    </Button>
  )
  const run = game.run
  if (!run)
    return (
      <div className="space-y-3">
        <p role={game.error ? "alert" : "status"}>
          {m(game.error || "Cargando el juego…")}
        </p>
        {game.error && <Button onClick={game.reload}>{m("Reintentar")}</Button>}
        {back}
      </div>
    )
  const { task, participant: p } = run
  const selected = choice.version === p.version ? choice.value : null
  const enabled = !game.busy && !game.error
  const left = task.leftB
    ? `${task.leftA} + ${task.leftB}`
    : String(task.target)
  const sign = task.operation === "remove" ? "−" : "+"
  const equation = `${left} = ${task.base} ${sign} ${selected ?? "?"}`
  const solution =
    task.operation === "remove"
      ? task.base - task.target
      : task.target - task.base
  const feedback =
    run.feedback === "correct"
      ? m("+{{points}} puntos", { points: run.delta })
      : run.feedback === "wrong" && submitted?.task === task.id
        ? m(
            submitted.total < task.target
              ? Math.abs(submitted.total - task.target) === 1
                ? "Falta {{count}} para igualar. −20 puntos."
                : "Faltan {{count}} para igualar. −20 puntos."
              : Math.abs(submitted.total - task.target) === 1
                ? "Sobra {{count}} para igualar. −20 puntos."
                : "Sobran {{count}} para igualar. −20 puntos.",
            { count: Math.abs(submitted.total - task.target) }
          )
        : ""
  const frame: FairFrame = {
    task,
    selected,
    enabled,
    version: p.version,
    score: m("Puntos: {{score}}", {
      score: new Intl.NumberFormat(locale).format(p.score),
    }),
    lives: m("Oportunidades: {{lives}}", { lives: 3 - p.mistakes }),
    streak: m("Racha: {{count}}", { count: run.streak }),
    mission: m(
      task.operation === "remove"
        ? "Equilibra la balanza retirando un paquete."
        : "Equilibra la balanza añadiendo un paquete."
    ),
    equation,
    fixed: m("Platillo fijo"),
    editable: m("Tu platillo"),
    delivery: m(
      task.operation === "remove" ? "Retirar paquete" : "Colocar paquete"
    ),
    packet: m("Paquete"),
    carrying: m("Paquete elegido"),
    chooseHint: m("Elige un paquete. Puedes cambiarlo antes de entregar."),
    deliverHint: m(
      task.operation === "remove"
        ? "Ve al platillo derecho para retirar la cantidad elegida."
        : "Lleva tu paquete al platillo derecho."
    ),
    hint: run.helped
      ? m("Para igualar: {{equation}}.", {
          equation: `${left} = ${task.base} ${sign} ${solution}`,
        })
      : "",
    saving: m(
      game.busy ? "Guardando resultado…" : "Revisa la conexión para continuar."
    ),
    win: m("¡Ganaste!"),
    feedback,
    feedbackKind: run.feedback,
  }
  return (
    <section className="mx-auto w-full max-w-6xl min-w-0 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {m("La feria del equilibrio")}
          </h1>
          <p className="break-words">
            {p.name} ·{" "}
            {m(
              run.room.mode === "practice"
                ? "Práctica adaptativa"
                : "Desafío de la sala"
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {back}
          {nextStudent && p.mistakes < 3 && (
            <Button
              nativeButton={false}
              title={m("Siguiente estudiante: {{name}}", {
                name: nextStudent.name,
              })}
              render={
                <Link
                  to={"/panel/salas/" + roomId + "/jugar/" + nextStudent.id}
                />
              }
            >
              {m("Siguiente estudiante")}
            </Button>
          )}
        </div>
      </header>
      {p.mistakes >= 3 ? (
        <div className="space-y-4 rounded-xl border p-8 text-center">
          <h2 className="text-3xl font-semibold">{m("Fin de la partida")}</h2>
          <p>{m("Agotaste tus tres oportunidades.")}</p>
          <p className="text-4xl font-bold">
            {m("{{score}} puntos", {
              score: new Intl.NumberFormat(locale).format(p.score),
            })}
          </p>
          <p>{m("Tu puntaje queda guardado hasta que vuelvas a intentar.")}</p>
          {nextStudent && (
            <Button
              nativeButton={false}
              render={
                <Link
                  to={"/panel/salas/" + roomId + "/jugar/" + nextStudent.id}
                />
              }
            >
              {m("Siguiente estudiante: {{name}}", { name: nextStudent.name })}
            </Button>
          )}
          <Button
            variant="outline"
            disabled={game.busy}
            onClick={() => {
              setChoice({ version: -1, value: null })
              game.restart()
            }}
          >
            {m("Volver a intentar")}
          </Button>
        </div>
      ) : (
        <>
          <FairCanvas
            region={run.room.region}
            frame={frame}
            helped={run.helped}
            onHelp={game.help}
            onUndo={() => setChoice({ version: p.version, value: null })}
            onSelect={(n) => {
              if (enabled) setChoice({ version: p.version, value: n })
            }}
            onDeliver={() => {
              if (!enabled || selected === null) return
              setSubmitted({
                task: task.id,
                total:
                  task.operation === "remove"
                    ? task.base - selected
                    : task.base + selected,
              })
              game.answer(selected)
            }}
          />
        </>
      )}
      {game.error && (
        <div role="alert" className="space-y-2">
          <p>{m(game.error)}</p>
          <Button onClick={game.reload}>{m("Recargar progreso")}</Button>
        </div>
      )}
      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer font-medium">
          {m("Resultados del intento")}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {m(
              "Sin ayuda: {{correct}} · Con apoyo: {{assisted}} · Errores: {{errors}}",
              run.evidence.reduce(
                (sum, item) => ({
                  correct: sum.correct + item.correct,
                  assisted: sum.assisted + item.assisted,
                  errors: sum.errors + item.errors,
                }),
                { correct: 0, assisted: 0, errors: 0 }
              )
            )}
          </span>
        </summary>
        <p className="my-3 text-sm text-muted-foreground">
          {m(
            "Los puntos no certifican el aprendizaje. Revisa los aciertos sin ayuda y los apoyos utilizados."
          )}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {run.evidence.map((e, i) => (
            <div key={i} className="rounded-lg bg-muted p-3">
              <p className="font-medium">{m(skills[i]!)}</p>
              <p>
                {m(
                  "Sin ayuda: {{correct}} · Con apoyo: {{assisted}} · Errores: {{errors}}",
                  e
                )}
              </p>
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}
