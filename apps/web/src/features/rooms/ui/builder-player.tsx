import { useState } from "react"
import { Link } from "react-router"
import type { BuilderPlacement, BuilderShape } from "@amautai/contracts"
import { Button } from "@workspace/ui/components/button"
import { useMessages } from "@/shared/i18n/use-messages"
import { useBuilderRun } from "../model/use-builder-run"
import { BuilderCanvas } from "./builder-canvas"
const shapeNames: Record<BuilderShape, string> = {
  triangle: "Triángulo",
  square: "Cuadrado",
  rectangle: "Rectángulo",
  circle: "Círculo",
}
const properties: Record<BuilderShape, string> = {
  triangle: "Busca la figura de 3 lados.",
  square: "Busca la figura de 4 lados iguales.",
  rectangle: "Busca la figura con dos lados largos y dos cortos.",
  circle: "Busca la figura sin esquinas.",
}
const skills = [
  "Reconocer figuras",
  "Reconocer lados y esquinas",
  "Orientar las figuras",
]
const places = ["Pared", "Techo", "Ventana"]
export function BuilderPlayer({
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
  const game = useBuilderRun(roomId, participantId),
    { m, locale } = useMessages()
  const [choice, setChoice] = useState<{
    key: string
    value: BuilderPlacement | null
  }>({ key: "", value: null })
  const run = game.run,
    back = (
      <Button
        nativeButton={false}
        variant="outline"
        render={<Link to={returnTo ?? "/panel/salas/" + roomId} />}
      >
        {m(returnLabel ?? "Ver resultados")}
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
  const { participant: p } = run,
    task = game.completed ?? run.task,
    key = `${run.task.id}:${run.task.cursor}:${p.version}`,
    selected = choice.key === key ? choice.value : null
  const target = task.targets[Math.min(task.cursor, 2)]!,
    name = m(shapeNames[target]),
    enabled = !game.busy && !game.error && !game.completed
  const feedback =
    run.feedback === "correct"
      ? m("+{{points}} puntos", { points: run.delta })
      : run.feedback === "wrong"
        ? m("Esa figura no encaja. −20 puntos.")
        : ""
  const mission = run.helped
    ? m(
        task.rotatable
          ? "Elige {{shape}} y gírala para encajar."
          : "Elige {{shape}} para el espacio resaltado.",
        { shape: name }
      )
    : task.skill === 1
      ? m(properties[target])
      : m("Coloca {{shape}} en {{place}}.", {
          shape: name,
          place: m(places[Math.min(task.cursor, 2)]!),
        })
  return (
    <section className="mx-auto w-full max-w-6xl min-w-0 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {m("Constructores del Perú")}
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
        <BuilderCanvas
          region={run.room.region}
          frame={{ task, selected, enabled, complete: !!game.completed }}
          helped={run.helped}
          copy={{
            score: m("Puntos: {{score}}", {
              score: new Intl.NumberFormat(locale).format(p.score),
            }),
            lives: m("Oportunidades: {{lives}}", { lives: 3 - p.mistakes }),
            mission,
            progress: m("Pieza {{current}} de 3", {
              current: Math.min(3, task.cursor + 1),
            }),
            target: m("Colocar en {{place}}", {
              place: m(places[Math.min(task.cursor, 2)]!),
            }),
            names: task.pieces.map((piece) => m(shapeNames[piece.shape])),
            feedback,
            instruction: game.busy
              ? m("Guardando resultado…")
              : (run.feedback === "wrong" ? feedback : "") ||
                m(
                  selected
                    ? "Ahora toca el espacio resaltado."
                    : "Toca una figura. También puedes arrastrarla."
                ),
          }}
          onSelect={(value) => {
            if (enabled) setChoice({ key, value })
          }}
          onPlace={(value) => {
            if (enabled) game.answer(value)
          }}
          onHelp={game.help}
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
