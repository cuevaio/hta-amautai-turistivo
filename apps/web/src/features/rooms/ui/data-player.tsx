import { useState } from "react"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"
import { useMessages } from "@/shared/i18n/use-messages"
import type { DataFrame } from "@/game-runtime/data-fair"
import { useDataRun } from "../model/use-data-run"
import { DataCanvas } from "./data-canvas"
const skillNames = [
  "Organizar los votos",
  "Leer un gráfico",
  "Encontrar la mayor frecuencia",
  "Comparar los votos",
]
const foodNames = ["Pescado", "Maíz", "Plátano"]
export function DataPlayer({
  roomId,
  participantId,
  nextStudent,
}: {
  roomId: string
  participantId: string
  nextStudent?: { id: string; name: string }
}) {
  const game = useDataRun(roomId, participantId),
    { m, locale } = useMessages()
  const [choice, setChoice] = useState<{
    version: number
    value: number | null
  }>({ version: -1, value: null })
  const run = game.run
  const back = (
    <Button
      nativeButton={false}
      variant="outline"
      render={<Link to={"/panel/salas/" + roomId} />}
    >
      {m("Ver resultados")}
    </Button>
  )
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
    labels = foodNames.map((n) => m(n))
  const selected = choice.version === p.version ? choice.value : null
  const enabled = !game.busy && !game.error
  const mission =
    task.skill === 0
      ? m("Registra cada voto en su columna.")
      : task.skill === 1
        ? m("¿Cuántos votos tiene {{food}}?", { food: labels[task.category]! })
        : task.skill === 2
          ? m("¿Qué alimento recibió más votos?")
          : m(
              "¿Cuántos votos de diferencia hay entre {{first}} y {{second}}?",
              { first: labels[task.category]!, second: labels[task.compare]! }
            )
  const answer =
    task.skill === 0
      ? task.votes[task.cursor]!
      : task.skill === 1
        ? task.counts[task.category]!
        : task.skill === 2
          ? task.counts.indexOf(Math.max(...task.counts))
          : Math.abs(task.counts[task.category]! - task.counts[task.compare]!)
  const description =
    task.skill === 0
      ? labels[answer]!
      : task.skill === 2
        ? labels[answer]!
        : String(answer)
  const frame: DataFrame = {
    task,
    selected,
    enabled,
    version: p.version,
    labels,
    score: m("Puntos: {{score}}", {
      score: new Intl.NumberFormat(locale).format(p.score),
    }),
    lives: m("Oportunidades: {{lives}}", { lives: 3 - p.mistakes }),
    streak: m("Racha: {{count}}", { count: run.streak }),
    mission,
    legend: m(
      task.unit === 1
        ? "Cada ficha representa 1 voto."
        : "Cada ficha representa 2 votos."
    ),
    progress: m("Votos registrados: {{done}} / {{total}}", {
      done: task.cursor * task.unit,
      total: task.votes.length * task.unit,
    }),
    source: m(task.skill === 0 ? "Recoger ficha" : "Entregar respuesta"),
    column: m("Registrar voto"),
    carrying: m("Tu ficha"),
    instruction: m(
      task.skill === 0
        ? selected === null
          ? "Recoge una ficha en el puesto de encuestas."
          : "Lleva la ficha a la columna del mismo alimento."
        : selected === null
          ? "Lee el gráfico y recoge una respuesta."
          : "Lleva tu respuesta al puesto de encuestas."
    ),
    hint: run.helped
      ? m(
          task.skill === 0
            ? "Busca la columna de {{answer}}."
            : "Observa el gráfico. La respuesta es {{answer}}.",
          { answer: description }
        )
      : "",
    saving: m(
      game.busy ? "Guardando resultado…" : "Revisa la conexión para continuar."
    ),
    win: m("¡Ganaste!"),
    feedback:
      run.feedback === "correct"
        ? m("+{{points}} puntos", { points: run.delta })
        : run.feedback === "wrong"
          ? m(
              task.skill === 0
                ? "Ese voto pertenece a otra columna. −20 puntos."
                : "Revisa las fichas del gráfico. −20 puntos."
            )
          : "",
    feedbackKind: run.feedback,
  }
  return (
    <section className="mx-auto w-full max-w-6xl min-w-0 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {m("La feria de los datos")}
          </h1>
          <p>
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
          {nextStudent && (
            <Button
              nativeButton={false}
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
          <Button disabled={game.busy} onClick={game.restart}>
            {m("Volver a intentar")}
          </Button>
        </div>
      ) : (
        <DataCanvas
          region={run.room.region}
          frame={frame}
          helped={run.helped}
          onHelp={game.help}
          onSelect={(n) => {
            if (enabled) setChoice({ version: p.version, value: n })
          }}
          onUndo={() => setChoice({ version: p.version, value: null })}
          onDeliver={(n) => {
            if (enabled && selected !== null) game.answer(n)
          }}
        />
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
        </summary>
        <p className="my-3 text-sm text-muted-foreground">
          {m(
            "Los puntos no certifican el aprendizaje. Revisa los aciertos sin ayuda y los apoyos utilizados."
          )}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {run.evidence.map((e, i) => (
            <div key={i} className="rounded-lg bg-muted p-3">
              <p className="font-medium">{m(skillNames[i]!)}</p>
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
