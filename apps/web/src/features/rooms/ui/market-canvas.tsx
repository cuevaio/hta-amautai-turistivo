import type { ReactNode } from "react"
import { GameStatus } from "./game-status"
import { useEffect, useMemo, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import type { MarketZone } from "@/game-runtime/market-controls"
import type { CargoRegion } from "@amautai/contracts"
import type { MarketFrame, MarketRuntime } from "@/game-runtime/market-route"
import { useMessages } from "@/shared/i18n/use-messages"
import { Button } from "@workspace/ui/components/button"
export function MarketCanvas({
  mission,
  tools,
  region,
  quantity,
  stop,
  task,
  operation,
  enabled,
  remaining,
  zone,
  onZone,
  onTransfer,
  onCheckout,
  score,
  lives,
  streak,
  feedbackKind,
  feedbackVersion,
  feedbackText,
}: {
  mission: ReactNode
  tools: ReactNode
  region: CargoRegion
  quantity: number
  stop: number
  task: number
  operation: "+" | "−"
  enabled: boolean
  remaining: number
  zone: MarketZone
  onZone: (zone: MarketZone) => void
  onTransfer: (amount: number) => void
  onCheckout: () => void
  score: number
  lives: number
  streak: number
  feedbackKind: string
  feedbackVersion: number
  feedbackText: string
}) {
  const { m, locale } = useMessages(),
    host = useRef<HTMLDivElement>(null),
    runtime = useRef<MarketRuntime | null>(null),
    reduced = !!useReducedMotion(),
    callback = useRef(onTransfer),
    zoneCallback = useRef(onZone),
    checkoutCallback = useRef(onCheckout),
    pointers = useRef(new Map<number, { x: number; y: number }>())
  useEffect(() => {
    callback.current = onTransfer
    zoneCallback.current = onZone
    checkoutCallback.current = onCheckout
  }, [onTransfer, onZone, onCheckout])
  const [status, setStatus] = useState("loading"),
    [attempt, setAttempt] = useState(0)
  const cargo = m("Tu carga"),
    source = m("Almacén"),
    destination = m("Mercado")
  const scoreLabel = m("Puntos: {{score}}", {
      score: new Intl.NumberFormat(locale).format(score),
    }),
    livesLabel = m("Oportunidades: {{lives}}", { lives }),
    streakLabel = m("Racha: {{count}}", { count: streak }),
    winLabel = m("¡Ganaste!")
  const frame = useMemo<MarketFrame>(
    () => ({
      quantity,
      stop,
      task,
      operation,
      enabled,
      remaining,
      cargo,
      source,
      destination,
      scoreLabel,
      livesLabel,
      streakLabel,
      winLabel,
      feedbackText,
      feedbackVersion,
      feedbackKind,
    }),
    [
      quantity,
      stop,
      task,
      operation,
      enabled,
      remaining,
      cargo,
      source,
      destination,
      scoreLabel,
      livesLabel,
      streakLabel,
      winLabel,
      feedbackText,
      feedbackVersion,
      feedbackKind,
    ]
  )
  useEffect(() => {
    if (!enabled) {
      pointers.current.clear()
      runtime.current?.steer(0, 0)
    }
  }, [enabled])
  const latest = useRef(frame)
  useEffect(() => {
    latest.current = frame
    runtime.current?.sync(frame)
  }, [frame])
  useEffect(() => {
    let disposed = false,
      instance: MarketRuntime | undefined
    const target = host.current
    if (!target) return
    const activePointers = pointers.current
    const clear = () => {
      activePointers.clear()
      runtime.current?.steer(0, 0)
    }
    const hide = () => {
      if (document.hidden) clear()
    }
    window.addEventListener("blur", clear)
    document.addEventListener("visibilitychange", hide)
    import("@/game-runtime/market-route")
      .then(({ createMarketGame }) => {
        if (disposed) return
        instance = createMarketGame(target, {
          region,
          reduced,
          transfer: (n) => callback.current(n),
          checkout: () => checkoutCallback.current(),
          zone: (zone) => zoneCallback.current(zone),
          ready: () => {
            if (!disposed) {
              target
                .querySelector("canvas")
                ?.setAttribute("aria-hidden", "true")
              setStatus("ready")
              target.focus({ preventScroll: true })
              runtime.current?.sync(latest.current)
            }
          },
          error: () => {
            if (!disposed) setStatus("error")
          },
        })
        runtime.current = instance
      })
      .catch(() => {
        if (!disposed) setStatus("error")
      })
    return () => {
      window.removeEventListener("blur", clear)
      document.removeEventListener("visibilitychange", hide)
      activePointers.clear()
      disposed = true
      runtime.current = null
      instance?.destroy()
    }
  }, [region, reduced, attempt])
  const steer = () => {
    const held = [...pointers.current.values()]
    runtime.current?.steer(
      held.reduce((n, p) => n + p.x, 0),
      held.reduce((n, p) => n + p.y, 0)
    )
  }
  const near = zone === "source"
  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {scoreLabel}. {livesLabel}. {streakLabel}.{" "}
        {feedbackKind === "correct" ? winLabel : ""} {feedbackText}
      </p>
      <GameStatus
        score={score}
        lives={lives}
        detail={{ label: m("Racha"), value: streak }}
      />
      <div className="grid bg-background lg:grid-cols-[minmax(0,1fr)_17rem] lg:grid-rows-[auto_1fr]">
        <div className="space-y-2 p-4 pb-0 sm:p-5 sm:pb-0 lg:col-start-2 lg:row-start-1 lg:border-l">
          {mission}
        </div>
        <div className="mt-4 min-w-0 self-start bg-[#183d3b] lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-0">
          <div
            ref={host}
            tabIndex={0}
            role="group"
            aria-label={m("Zona de conducción: usa las flechas o WASD.")}
            aria-describedby="market-driving-help"
            className="relative aspect-[120/61] w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring [&_canvas]:block [&_canvas]:max-w-full"
          />
          <p className="border-t bg-background px-4 py-2.5 text-sm font-medium tabular-nums">
            {m("Llevas ahora: {{count}}", {
              count: new Intl.NumberFormat(locale).format(quantity),
            })}
          </p>
        </div>
        <aside className="flex min-w-0 flex-col gap-4 border-t p-4 sm:p-5 lg:col-start-2 lg:row-start-2 lg:border-t-0 lg:border-l">
          <div className="space-y-3 border-t pt-4">
            <p
              id="market-driving-help"
              role="status"
              className="text-sm leading-relaxed text-muted-foreground"
            >
              {m(
                !enabled
                  ? "Guardando o esperando conexión…"
                  : near
                    ? "Elige cuánto mover. Después toca el mercado para entregar."
                    : zone === "market"
                      ? "Sal del mercado para preparar tu próxima entrega."
                      : "Toca el almacén para preparar tu carga; después ve al mercado."
              )}
            </p>
            <div
              role="group"
              aria-label={m("Controles de conducción")}
              className="grid grid-cols-3 gap-1"
            >
              {[
                {
                  x: 0,
                  y: -1,
                  icon: "↑",
                  label: "Mover hacia arriba",
                  cell: "col-start-2 row-start-1",
                },
                {
                  x: -1,
                  y: 0,
                  icon: "←",
                  label: "Mover a la izquierda",
                  cell: "col-start-1 row-start-2",
                },
                {
                  x: 0,
                  y: 1,
                  icon: "↓",
                  label: "Mover hacia abajo",
                  cell: "col-start-2 row-start-2",
                },
                {
                  x: 1,
                  y: 0,
                  icon: "→",
                  label: "Mover a la derecha",
                  cell: "col-start-3 row-start-2",
                },
              ].map((direction) => (
                <Button
                  key={direction.label}
                  type="button"
                  variant="outline"
                  size="icon"
                  className={"size-12 touch-none select-none " + direction.cell}
                  aria-label={m(direction.label)}
                  disabled={!enabled || status !== "ready"}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.currentTarget.setPointerCapture(e.pointerId)
                    pointers.current.set(e.pointerId, direction)
                    steer()
                  }}
                  onPointerUp={(e) => {
                    pointers.current.delete(e.pointerId)
                    steer()
                  }}
                  onPointerCancel={(e) => {
                    pointers.current.delete(e.pointerId)
                    steer()
                  }}
                  onLostPointerCapture={(e) => {
                    pointers.current.delete(e.pointerId)
                    steer()
                  }}
                  onBlur={() => {
                    pointers.current.clear()
                    runtime.current?.steer(0, 0)
                  }}
                  onClick={(e) => {
                    if (e.detail === 0)
                      runtime.current?.step(direction.x, direction.y)
                  }}
                >
                  <span aria-hidden="true">{direction.icon}</span>
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={
                  !enabled || !near || remaining < 1 || status !== "ready"
                }
                onClick={() => runtime.current?.interact(1)}
              >
                {m(operation === "+" ? "Recoger 1" : "Dejar 1")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={
                  !enabled || !near || remaining < 10 || status !== "ready"
                }
                onClick={() => runtime.current?.interact(10)}
              >
                {m(operation === "+" ? "Recoger 10" : "Dejar 10")}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">{tools}</div>
        </aside>
      </div>
      {status !== "ready" && (
        <div className="p-3" role="status">
          {m(
            status === "loading"
              ? "Cargando el juego…"
              : "No pudimos cargar el juego. Reintenta."
          )}
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
        </div>
      )}
    </>
  )
}
