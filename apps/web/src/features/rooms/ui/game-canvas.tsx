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
  const hud = useMemo(() => ({
    score: m("Puntos: {{score}}", { score }),
    goal: `${groupCount} × ${value} · ${caught}/${groupCount}`,
    lives: m("Oportunidades: {{lives}}", { lives: 3 - mistakes }),
    level: m("Nivel {{level}}", { level }),
    win: m("¡Ganaste!"),
    scoreValue: score,
  }), [m, score, groupCount, value, caught, mistakes, level])
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
    <div className="space-y-2">
      <div
        ref={host}
        tabIndex={0}
        className="relative aspect-[3/2] w-full touch-none overflow-hidden rounded-xl border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring [&_canvas]:block [&_canvas]:max-w-full"
        role="group"
        aria-describedby="flight-help"
        aria-label={m(
          "Zona de vuelo: recoge los grupos de alimento indicados."
        )}
      />
      <p className="sr-only" aria-live="polite">{hud.score}. {hud.goal}. {hud.lives}. {hud.level}.</p>
      <p id="flight-help" className="sr-only">
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
      {status === "error" && (
        <Button onClick={() => { setStatus("loading"); setAttempt((n) => n + 1) }}>{m("Reintentar")}</Button>
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
