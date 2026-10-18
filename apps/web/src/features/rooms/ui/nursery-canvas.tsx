import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { Undo2, CircleHelp } from "lucide-react"
import type { CargoRegion } from "@amautai/contracts"
import type {
  NurseryFrame,
  NurseryRuntime,
  NurseryCommand,
} from "@/game-runtime/nursery"
import {
  nurseryLayout,
  nurseryStationEnabled,
} from "@/game-runtime/nursery-stations"
import type { NurseryStation } from "@/game-runtime/nursery-stations"
import { useMessages } from "@/shared/i18n/use-messages"
import { Button } from "@workspace/ui/components/button"
export function NurseryCanvas({
  region,
  frame,
  onAction,
  onDeliver,
  onUndo,
  onHelp,
  helped,
}: {
  region: CargoRegion
  frame: NurseryFrame
  onAction: (command: NurseryCommand) => void
  onDeliver: () => void
  onUndo: () => void
  onHelp: () => void
  helped: boolean
}) {
  const { m } = useMessages(),
    reduced = !!useReducedMotion()
  const outer = useRef<HTMLDivElement>(null),
    host = useRef<HTMLDivElement>(null),
    runtime = useRef<NurseryRuntime | null>(null)
  const [compact, setCompact] = useState(() => window.innerWidth < 768),
    [resourceStatus, setStatus] = useState({ key: "", value: "loading" }),
    [retry, setRetry] = useState(0)
  const callbacks = useRef({ onAction, onDeliver, onUndo }),
    latest = useRef(frame),
    pointers = useRef(new Map<number, { x: number; y: number }>())
  const runtimeKey = [region, compact, reduced, retry].join(":")
  const status =
    resourceStatus.key === runtimeKey ? resourceStatus.value : "loading"
  const layout = nurseryLayout(compact)
  useEffect(() => {
    callbacks.current = { onAction, onDeliver, onUndo }
  }, [onAction, onDeliver, onUndo])
  useEffect(() => {
    latest.current = frame
    runtime.current?.sync(frame)
    if (!frame.enabled) pointers.current.clear()
  }, [frame])
  useEffect(() => {
    if (!outer.current) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setCompact(entry.contentRect.width < 680)
    })
    observer.observe(outer.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    let disposed = false,
      instance: NurseryRuntime | undefined
    const target = host.current,
      active = pointers.current
    if (!target) return
    const clear = () => {
      active.clear()
      runtime.current?.steer(0, 0)
    }
    const hide = () => {
      if (document.hidden) clear()
    }
    window.addEventListener("blur", clear)
    document.addEventListener("visibilitychange", hide)
    import("@/game-runtime/nursery")
      .then(({ createNurseryGame }) => {
        if (disposed) return
        instance = createNurseryGame(target, {
          region,
          compact,
          reduced,
          action: (c) => callbacks.current.onAction(c),
          deliver: () => callbacks.current.onDeliver(),
          undo: () => callbacks.current.onUndo(),
          ready: () => {
            if (!disposed) {
              setStatus({ key: runtimeKey, value: "ready" })
              runtime.current?.sync(latest.current)
              target.focus({ preventScroll: true })
            }
          },
          error: () => {
            if (!disposed) setStatus({ key: runtimeKey, value: "error" })
          },
        })
        runtime.current = instance
        instance.sync(latest.current)
      })
      .catch(() => {
        if (!disposed) setStatus({ key: runtimeKey, value: "error" })
      })
    return () => {
      disposed = true
      active.clear()
      runtime.current = null
      instance?.destroy()
      window.removeEventListener("blur", clear)
      document.removeEventListener("visibilitychange", hide)
    }
  }, [region, compact, reduced, retry, runtimeKey])
  const steer = () => {
    const held = [...pointers.current.values()]
    runtime.current?.steer(
      held.reduce((n, p) => n + p.x, 0),
      held.reduce((n, p) => n + p.y, 0)
    )
  }
  return (
    <div ref={outer} className="w-full">
      <div
        className="relative mx-auto overflow-hidden rounded-2xl border border-[#385f47] bg-[#133e33] shadow-lg"
        style={{
          aspectRatio: `${layout.width}/${layout.height}`,
          maxWidth: compact ? undefined : "calc(72svh * 1.447368)",
        }}
      >
        <div
          ref={host}
          tabIndex={0}
          role="group"
          aria-label={m(
            "Camina con las flechas o WASD. También puedes tocar una estación."
          )}
          className="absolute inset-0 outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-[#f0d18d]"
        />
        {(Object.keys(layout.stations) as NurseryStation[]).map((key) => {
          const p = layout.stations[key]
          return (
            <button
              key={key}
              type="button"
              aria-label={frame.stationLabels[key]}
              disabled={
                !frame.enabled ||
                status !== "ready" ||
                !nurseryStationEnabled(key, frame.trays, frame.units)
              }
              className="absolute cursor-pointer rounded-xl border-0 bg-transparent p-0 outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#f0d18d] disabled:cursor-default"
              style={{
                left: `${((p.x - layout.cardWidth / 2) / layout.width) * 100}%`,
                top: `${((p.y - 105) / layout.height) * 100}%`,
                width: `${(layout.cardWidth / layout.width) * 100}%`,
                height: `${((layout.cardHeight + 38) / layout.height) * 100}%`,
              }}
              onClick={() => {
                host.current?.focus({ preventScroll: true })
                runtime.current?.visit(key)
              }}
            >
              <span className="sr-only">{frame.stationLabels[key]}</span>
            </button>
          )
        })}
        <div
          className={`absolute flex gap-1 ${compact ? "right-3 bottom-3" : "right-4"}`}
          style={
            compact
              ? undefined
              : {
                  top: `${((layout.worldTop + layout.worldHeight - 60) / layout.height) * 100}%`,
                }
          }
        >
          <Button
            variant="ghost"
            size="icon"
            className="bg-[#f5edd8] text-[#234c40] hover:bg-[#fff7e2]"
            aria-label={m("Deshacer")}
            title={m("Deshacer")}
            disabled={!frame.enabled || !frame.canUndo || status !== "ready"}
            onClick={() => {
              runtime.current?.undo()
              host.current?.focus({ preventScroll: true })
            }}
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-[#f5edd8] text-[#234c40] hover:bg-[#fff7e2]"
            aria-label={m("Ver ayuda")}
            title={m("Ver ayuda")}
            disabled={!frame.enabled || helped || status !== "ready"}
            onClick={() => {
              onHelp()
              host.current?.focus({ preventScroll: true })
            }}
          >
            <CircleHelp className="size-4" />
          </Button>
        </div>
        {compact && (
          <div
            className="absolute bottom-3 left-3 grid grid-cols-3 gap-1"
            aria-label={m("Control de movimiento")}
          >
            {[
              ["up", 0, -1, "↑", "Mover hacia arriba"],
              ["left", -1, 0, "←", "Mover a la izquierda"],
              ["down", 0, 1, "↓", "Mover hacia abajo"],
              ["right", 1, 0, "→", "Mover a la derecha"],
            ].map(([id, x, y, icon, label]) => (
              <Button
                key={id}
                variant="outline"
                aria-label={m(String(label))}
                className={`size-11 touch-none border-[#71956f] bg-[#f7efd9] text-lg text-[#234c40] select-none hover:bg-[#fff7e2] ${id === "up" ? "col-start-2" : "row-start-2"}`}
                disabled={!frame.enabled || status !== "ready"}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.currentTarget.setPointerCapture(e.pointerId)
                  pointers.current.set(e.pointerId, {
                    x: Number(x),
                    y: Number(y),
                  })
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
                onClick={(e) => {
                  if (e.detail === 0)
                    runtime.current?.nudge(Number(x), Number(y))
                }}
              >
                {icon}
              </Button>
            ))}
          </div>
        )}
        {status !== "ready" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#133e33] p-6 text-center text-[#f5edd8]"
            role={status === "error" ? "alert" : "status"}
          >
            <p>
              {m(
                status === "error"
                  ? "No pudimos cargar el juego. Reintenta."
                  : "Cargando el juego…"
              )}
            </p>
            {status === "error" && (
              <Button
                onClick={() => {
                  setStatus({ key: runtimeKey, value: "loading" })
                  setRetry((n) => n + 1)
                }}
              >
                {m("Reintentar")}
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="sr-only">
        {frame.mission}. {frame.hint}.
      </p>
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {frame.inventory}: {frame.trays * 10 + frame.units}. {frame.tens}:{" "}
        {frame.trays}. {frame.ones}: {frame.units}.
      </p>
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {frame.score}. {frame.lives}. {frame.streak}.{" "}
        {frame.feedbackKind === "correct" ? frame.win : ""} {frame.feedback}
      </p>
    </div>
  )
}
