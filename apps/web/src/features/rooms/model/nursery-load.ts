export type NurseryLoad = { trays: number; units: number }
export type NurseryAction =
  "unit" | "tray" | "remove-unit" | "remove-tray" | "group" | "ungroup"
export function changeNurseryLoad(
  load: NurseryLoad,
  action: NurseryAction
): NurseryLoad {
  const next = { ...load }
  if (action === "unit") next.units++
  if (action === "tray") next.trays++
  if (action === "remove-unit") next.units--
  if (action === "remove-tray") next.trays--
  if (action === "group") {
    if (next.units < 10) return load
    next.units -= 10
    next.trays++
  }
  if (action === "ungroup") {
    if (next.trays < 1) return load
    next.trays--
    next.units += 10
  }
  if (
    next.trays < 0 ||
    next.units < 0 ||
    next.trays > 9 ||
    next.units > 99 ||
    next.trays * 10 + next.units > 99
  )
    return load
  return next
}
