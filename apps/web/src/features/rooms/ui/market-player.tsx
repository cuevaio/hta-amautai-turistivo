import type { MarketZone } from "@/game-runtime/market-controls"
import { useState } from "react"
import { Link } from "react-router"
import type { MarketTask } from "@amautai/contracts"
import { useMessages } from "@/shared/i18n/use-messages"
import { Button } from "@workspace/ui/components/button"
import { useMarketRun } from "../model/use-market-run"
import { MarketCanvas } from "./market-canvas"
const skills = [
  "Sumas",
  "Restas",
  "Sumas con cantidad desconocida",
  "Restas con cantidad desconocida",
]
function equation(t: MarketTask) {
  const result = t.operation === "+" ? t.a + t.b : t.a - t.b
  return t.missing
    ? `${t.a} ${t.operation} □ = ${result}`
    : `${t.a} ${t.operation} ${t.b} = ?`
}
function strategy(t: MarketTask) {
  const result = t.operation === "+" ? t.a + t.b : t.a - t.b
  if (t.missing) return `${t.a} ${t.operation} ${t.b} = ${result}`
  const step = t.operation === "+" ? 10 - (t.a % 10) : t.a % 10
  if (step > 0 && t.b > step)
    return `${t.a} ${t.operation} ${step} ${t.operation} ${t.b - step} = ${result}`
  return `${t.a} ${t.operation} ${t.b} = ${result}`
}
function NumberLine({ task, label }: { task: MarketTask; label: string }) {
  const total = task.operation === "+" ? task.a + task.b : task.a - task.b
  const max = Math.max(10, Math.ceil(Math.max(task.a, total) / 10) * 10)
  const start = (task.a / max) * 100,
    end = (total / max) * 100
  return (
    <div
      role="img"
      aria-label={`${label}: ${task.a} ${task.operation} ${task.b} = ${total}`}
      className="relative mx-auto my-8 h-10 max-w-sm border-b-2 border-foreground"
    >
      {Array.from({ length: 11 }, (_, i) => (
        <span
          key={i}
          className="absolute bottom-0 h-2 border-l border-foreground/40"
          style={{ left: `${i * 10}%` }}
        />
      ))}
      <span
        className="absolute bottom-2 h-1 bg-primary"
        style={{
          left: `${Math.min(start, end)}%`,
          width: `${Math.abs(end - start)}%`,
        }}
      />
      <span
        className="absolute top-0 -translate-x-1/2 text-sm font-semibold"
        style={{ left: `${start}%` }}
      >
        {task.a}
      </span>
      <span
        className="absolute -bottom-7 -translate-x-1/2 text-sm font-semibold"
        style={{ left: `${end}%` }}
      >
        {total}
      </span>
      <span className="absolute -bottom-5 -left-1 text-xs">0</span>
      <span className="absolute -right-1 -bottom-5 text-xs">{max}</span>
    </div>
  )
}
export function MarketPlayer({
  roomId,
  participantId,
}: {
  roomId: string
  participantId: string
}) {
  const game = useMarketRun(roomId, participantId),
    { m, locale } = useMessages()
  const [choice, setChoice] = useState({
    task: -1,
    value: 0,
    history: [] as number[],
  })
  const [zone, setZone] = useState<MarketZone>("road")
  const run = game.run
  const back = (
    <Button
      nativeButton={false}
      variant="outline"
      render={<Link to={"/dashboard/rooms/" + roomId} />}
    >
      {m("Volver a la sala")}
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
    number = new Intl.NumberFormat(locale)
  const quantity =
    choice.task === task.id ? choice.value : task.missing ? 0 : task.a
  const initial = task.missing ? 0 : task.a
  const sign = task.operation === "+" ? 1 : -1
  const moved = task.missing ? quantity : Math.abs(quantity - task.a)
  const limit = task.operation === "+" ? 100 - task.a : task.a
  const currentCargo = task.missing ? task.a + sign * quantity : quantity
  const canAct = !game.busy && !game.error
  const transfer = (amount: number) => {
    if (!canAct) return
    setChoice((previous) => {
      const before = previous.task === task.id ? previous.value : initial
      const oldMoved = task.missing ? before : Math.abs(before - task.a)
      const nextMoved = Math.min(limit, Math.max(0, oldMoved + amount))
      if (nextMoved === oldMoved) return previous
      return {
        task: task.id,
        value: task.missing ? nextMoved : task.a + sign * nextMoved,
        history: [
          ...(previous.task === task.id ? previous.history : []),
          before,
        ],
      }
    })
  }
  const undo = () =>
    setChoice((previous) =>
      previous.task === task.id && previous.history.length
        ? {
            task: task.id,
            value: previous.history.at(-1)!,
            history: previous.history.slice(0, -1),
          }
        : previous
    )
  const total = task.operation === "+" ? task.a + task.b : task.a - task.b
  const food = m(
    { coast: "pescados", highlands: "choclos", jungle: "plátanos" }[
      run.room.region
    ]
  )
  const story = task.missing
    ? m(
        task.operation === "+"
          ? "Llevas {{a}} {{food}}. ¿Cuántos recoges para tener {{total}}?"
          : "Llevas {{a}} {{food}}. ¿Cuántos dejas en el almacén para llevar {{total}} al mercado?",
        { a: task.a, food, total }
      )
    : m(
        task.operation === "+"
          ? "Llevas {{a}} {{food}} y recoges {{b}} más. ¿Cuántos llevas ahora?"
          : "Llevas {{a}} {{food}}. Deja {{b}} en el almacén y lleva al mercado los que quedan.",
        { a: task.a, b: task.b, food }
      )
  return (
    <section className="mx-auto w-full max-w-5xl min-w-0 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{m("La ruta del mercado")}</h1>
        </div>
        {back}
      </header>
      {p.mistakes >= 3 ? (
        <div className="space-y-5 rounded-xl border p-8 text-center">
          <h2 className="text-3xl font-semibold">{m("Fin de la partida")}</h2>
          <p>{m("Agotaste tus tres oportunidades.")}</p>
          <p className="text-4xl font-bold">
            {m("{{score}} puntos", { score: number.format(p.score) })}
          </p>
          <p>{m("Tu puntaje queda guardado hasta que vuelvas a intentar.")}</p>
          <Button
            disabled={game.busy}
            onClick={() => {
              setChoice({ task: -1, value: 0, history: [] })
              setZone("road")
              game.restart()
            }}
          >
            {m("Volver a intentar")}
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <MarketCanvas
            mission={
              <>
                <p className="text-sm font-medium text-muted-foreground">
                  {m("Tu misión")}
                </p>
                <p className="text-3xl font-semibold tabular-nums">
                  {equation(task)}
                </p>
                <p className="text-sm leading-relaxed">{story}</p>
              </>
            }
            tools={
              <>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={
                    !canAct || choice.task !== task.id || !choice.history.length
                  }
                  onClick={undo}
                >
                  {m("Deshacer")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={game.help}
                  disabled={game.busy || run.helped || !!game.error}
                >
                  {m("Ver ayuda")}
                </Button>
              </>
            }
            region={run.room.region}
            quantity={currentCargo}
            stop={p.solved}
            task={task.id}
            operation={task.operation}
            enabled={canAct}
            remaining={limit - moved}
            zone={zone}
            onZone={setZone}
            onTransfer={transfer}
            onCheckout={() => game.answer(quantity)}
            score={p.score}
            lives={3 - p.mistakes}
            streak={run.streak}
            feedbackKind={run.feedback}
            feedbackVersion={p.version}
            feedbackText={
              run.feedback === "correct"
                ? m("+{{points}} puntos", { points: run.delta })
                : run.feedback === "wrong"
                  ? m(
                      "−20 puntos. Usa Deshacer o vuelve al almacén para corregir."
                    )
                  : ""
            }
          />
          {run.helped && (
            <div className="border-t bg-background p-4 sm:p-5">
              <div
                role="status"
                aria-live="polite"
                className="space-y-2 text-center"
              >
                {run.helped && (
                  <div className="rounded-lg bg-muted p-3">
                    <p>{m("Observa cómo cambia la cantidad:")}</p>
                    <p className="text-xl font-semibold">{strategy(task)}</p>
                    <p className="text-sm text-muted-foreground">
                      {m("Cada caja representa una decena.")}
                    </p>
                    <NumberLine task={task} label={m("Recta numérica")} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {game.error && (
        <div role="alert" className="space-y-2">
          <p>{m(game.error)}</p>
          <Button onClick={game.reload}>{m("Recargar progreso")}</Button>
        </div>
      )}
      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer font-medium">
          {m("Progreso de aprendizaje")}
        </summary>
        <p className="my-3 text-sm text-muted-foreground">
          {m(
            "Los puntos no certifican el aprendizaje. Revisa los aciertos sin ayuda y los apoyos utilizados."
          )}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {run.evidence.map((item, i) => (
            <div key={i} className="rounded-lg bg-muted p-3">
              <p className="font-medium">{m(skills[i]!)}</p>
              <p className="text-sm">
                {m(
                  "Sin ayuda: {{correct}} · Con apoyo: {{assisted}} · Errores: {{errors}}",
                  item
                )}
              </p>
              {run.room.mode === "practice" && (
                <p className="text-sm">
                  {m("Rango de práctica: 0–{{limit}}", {
                    limit: [10, 20, 100][run.bands[i]!],
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}
