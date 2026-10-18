import { useEffect, useRef, useState } from "react"
import type { NurseryRun } from "@amautai/contracts"
import { roomsApi } from "../api/rooms-api"
import { roomError } from "./use-rooms"
export function useNurseryRun(room: string, participant: string) {
  const [revision, setRevision] = useState(0),
    [resource, setResource] = useState<{
      key: string
      run: NurseryRun | null
      error: string
    }>({ key: "", run: null, error: "" })
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  const key = room + ":" + participant + ":" + revision
  const active = useRef(""),
    lock = useRef(false)
  useEffect(() => {
    active.current = key
    const c = new AbortController()
    roomsApi
      .nurseryStart(room, participant, c.signal)
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
  }, [key, room, participant])
  const run = resource.key === key ? resource.run : null
  async function act(
    kind: "answer" | "help" | "retry",
    answer?: { trays: number; units: number }
  ) {
    if (lock.current || !run) return
    lock.current = true
    setBusy(true)
    setError("")
    try {
      const result = await roomsApi.nurseryAction(
        room,
        participant,
        run.participant.version,
        kind,
        answer
      )
      if (active.current === key) setResource({ key, run: result, error: "" })
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
    error: error || (resource.key === key ? resource.error : ""),
    answer: (n: { trays: number; units: number }) => void act("answer", n),
    help: () => void act("help"),
    restart: () => void act("retry"),
    reload: () => {
      setError("")
      setRevision((n) => n + 1)
    },
  }
}
