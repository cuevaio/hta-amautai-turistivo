import { useEffect, useRef, useState } from "react"
import type { BuilderRun, BuilderPlacement } from "@amautai/contracts"
import { useGameApi } from "./game-api-context"
import { roomError } from "./use-rooms"
export function useBuilderRun(room: string, participant: string) {
  const roomsApi = useGameApi()
  const [revision, setRevision] = useState(0),
    [resource, setResource] = useState<{
      key: string
      run: BuilderRun | null
      error: string
    }>({ key: "", run: null, error: "" })
  const [completed, setCompleted] = useState<BuilderRun["task"] | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  const key = room + ":" + participant + ":" + revision
  const active = useRef(""),
    lock = useRef(false)
  useEffect(() => {
    active.current = key
    const c = new AbortController()
    roomsApi
      .builderStart(room, participant, c.signal)
      .then((run) => {
        if (!c.signal.aborted) setResource({ key, run, error: "" })
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setResource({ key, run: null, error: roomError(e) })
      })
    return () => {
      c.abort()
      active.current = ""
    }
  }, [key, room, participant, roomsApi])
  const run = resource.key === key ? resource.run : null
  async function act(
    kind: "answer" | "help" | "retry",
    answer?: BuilderPlacement
  ) {
    if (lock.current || !run) return
    lock.current = true
    setBusy(true)
    setError("")
    try {
      const result = await roomsApi.builderAction(
        room,
        participant,
        run.participant.version,
        kind,
        answer
      )
      if (active.current === key) {
        if (result.feedback === "correct") {
          setCompleted({ ...run.task, cursor: 3 })
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(() => setCompleted(null), 1600)
        }
        setResource({ key, run: result, error: "" })
      }
    } catch (e) {
      if (active.current === key) setError(roomError(e))
    } finally {
      lock.current = false
      if (active.current === key) setBusy(false)
    }
  }
  return {
    run,
    completed,
    busy,
    error: error || (resource.key === key ? resource.error : ""),
    answer: (n: BuilderPlacement) => void act("answer", n),
    help: () => void act("help"),
    restart: () => void act("retry"),
    reload: () => {
      setError("")
      setRevision((n) => n + 1)
    },
  }
}
