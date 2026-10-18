import { api } from "@/shared/api/client"
import type {
  CargoRoom,
  CargoParticipant,
  CargoRegion,
  CargoRun,
  CargoAnswer,
} from "@amautai/contracts"
const path = (room: string, id?: string) =>
  "/api/game-rooms/" +
  encodeURIComponent(room) +
  (id ? "/participants/" + encodeURIComponent(id) : "")
export const roomsApi = {
  list: (signal?: AbortSignal) =>
    api<{ rooms: CargoRoom[] }>("/api/game-rooms", { signal }),
  detail: (room: string, signal?: AbortSignal) =>
    api<{ room: CargoRoom; participants: CargoParticipant[] }>(path(room), {
      signal,
    }),
  create: (region: CargoRegion) =>
    api<{ room: CargoRoom }>("/api/game-rooms", {
      method: "POST",
      body: JSON.stringify({ region }),
    }),
  add: (room: string, name: string) =>
    api(path(room) + "/participants", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  remove: (room: string, id: string) =>
    api(path(room, id), { method: "DELETE" }),
  start: (room: string, id: string, signal?: AbortSignal) =>
    api<CargoRun>(path(room, id) + "/start", { method: "POST", signal }),
  collect: (room: string, id: string, version: number, value: number) =>
    api<CargoAnswer>(path(room, id) + "/collect", {
      method: "POST",
      body: JSON.stringify({ version, value }),
    }),
  pause: (room: string, id: string, version: number, paused: boolean) =>
    api<CargoAnswer>(path(room, id) + "/pause", {
      method: "POST",
      body: JSON.stringify({ version, paused }),
    }),
  retry: (room: string, id: string) =>
    api<CargoRun>(path(room, id) + "/retry", { method: "POST" }),
}
