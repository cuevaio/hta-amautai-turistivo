import type { Actor, Region } from "../domain/cargo.ts"
import { participantName } from "../domain/cargo.ts"
import type { FamilyChild, FamilyGame, FamilyKind } from "../domain/family.ts"
import { FamilyGameError, validFamilyKind } from "../domain/family.ts"
export interface FamilyGameRepository {
  children(actor: Actor): Promise<FamilyChild[]>
  child(actor: Actor, id: string): Promise<FamilyChild | null>
  add(
    actor: Actor,
    id: string,
    name: string,
    key: string,
    region: Region
  ): Promise<void>
  update(
    actor: Actor,
    id: string,
    name: string,
    key: string,
    region: Region,
    version: number
  ): Promise<boolean>
  remove(actor: Actor, id: string): Promise<boolean>
  games(actor: Actor): Promise<FamilyGame[]>
  game(actor: Actor, id: string): Promise<FamilyGame | null>
  create(
    actor: Actor,
    child: FamilyChild,
    kind: FamilyKind,
    requestId: string
  ): Promise<void>
}
export function familyGameService(
  repo: FamilyGameRepository,
  id: () => string
) {
  return {
    async overview(actor: Actor) {
      return {
        children: await repo.children(actor),
        games: await repo.games(actor),
      }
    },
    async add(actor: Actor, raw: string, region: Region) {
      if (!["coast", "highlands", "jungle"].includes(region))
        throw new FamilyGameError("invalid_family_game")
      const { name, key } = participantName(raw)
      const childId = id()
      await repo.add(actor, childId, name, key, region)
      return (await repo.child(actor, childId))!
    },
    async update(
      actor: Actor,
      childId: string,
      raw: string,
      region: Region,
      version: number
    ) {
      if (!(await repo.child(actor, childId)))
        throw new FamilyGameError("child_not_found")
      if (
        !["coast", "highlands", "jungle"].includes(region) ||
        !Number.isInteger(version) ||
        version < 1
      )
        throw new FamilyGameError("invalid_family_game")
      const { name, key } = participantName(raw)
      if (!(await repo.update(actor, childId, name, key, region, version)))
        throw new FamilyGameError("family_conflict")
      return (await repo.child(actor, childId))!
    },
    async remove(actor: Actor, childId: string) {
      if (!(await repo.remove(actor, childId)))
        throw new FamilyGameError("child_not_found")
    },
    async create(
      actor: Actor,
      childId: string,
      kind: FamilyKind,
      requestId: string
    ) {
      if (
        !validFamilyKind(kind) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          requestId
        )
      )
        throw new FamilyGameError("invalid_family_game")
      const child = await repo.child(actor, childId)
      if (!child) throw new FamilyGameError("child_not_found")
      const existing = await repo.game(actor, requestId)
      if (existing && (existing.childId !== childId || existing.kind !== kind))
        throw new FamilyGameError("family_conflict")
      if (!existing) await repo.create(actor, child, kind, requestId)
      const game = await repo.game(actor, requestId)
      if (!game || game.childId !== childId || game.kind !== kind)
        throw new FamilyGameError("family_conflict")
      return game
    },
  }
}
