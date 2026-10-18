import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { Undo2, CircleHelp } from "lucide-react"
import type { CargoRegion } from "@amautai/contracts"
import type { FairFrame, FairRuntime } from "@/game-runtime/equality-fair"
import { fairLayout } from "@/game-runtime/fair-stations"
import { useMessages } from "@/shared/i18n/use-messages"
import { Button } from "@workspace/ui/components/button"
export function FairCanvas({
  region,
  frame,
  onSelect,
  onDeliver,
  onUndo,
  onHelp,
  helped,
}: {
  region: CargoRegion
  frame: FairFrame
  onSelect: (n: number) => void
  onDeliver: () => void
  onUndo: () => void
  onHelp: () => void
  helped: boolean
}) {
  const { m } = useMessages(),
    reduced = !!useReducedMotion()
  const outer = useRef<HTMLDivElement>(null),
    host = useRef<HTMLDivElement>(null)
  const runtime = useRef<FairRuntime | null>(null),
    latest = useRef(frame)
  const callbacks = useRef({ onSelect, onDeliver, onUndo })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const [compact, setCompact] = useState(() => window.innerWidth < 768)
  const [retry, setRetry] = useState(0),
    [resource, setResource] = useState({ key: "", status: "loading" })
  const key = [region, compact, reduced, retry].join(":"),
    l = fairLayout(compact)
  const status = resource.key === key ? resource.status : "loading"
  useEffect(() => {
    callbacks.current = { onSelect, onDeliver, onUndo }
  }, [onSelect, onDeliver, onUndo])
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
    const target = host.current,
      active = pointers.current
    if (!target) return
    let disposed = false,
      instance: FairRuntime | undefined
    const clear = () => {
      active.clear()
      runtime.current?.steer(0, 0)
    }
    const hidden = () => {
      if (document.hidden) clear()
    }
    window.addEventListener("blur", clear)
    document.addEventListener("visibilitychange", hidden)
    import("@/game-runtime/equality-fair")
      .then(({ createFairGame }) => {
        if (disposed) return
        instance = createFairGame(target, {
          region,
          compact,
          reduced,
          select: (n) => callbacks.current.onSelect(n),
          deliver: () => callbacks.current.onDeliver(),
          undo: () => callbacks.current.onUndo(),
          ready: () => {
            if (!disposed) {
              setResource({ key, status: "ready" })
              runtime.current?.sync(latest.current)
              target.focus({ preventScroll: true })
            }
          },
          error: () => {
            if (!disposed) setResource({ key, status: "error" })
          },
        })
        runtime.current = instance
        instance.sync(latest.current)
      })
      .catch(() => {
        if (!disposed) setResource({ key, status: "error" })
      })
    return () => {
      disposed = true
      active.clear()
      runtime.current = null
      instance?.destroy()
      window.removeEventListener("blur", clear)
      document.removeEventListener("visibilitychange", hidden)
    }
  }, [region, compact, reduced, retry, key])
  const focus = () => host.current?.focus({ preventScroll: true })
  const steer = () => {
    const held = [...pointers.current.values()]
    runtime.current?.steer(
      held.reduce((n, p) => n + p.x, 0),
      held.reduce((n, p) => n + p.y, 0)
    )
  }
  const ready = frame.enabled && status === "ready"
  return (
    <div ref={outer} className="w-full">
      <div
        className="relative mx-auto overflow-hidden rounded-2xl border border-[#608771] bg-[#123c32] shadow-lg"
        style={{
          aspectRatio: `${l.width}/${l.height}`,
          maxWidth: compact ? undefined : "calc(72svh * 1.219512)",
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
        {l.supplies.map((p, i) => (
          <button
            key={i}
            type="button"
            aria-label={m("Recoger paquete de {{count}}", {
              count: frame.task.choices[i]!,
            })}
            disabled={!ready}
            className="absolute cursor-pointer rounded-lg border-0 bg-transparent p-0 focus-visible:outline-4 focus-visible:outline-[#f0d18d] disabled:cursor-default"
            style={{
              left: `${((p.x - l.cardWidth / 2) / l.width) * 100}%`,
              top: `${(l.supplyTop / l.height) * 100}%`,
              width: `${(l.cardWidth / l.width) * 100}%`,
              height: `${((p.y - l.supplyTop + 25) / l.height) * 100}%`,
            }}
            onClick={() => {
              focus()
              runtime.current?.visit(i as 0 | 1 | 2)
            }}
          />
        ))}
        <button
          type="button"
          aria-label={frame.delivery}
          disabled={!ready || frame.selected === null}
          className="absolute cursor-pointer rounded-xl border-0 bg-transparent p-0 focus-visible:outline-4 focus-visible:outline-[#f0d18d] disabled:cursor-default"
          style={{
            left: `${((l.delivery.x - (compact ? 125 : 140)) / l.width) * 100}%`,
            top: `${(245 / l.height) * 100}%`,
            width: `${((compact ? 250 : 280) / l.width) * 100}%`,
            height: `${((l.delivery.y - 220) / l.height) * 100}%`,
          }}
          onClick={() => {
            focus()
            runtime.current?.visit("delivery")
          }}
        />
        <div className="absolute right-3 bottom-3 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-[#f5edd8] text-[#234c40] hover:bg-[#fff7e2]"
            aria-label={m("Deshacer")}
            title={m("Deshacer")}
            disabled={!ready || frame.selected === null}
            onClick={() => {
              focus()
              runtime.current?.undo()
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
            disabled={!ready || helped}
            onClick={() => {
              focus()
              onHelp()
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
            role={status === "error" ? "alert" : "status"}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#123c32] p-6 text-center text-[#f5edd8]"
          >
            <p>
              {m(
                status === "error"
                  ? "No pudimos cargar el juego. Reintenta."
                  : "Cargando el juego…"
              )}
            </p>
            {status === "error" && (
              <Button onClick={() => setRetry((n) => n + 1)}>
                {m("Reintentar")}
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="sr-only">
        {frame.mission}. {frame.equation}. {frame.hint}
      </p>
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {frame.carrying}: {frame.selected ?? "—"}.
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
