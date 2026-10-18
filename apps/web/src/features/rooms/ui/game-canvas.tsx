import { GameStatus } from "./game-status"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import type { CargoRegion } from "@amautai/contracts"
import type { CargoRuntime } from "@/game-runtime/space-cargo"
import { useMessages } from "@/shared/i18n/use-messages"
import { Button } from "@workspace/ui/components/button"
export function GameCanvas({
  region,
  value,
  energy,
  target,
  paused,
  saving,
  feedbackVersion,
  launch,
  onCollect,
  score,
  caught,
  groupCount,
  mistakes,
  level,
  feedback,
}: {
  region: CargoRegion
  value: number
  energy: number
  target: number
  paused: boolean
  saving: boolean
  feedbackVersion: number
  launch: number
  onCollect: (value: number | null) => void
  score: number
  caught: number
  groupCount: number
  mistakes: number
  level: number
  feedback: string
}) {
  const { m } = useMessages()
  const hud = useMemo(
    () => ({
      score: m("Puntos: {{score}}", { score }),
      goal: `${groupCount} × ${value}`,
      lives: m("Oportunidades: {{lives}}", { lives: 3 - mistakes }),
      level: m("Nivel {{level}}", { level }),
      win: m("¡Ganaste!"),
      scoreValue: score,
      feedbackVersion,
      feedback:
        feedback === "wrong"
          ? m(
              "Ese grupo tiene otra cantidad. Busca grupos de {{value}}. −15 puntos.",
              { value }
            )
          : feedback === "correct"
            ? m("Grupo correcto. +20 puntos.")
            : "",
      progress: m("Grupos: {{caught}} de {{total}}", {
        caught,
        total: groupCount,
      }),
      instruction: m("Recoge grupos de {{value}}", { value }),
      status: saving
        ? m("Guardando respuesta…")
        : paused
          ? m("Prueba en pausa")
          : "",
    }),
    [
      m,
      score,
      groupCount,
      value,
      caught,
      mistakes,
      level,
      feedback,
      feedbackVersion,
      saving,
      paused,
    ]
  )
  const previousLaunch = useRef(launch)
  const [attempt, setAttempt] = useState(0)
  const host = useRef<HTMLDivElement>(null)
  const runtime = useRef<CargoRuntime | null>(null)
  const collect = useRef(onCollect)
  const reduced = !!useReducedMotion()
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [readyVersion, setReadyVersion] = useState(0)
  useEffect(() => {
    collect.current = onCollect
  }, [onCollect])
  const callback = useCallback((n: number | null) => collect.current(n), [])
  useEffect(() => {
    let disposed = false
    let instance: CargoRuntime | undefined
    const element = host.current
    if (!element) return
    import("@/game-runtime/space-cargo")
      .then(({ createCargoGame }) => {
        if (disposed) return
        instance = createCargoGame(element, {
          region,
          reducedMotion: reduced,
          onCollect: callback,
          onReady: () => {
            if (!disposed) {
              element
                .querySelector("canvas")
                ?.setAttribute("aria-hidden", "true")
              setStatus("ready")
              setReadyVersion((version) => version + 1)
              element.focus({ preventScroll: true })
            }
          },
          onError: () => {
            if (!disposed) setStatus("error")
          },
        })
        runtime.current = instance
      })
      .catch(() => {
        if (!disposed) setStatus("error")
      })
    return () => {
      disposed = true
      runtime.current = null
      instance?.destroy()
    }
  }, [region, reduced, callback, attempt])
  useEffect(() => {
    runtime.current?.challenge(value, energy, target, hud)
    runtime.current?.pause(paused)
  }, [
    value,
    energy,
    target,
    paused,
    status,
    readyVersion,
    score,
    caught,
    groupCount,
    mistakes,
    level,
    feedback,
    hud,
  ])
  useEffect(() => {
    if (launch > previousLaunch.current) runtime.current?.launch()
    previousLaunch.current = launch
  }, [launch])
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <GameStatus
        score={score}
        lives={3 - mistakes}
        detail={{ label: m("Nivel"), value: level }}
      />
      <div className="grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:grid-rows-[auto_1fr]">
        <div className="space-y-2 p-4 pb-0 sm:p-5 sm:pb-0 lg:col-start-2 lg:row-start-1 lg:border-l">
          <p className="text-sm font-medium text-muted-foreground">
            {m("Tu misión")}
          </p>
          <p className="text-3xl font-semibold tabular-nums">
            {groupCount} × {value}
          </p>
          <p className="text-sm leading-relaxed">
            {m("Recoge {{count}} grupos de {{value}} alimentos.", {
              count: groupCount,
              value,
            })}
          </p>
        </div>
        <div className="relative mt-4 min-w-0 self-start bg-[#102f38] lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-0">
          <div
            ref={host}
            tabIndex={0}
            className="relative aspect-[120/67] w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring [&_canvas]:block [&_canvas]:max-w-full"
            role="group"
            aria-describedby="flight-help"
            aria-label={m(
              "Zona de vuelo: recoge los grupos de alimento indicados."
            )}
          />
          {hud.status && (
            <p
              role="status"
              className="absolute inset-x-3 top-3 rounded-lg border bg-background px-3 py-2 text-center text-sm font-medium"
            >
              {hud.status}
            </p>
          )}
        </div>
        <aside className="flex min-w-0 flex-col gap-4 border-t p-4 sm:p-5 lg:col-start-2 lg:row-start-2 lg:border-t-0 lg:border-l">
          <div className="space-y-2">
            <p className="text-sm font-medium tabular-nums">{hud.progress}</p>
            <div
              role="progressbar"
              aria-label={m("Grupos recogidos")}
              aria-valuemin={0}
              aria-valuemax={groupCount}
              aria-valuenow={caught}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min(100, (caught / groupCount) * 100)}%`,
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">
              {m("Alimentos: {{current}} de {{total}}", {
                current: energy,
                total: target,
              })}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {m("Toca el cielo para volar. Evita los grupos con otra cantidad.")}
          </p>
          {hud.feedback && (
            <p
              role="status"
              className="rounded-lg bg-muted px-3 py-2 text-sm leading-relaxed"
            >
              {hud.feedback}
            </p>
          )}
          <p className="sr-only" aria-live="polite">
            {hud.score}. {hud.progress}. {hud.lives}. {hud.level}.
          </p>
          <p id="flight-help" className="sr-only">
            {m(
              "Usa las flechas o WASD. También puedes tocar un destino en el cielo para volar."
            )}
          </p>
          <details
            onToggle={(e) => {
              if (!e.currentTarget.open) runtime.current?.steer(0, 0)
            }}
            className="mt-auto border-t pt-3"
          >
            <summary className="cursor-pointer text-sm font-medium">
              {m("Controles y cómo jugar")}
            </summary>
            <p className="my-3 text-sm text-muted-foreground">
              {m(
                "Usa las flechas o WASD. También puedes tocar un destino en el cielo para volar."
              )}
            </p>
            <div
              role="group"
              aria-label={m("Controles de vuelo")}
              className="flex flex-wrap gap-2"
            >
              {(
                [
                  { x: -1, y: 0, icon: "←", label: "Mover a la izquierda" },
                  { x: 0, y: -1, icon: "↑", label: "Mover hacia arriba" },
                  { x: 0, y: 1, icon: "↓", label: "Mover hacia abajo" },
                  { x: 1, y: 0, icon: "→", label: "Mover a la derecha" },
                ] as const
              ).map((direction) => (
                <Button
                  key={direction.label}
                  type="button"
                  variant="outline"
                  size="icon"
                  className="touch-none select-none"
                  aria-label={m(direction.label)}
                  disabled={paused || status !== "ready"}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId)
                    runtime.current?.steer(direction.x, direction.y)
                  }}
                  onPointerUp={() => runtime.current?.steer(0, 0)}
                  onPointerCancel={() => runtime.current?.steer(0, 0)}
                  onLostPointerCapture={() => runtime.current?.steer(0, 0)}
                  onBlur={() => runtime.current?.steer(0, 0)}
                  onClick={(event) => {
                    if (event.detail === 0)
                      runtime.current?.step(direction.x, direction.y)
                  }}
                >
                  <span aria-hidden="true">{direction.icon}</span>
                </Button>
              ))}
            </div>
          </details>
        </aside>
      </div>
      {status === "error" && (
        <Button
          onClick={() => {
            setStatus("loading")
            setAttempt((n) => n + 1)
          }}
        >
          {m("Reintentar")}
        </Button>
      )}
      {status !== "ready" && (
        <p role="status" className="text-sm text-muted-foreground">
          {m(
            status === "loading"
              ? "Cargando el juego…"
              : "No pudimos cargar el juego. Reintenta."
          )}
        </p>
      )}
    </div>
  )
}
