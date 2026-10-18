import { useEffect, useRef, useState } from "react"
import type {
  CargoRegion,
  FamilyChild,
  FamilyGameKind,
  FamilyGameSession,
} from "@amautai/contracts"
import { ApiError } from "@/shared/api/client"
import { familyGamesApi } from "../api/family-games-api"
const errors: Record<string, string> = {
  duplicate_child: "Ya tienes un hijo con ese nombre o apodo.",
  child_not_found: "No encontramos este perfil. Actualiza la lista.",
  family_limit: "Puedes guardar hasta 20 perfiles de hijos.",
  family_conflict:
    "El perfil o la partida cambió. Actualiza antes de continuar.",
  invalid_family_game: "Revisa el nombre y el contexto elegidos.",
  invalid_room_input: "Escribe un nombre válido de hasta 80 caracteres.",
  profile_role_required: "Este espacio está disponible para padres y madres.",
}
function message(e: unknown) {
  return (
    (e instanceof ApiError && e.code && errors[e.code]) ||
    "No pudimos completar la solicitud. Inténtalo de nuevo."
  )
}
export function useFamilyGames() {
  const [revision, setRevision] = useState(0)
  const [resource, setResource] = useState<{
    revision: number
    children: FamilyChild[]
    games: FamilyGameSession[]
    error: string
  }>({ revision: -1, children: [], games: [], error: "" })
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const alive = useRef(true),
    lock = useRef(false)
  const request = useRef<{ key: string; id: string } | null>(null)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    familyGamesApi
      .overview(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setResource({ revision, ...data, error: "" })
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setResource((r) => ({ ...r, revision, error: message(e) }))
      })
    return () => controller.abort()
  }, [revision])
  async function action(run: () => Promise<void>) {
    if (lock.current) return false
    lock.current = true
    setBusy(true)
    setError("")
    try {
      await run()
      return true
    } catch (e) {
      if (alive.current) setError(message(e))
      return false
    } finally {
      lock.current = false
      if (alive.current) setBusy(false)
    }
  }
  return {
    ...resource,
    loadError: resource.error,
    error: error || resource.error,
    clearError: () => setError(""),
    loading: revision !== resource.revision,
    busy,
    refresh: () => {
      setError("")
      setRevision((n) => n + 1)
    },
    saveChild: (
      name: string,
      region: CargoRegion,
      child?: FamilyChild,
      onSaved?: (child: FamilyChild) => void
    ) =>
      action(async () => {
        const result = await familyGamesApi.saveChild(name, region, child)
        if (alive.current) {
          onSaved?.(result.child)
          setRevision((n) => n + 1)
        }
      }),
    remove: (id: string) =>
      action(async () => {
        await familyGamesApi.remove(id)
        if (alive.current) setRevision((n) => n + 1)
      }),
    create: (
      childId: string,
      kind: FamilyGameKind,
      onCreated: (game: FamilyGameSession) => void
    ) =>
      action(async () => {
        const key = childId + ":" + kind
        if (request.current?.key !== key)
          request.current = { key, id: crypto.randomUUID() }
        const { game } = await familyGamesApi.create(
          childId,
          kind,
          request.current.id
        )
        if (alive.current) {
          request.current = null
          onCreated(game)
        }
      }),
  }
}
