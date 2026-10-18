import { createContext, useContext, useMemo } from "react"
import type { ReactNode } from "react"
import { createRoomsApi, roomsApi } from "../api/rooms-api"
const GameApiContext = createContext(roomsApi)
export function AssignedGameProvider({
  token,
  children,
}: {
  token: string
  children: ReactNode
}) {
  const api = useMemo(() => createRoomsApi(token), [token])
  return <GameApiContext value={api}>{children}</GameApiContext>
}
export function useGameApi() {
  return useContext(GameApiContext)
}
