import { useState } from "react"
import { Link } from "react-router"
import type { NurseryFrame } from "@/game-runtime/nursery"
import { Button } from "@workspace/ui/components/button"
import { useMessages } from "@/shared/i18n/use-messages"
import { useNurseryRun } from "../model/use-nursery-run"
import { changeNurseryLoad } from "../model/nursery-load"
import type { NurseryLoad } from "../model/nursery-load"
import { NurseryCanvas } from "./nursery-canvas"
const skills = [
  "Formar cantidades",
  "Agrupar unidades en decenas",
  "Desagrupar decenas en unidades",
]
export function NurseryPlayer({
  roomId,
  participantId,
  nextStudent,
}: {
  roomId: string
  participantId: string
  nextStudent?: { id: string; name: string }
}) {
  const game = useNurseryRun(roomId, participantId),
    { m, locale } = useMessages()
  const [choice, setChoice] = useState<{
    task: number
    load: NurseryLoad
    history: NurseryLoad[]
  }>({ task: -1, load: { trays: 0, units: 0 }, history: [] })
  const [submitted, setSubmitted] = useState({ task: -1, total: 0 })
  const back = (
    <Button
      nativeButton={false}
      variant="outline"
      render={<Link to={"/panel/salas/" + roomId} />}
    >
      {m("Ver resultados")}
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
  const { task, participant: p } = run,
    initial = { trays: task.initialTrays, units: task.initialUnits }
  const load = choice.task === task.id ? choice.load : initial
  const enabled = !game.busy && !game.error
  const mission = m(
    task.skill === 1
      ? "{{target}} plantas: usa todas las bandejas completas que puedas."
      : task.skill === 2
        ? "{{target}} plantas: deja diez o más macetas sueltas."
        : "Forma {{target}} plantas y llévalas al jardín.",
    { target: task.target }
  )
  const feedback =
    run.feedback === "correct"
      ? m("+{{points}} puntos", { points: run.delta })
      : run.feedback === "wrong"
        ? submitted.task === task.id && submitted.total !== task.target
          ? m(
              submitted.total < task.target
                ? "Faltan {{count}} plantas. −20 puntos."
                : "Sobran {{count}} plantas. −20 puntos.",
              { count: Math.abs(task.target - submitted.total) }
            )
          : m("La cantidad es correcta. Revisa el canje. −20 puntos.")
        : ""
  const frame: NurseryFrame = {
    task: task.id,
    target: task.target,
    canUndo: choice.task === task.id && choice.history.length > 0,
    trays: load.trays,
    units: load.units,
    enabled,
    score: m("Puntos: {{score}}", {
      score: new Intl.NumberFormat(locale).format(p.score),
    }),
    lives: m("Oportunidades: {{lives}}", { lives: 3 - p.mistakes }),
    streak: m("Racha: {{count}}", { count: run.streak }),
    mission,
    goal: m("Meta"),
    stationLabels: {
      unit: m("Una maceta"),
      tray: m("Una bandeja de diez"),
      group: m("Agrupar diez"),
      ungroup: m("Abrir bandeja"),
      garden: m("Plantar"),
    },
    touchHint: m("Toca una estación o usa las flechas."),
    walkHint: m("Flechas o WASD para caminar. Toca una estación para ir."),
    saved: m(
      game.busy ? "Guardando resultado…" : "Revisa la conexión para continuar."
    ),
    inventory: m("Tu preparación"),
    tens: m("Bandejas de diez"),
    ones: m("Macetas sueltas"),
    hint: run.helped
      ? m(
          "Una bandeja equivale a diez macetas. {{tens}} × 10 + {{units}} = {{target}}.",
          {
            tens: Math.floor(task.target / 10) - (task.skill === 2 ? 1 : 0),
            units: (task.target % 10) + (task.skill === 2 ? 10 : 0),
            target: task.target,
          }
        )
      : "",
    feedback,
    feedbackKind: run.feedback,
    version: p.version,
    win: m("¡Ganaste!"),
    planted: p.solved,
  }
  return (
    <section className="mx-auto w-full max-w-6xl min-w-0 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {m("El vivero de las decenas")}
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
              setChoice({ task: -1, load: { trays: 0, units: 0 }, history: [] })
              game.restart()
            }}
          >
            {m("Volver a intentar")}
          </Button>
        </div>
      ) : (
        <>
          <NurseryCanvas
            region={run.room.region}
            frame={frame}
            helped={run.helped}
            onHelp={game.help}
            onUndo={() =>
              setChoice((previous) =>
                previous.task === task.id && previous.history.length
                  ? {
                      ...previous,
                      load: previous.history.at(-1)!,
                      history: previous.history.slice(0, -1),
                    }
                  : previous
              )
            }
            onDeliver={() => {
              setSubmitted({
                task: task.id,
                total: load.trays * 10 + load.units,
              })
              game.answer(load)
            }}
            onAction={(action) => {
              if (!enabled) return
              setChoice((previous) => {
                const before =
                    previous.task === task.id ? previous.load : initial,
                  next = changeNurseryLoad(before, action)
                if (next === before) return previous
                return {
                  task: task.id,
                  load: next,
                  history: [
                    ...(previous.task === task.id ? previous.history : []),
                    before,
                  ],
                }
              })
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
        <div className="grid gap-3 sm:grid-cols-3">
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
