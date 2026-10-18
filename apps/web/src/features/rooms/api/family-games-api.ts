import { api } from "@/shared/api/client"
import type {
  FamilyChild,
  FamilyGameSession,
  FamilyGameKind,
  CargoRegion,
} from "@amautai/contracts"
const base = "/api/family-games"
export const familyGamesApi = {
  overview: (signal?: AbortSignal) =>
    api<{ children: FamilyChild[]; games: FamilyGameSession[] }>(base, {
      signal,
    }),
  saveChild: (name: string, region: CargoRegion, child?: FamilyChild) =>
    api<{ child: FamilyChild }>(
      base + "/children" + (child ? "/" + encodeURIComponent(child.id) : ""),
      {
        method: child ? "PUT" : "POST",
        body: JSON.stringify({
          name,
          region,
          ...(child ? { version: child.version } : {}),
        }),
      }
    ),
  remove: (id: string) =>
    api<{ ok: true }>(base + "/children/" + encodeURIComponent(id), {
      method: "DELETE",
    }),
  create: (childId: string, kind: FamilyGameKind, requestId: string) =>
    api<{ game: FamilyGameSession }>(base, {
      method: "POST",
      body: JSON.stringify({ childId, kind, requestId }),
    }),
}
