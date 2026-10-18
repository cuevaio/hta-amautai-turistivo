import { useEffect, useRef, useState } from "react"
import type { CargoRun } from "@amautai/contracts"
import { useGameApi } from "./game-api-context"
import { roomError } from "./use-rooms"
export function useCargoRun(room: string, participant: string) {
  const roomsApi = useGameApi()
  const [revision, setRevision] = useState(0)
  const key = room + ":" + participant + ":" + revision
  const [resource, setResource] = useState<{
    key: string
    run: CargoRun | null
    error: string
  }>({ key: "", run: null, error: "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "win" | "">("")
  const lock = useRef(false),
    active = useRef(key)
  useEffect(() => {
    active.current = key
    return () => {
      active.current = ""
    }
  }, [key])
  useEffect(() => {
    const c = new AbortController()
    roomsApi
      .start(room, participant, c.signal)
      .then((run) => {
        if (!c.signal.aborted) setResource({ key, run, error: "" })
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setResource({ key, run: null, error: roomError(e) })
      })
    return () => c.abort()
  }, [room, participant, key, roomsApi])
  const run = resource.key === key ? resource.run : null
  async function perform(kind: "collect" | "pause" | "retry", value = 0) {
    if (lock.current || !run) return
    lock.current = true
    setBusy(true)
    setError("")
    try {
      const result =
        kind === "collect"
          ? await roomsApi.collect(
              room,
              participant,
              run.participant.version,
              value
            )
          : kind === "pause"
            ? await roomsApi.pause(
                room,
                participant,
                run.participant.version,
                !run.participant.paused
              )
            : await roomsApi.retry(room, participant)
      if (active.current !== key) return
      setResource({ key, run: { ...run, ...result }, error: "" })
      if (kind === "collect")
        setFeedback(
          result.participant.solved > run.participant.solved
            ? "win"
            : result.participant.mistakes > run.participant.mistakes
              ? "wrong"
              : "correct"
        )
      else setFeedback("")
    } catch (e) {
      if (active.current === key) setError(roomError(e))
    } finally {
      lock.current = false
      if (active.current === key) setBusy(false)
    }
  }
  return {
    run,
    busy,
    error,
    feedback,
    loadError: resource.key === key ? resource.error : "",
    collect: (value: number | null) => {
      if (value !== null) void perform("collect", value)
    },
    togglePause: () => void perform("pause"),
    restart: () => void perform("retry"),
    retry: () => {
      setError("")
      setRevision((n) => n + 1)
    },
  }
}
