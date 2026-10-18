import { useEffect, useState } from "react"
import type { CargoRoom, CargoParticipant } from "@amautai/contracts"
import { useGameApi } from "./game-api-context"
import { roomError } from "./use-rooms"
export function useAssignedGame() {
  const api = useGameApi()
  const [revision, setRevision] = useState(0)
  const [resource, setResource] = useState<{
    api: typeof api
    game: { room: CargoRoom; participant: CargoParticipant } | null
    error: string
  } | null>(null)
  useEffect(() => {
    const c = new AbortController()
    api
      .assigned(c.signal)
      .then((game) => {
        if (!c.signal.aborted) setResource({ api, game, error: "" })
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setResource({ api, game: null, error: roomError(e) })
      })
    return () => c.abort()
  }, [api, revision])
  return {
    game: resource?.api === api ? resource.game : null,
    error: resource?.api === api ? resource.error : "",
    retry: () => setRevision((n) => n + 1),
  }
}
