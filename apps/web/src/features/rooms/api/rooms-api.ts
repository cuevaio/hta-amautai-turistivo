import { api } from "@/shared/api/client"
import type {
  NurseryRun,
  MarketRun,
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
  nurseryStart: (room: string, id: string, signal?: AbortSignal) =>
    api<NurseryRun>(path(room, id) + "/nursery/start", {
      method: "POST",
      signal,
    }),
  nurseryAction: (
    room: string,
    id: string,
    version: number,
    kind: "answer" | "help" | "retry",
    load?: { trays: number; units: number }
  ) =>
    api<NurseryRun>(path(room, id) + "/nursery/" + kind, {
      method: "POST",
      body: JSON.stringify({ version, ...(kind === "answer" ? load : {}) }),
    }),
  marketStart: (room: string, id: string, signal?: AbortSignal) =>
    api<MarketRun>(path(room, id) + "/market/start", {
      method: "POST",
      signal,
    }),
  marketAction: (
    room: string,
    id: string,
    version: number,
    kind: "answer" | "help" | "retry",
    answer?: number
  ) =>
    api<MarketRun>(path(room, id) + "/market/" + kind, {
      method: "POST",
      body: JSON.stringify({
        version,
        ...(kind === "answer" ? { answer } : {}),
      }),
    }),
  list: (signal?: AbortSignal) =>
    api<{ rooms: CargoRoom[] }>("/api/game-rooms", { signal }),
  deleteRoom: (room: string) =>
    api<{ ok: true }>(path(room), { method: "DELETE" }),
  detail: (room: string, signal?: AbortSignal) =>
    api<{ room: CargoRoom; participants: CargoParticipant[] }>(path(room), {
      signal,
    }),
  create: (
    region: CargoRegion,
    kind: CargoRoom["kind"] = "cargo",
    mode: CargoRoom["mode"] = "challenge",
    name?: string
  ) =>
    api<{ room: CargoRoom }>("/api/game-rooms", {
      method: "POST",
      body: JSON.stringify({ region, kind, mode, name }),
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
