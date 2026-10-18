import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { CircleHelp, RotateCw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import type { CargoRegion, BuilderPlacement } from "@amautai/contracts"
import type { BuilderFrame, BuilderRuntime } from "@/game-runtime/builders"
import {
  builderLayout,
  builderDropAt,
  builderPoint,
} from "@/game-runtime/builder-geometry"
import { useMessages } from "@/shared/i18n/use-messages"
type Copy = {
  score: string
  lives: string
  mission: string
  progress: string
  instruction: string
  feedback: string
  target: string
  names: string[]
}
export function BuilderCanvas({
  region,
  frame,
  copy,
  helped,
  onSelect,
  onPlace,
  onHelp,
}: {
  region: CargoRegion
  frame: BuilderFrame
  copy: Copy
  helped: boolean
  onSelect: (p: BuilderPlacement) => void
  onPlace: (p: BuilderPlacement) => void
  onHelp: () => void
}) {
  const { m } = useMessages(),
    reduced = !!useReducedMotion(),
    host = useRef<HTMLDivElement>(null),
    outer = useRef<HTMLDivElement>(null),
    runtime = useRef<BuilderRuntime | null>(null),
    latest = useRef(frame)
  const [compact, setCompact] = useState(() => window.innerWidth < 768),
    [retry, setRetry] = useState(0),
    [resource, setResource] = useState({ key: "", status: "loading" })
  const key = [region, compact, reduced, retry].join(":"),
    status = resource.key === key ? resource.status : "loading",
    l = builderLayout(compact)
  const gesture = useRef<{
    pointer: number
    x: number
    y: number
    piece: BuilderPlacement
    task: number
    cursor: number
    moved: boolean
  } | null>(null)
  useEffect(() => {
    latest.current = frame
    runtime.current?.sync(frame)
    if (!frame.enabled) {
      gesture.current = null
      runtime.current?.drag(null)
    }
  }, [frame])
  useEffect(() => {
    if (!outer.current) return
    const observer = new ResizeObserver(([e]) => {
      if (e) setCompact(e.contentRect.width < 680)
    })
    observer.observe(outer.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const element = host.current
    if (!element) return
    let disposed = false,
      instance: BuilderRuntime | undefined
    const clear = () => {
      gesture.current = null
      runtime.current?.drag(null)
    }
    const hidden = () => {
      if (document.hidden) clear()
    }
    window.addEventListener("blur", clear)
    document.addEventListener("visibilitychange", hidden)
    import("@/game-runtime/builders")
      .then(({ createBuilderGame }) => {
        if (disposed) return
        instance = createBuilderGame(element, {
          region,
          compact,
          reduced,
          ready: () => {
            if (!disposed) setResource({ key, status: "ready" })
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
      gesture.current = null
      runtime.current = null
      instance?.destroy()
      window.removeEventListener("blur", clear)
      document.removeEventListener("visibilitychange", hidden)
    }
  }, [region, compact, reduced, retry, key])
  const ready = frame.enabled && status === "ready",
    s = l.slots[frame.task.cursor]
  return (
    <div ref={outer} className="w-full">
      <div
        className="relative mx-auto overflow-hidden rounded-2xl border border-[#b8a076] bg-[#eee2c3] shadow-lg"
        style={{
          aspectRatio: `${l.width}/${l.height}`,
          maxWidth: compact ? undefined : "calc(78svh * 1.111111)",
          containerType: "inline-size",
        }}
      >
        <div ref={host} className="absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-x-3 top-2 flex items-center justify-between gap-2 rounded-lg bg-[#174b3d] px-3 py-2 font-semibold text-[#fff3d6]"
          style={{ fontSize: "clamp(14px,2.5cqw,23px)" }}
        >
          <span>{copy.score}</span>
          <span>{copy.lives}</span>
        </div>
        <div
          className="pointer-events-none absolute inset-x-[3%] flex flex-col items-center justify-center gap-1 rounded-xl border border-[#c4ad7d] bg-[#fff9e9] px-3 text-center text-[#244e40]"
          style={{
            top: `${(70 / l.height) * 100}%`,
            height: `${((compact ? 140 : 105) / l.height) * 100}%`,
          }}
        >
          <p
            className="font-semibold"
            style={{
              fontSize: compact
                ? "clamp(14px,3.4cqw,22px)"
                : "clamp(16px,2.7cqw,26px)",
              lineHeight: 1.25,
            }}
          >
            {frame.complete ? m("¡Construcción terminada!") : copy.mission}
          </p>
          <p className="text-sm">
            {frame.complete ? copy.feedback : copy.progress}
          </p>
        </div>
        {s && !frame.complete && (
          <button
            type="button"
            disabled={!ready || !frame.selected}
            aria-label={copy.target}
            className="absolute rounded-lg border-0 bg-transparent p-0 focus-visible:outline-4 focus-visible:outline-[#955c22] disabled:cursor-default"
            style={{
              left: `${((s.x - Math.max(60, s.w / 2 + 12)) / l.width) * 100}%`,
              top: `${((s.y - Math.max(60, s.h / 2 + 12)) / l.height) * 100}%`,
              width: `${(Math.max(120, s.w + 24) / l.width) * 100}%`,
              height: `${(Math.max(120, s.h + 24) / l.height) * 100}%`,
            }}
            onClick={() => {
              if (ready && frame.selected) onPlace(frame.selected)
            }}
          />
        )}
        {l.pieces.map((p, i) => {
          const piece = frame.task.pieces[i]!
          return (
            <button
              key={piece.shape}
              type="button"
              disabled={!ready}
              aria-label={m("Elegir {{shape}}", { shape: copy.names[i]! })}
              aria-pressed={frame.selected?.shape === piece.shape}
              className="absolute touch-none rounded-xl border-0 bg-transparent p-0 select-none focus-visible:outline-4 focus-visible:outline-[#174b3d]"
              style={{
                left: `${((p.x - l.pieceWidth / 2) / l.width) * 100}%`,
                top: `${((p.y - 74) / l.height) * 100}%`,
                width: `${(l.pieceWidth / l.width) * 100}%`,
                height: `${(l.pieceHeight / l.height) * 100}%`,
              }}
              onPointerDown={(e) => {
                if (!ready) return
                e.preventDefault()
                e.currentTarget.setPointerCapture(e.pointerId)
                const picked =
                  frame.selected?.shape === piece.shape ? frame.selected : piece
                gesture.current = {
                  pointer: e.pointerId,
                  x: e.clientX,
                  y: e.clientY,
                  piece: picked,
                  task: frame.task.id,
                  cursor: frame.task.cursor,
                  moved: false,
                }
                onSelect(picked)
              }}
              onPointerMove={(e) => {
                const g = gesture.current
                if (!g || g.pointer !== e.pointerId || !latest.current.enabled)
                  return
                if (Math.hypot(e.clientX - g.x, e.clientY - g.y) > 8)
                  g.moved = true
                if (g.moved && host.current)
                  runtime.current?.drag(
                    builderPoint(
                      e.clientX,
                      e.clientY,
                      host.current.getBoundingClientRect(),
                      compact
                    ),
                    g.piece
                  )
              }}
              onPointerUp={(e) => {
                const g = gesture.current
                gesture.current = null
                runtime.current?.drag(null)
                if (
                  !g ||
                  !g.moved ||
                  !latest.current.enabled ||
                  g.task !== latest.current.task.id ||
                  g.cursor !== latest.current.task.cursor ||
                  !host.current
                )
                  return
                const at = builderPoint(
                  e.clientX,
                  e.clientY,
                  host.current.getBoundingClientRect(),
                  compact
                )
                if (builderDropAt(at.x, at.y, g.cursor, compact))
                  onPlace(g.piece)
              }}
              onPointerCancel={() => {
                gesture.current = null
                runtime.current?.drag(null)
              }}
              onLostPointerCapture={() => {
                gesture.current = null
                runtime.current?.drag(null)
              }}
              onClick={(e) => {
                if (e.detail === 0 && ready)
                  onSelect(
                    frame.selected?.shape === piece.shape
                      ? frame.selected
                      : piece
                  )
              }}
            >
              <span
                className="pointer-events-none absolute inset-x-1 bottom-1 font-semibold whitespace-nowrap text-[#244e40]"
                style={{
                  fontSize: compact
                    ? "clamp(13px,3.5cqw,20px)"
                    : "clamp(14px,2.3cqw,22px)",
                }}
              >
                {copy.names[i]}
              </span>
            </button>
          )
        })}
        <div
          className="absolute inset-x-3 flex flex-wrap items-center justify-between gap-2"
          style={{ top: `${(l.footer / l.height) * 100}%` }}
        >
          <p
            className="max-w-[65%] rounded-lg bg-[#fff9e9]/95 px-2 py-1 text-sm text-[#244e40]"
            role="status"
          >
            {copy.instruction}
          </p>
          <div className="flex gap-2">
            {frame.task.rotatable && (
              <Button
                size="icon"
                variant="outline"
                className="size-11 border-[#809a7b] bg-[#fff9e9] text-[#244e40] hover:bg-[#ffedbe]"
                aria-label={m("Girar figura")}
                title={m("Girar figura")}
                disabled={!ready || !frame.selected}
                onClick={() => {
                  if (frame.selected)
                    onSelect({
                      ...frame.selected,
                      rotation: (frame.selected.rotation + 1) % 4,
                    })
                }}
              >
                <RotateCw />
              </Button>
            )}
            <Button
              size="icon"
              variant="outline"
              className="size-11 border-[#809a7b] bg-[#fff9e9] text-[#244e40] hover:bg-[#ffedbe]"
              aria-label={m("Ver ayuda")}
              title={m("Ver ayuda")}
              disabled={!ready || helped}
              onClick={onHelp}
            >
              <CircleHelp />
            </Button>
          </div>
        </div>
        {status !== "ready" && (
          <div
            role={status === "error" ? "alert" : "status"}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#174b3d] p-5 text-center text-[#fff3d6]"
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
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {copy.mission}. {copy.progress}. {copy.score}. {copy.lives}.{" "}
        {copy.feedback}
      </p>
    </div>
  )
}
