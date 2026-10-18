export type NurseryCommand =
  "unit" | "tray" | "remove-unit" | "remove-tray" | "group" | "ungroup"
export type NurseryStation = "unit" | "tray" | "group" | "ungroup" | "garden"
export type NurseryPoint = { x: number; y: number }
export function nurseryLayout(compact: boolean) {
  return compact
    ? {
        width: 600,
        height: 1060,
        worldTop: 178,
        worldHeight: 405,
        inventoryTop: 598,
        inventoryHeight: 244,
        bounds: { left: 52, right: 550, top: 285, bottom: 560 },
        spawn: { x: 405, y: 550 },
        stations: {
          unit: { x: 110, y: 310 },
          tray: { x: 300, y: 310 },
          group: { x: 110, y: 485 },
          ungroup: { x: 300, y: 485 },
          garden: { x: 505, y: 395 },
        },
        cardWidth: 150,
        cardHeight: 125,
      }
    : {
        width: 1100,
        height: 760,
        worldTop: 178,
        worldHeight: 350,
        inventoryTop: 548,
        inventoryHeight: 196,
        bounds: { left: 60, right: 1040, top: 320, bottom: 455 },
        spawn: { x: 545, y: 450 },
        stations: {
          unit: { x: 125, y: 350 },
          tray: { x: 315, y: 350 },
          group: { x: 510, y: 350 },
          ungroup: { x: 705, y: 350 },
          garden: { x: 970, y: 415 },
        },
        cardWidth: 162,
        cardHeight: 125,
      }
}
export function nurseryStationAt(
  point: NurseryPoint,
  compact: boolean
): NurseryStation | null {
  const layout = nurseryLayout(compact)
  return (
    (Object.keys(layout.stations) as NurseryStation[]).find((key) =>
      key === "garden"
        ? Math.abs(point.x - layout.stations[key].x) <= 78 &&
          Math.abs(point.y - layout.stations[key].y) <= 55
        : Math.hypot(
            point.x - layout.stations[key].x,
            point.y - layout.stations[key].y
          ) <= 48
    ) ?? null
  )
}
export function nurseryStationEnabled(
  station: NurseryStation,
  trays: number,
  units: number
) {
  if (station === "unit") return trays * 10 + units < 99
  if (station === "tray") return trays * 10 + units <= 89
  if (station === "group") return units >= 10 && trays < 9
  if (station === "ungroup") return trays > 0
  return true
}
// An intentional station visit can perform exactly one action, even through pending UI syncs.
export class NurseryStationGate {
  private station: NurseryStation | null = null
  private used = false
  private stoppedAt: number | null = null
  enter(station: NurseryStation | null) {
    if (station !== this.station) {
      this.station = station
      this.used = false
      this.stoppedAt = null
    }
  }
  consume(station: NurseryStation) {
    this.station = station
    this.used = true
    this.stoppedAt = null
  }
  tick(
    station: NurseryStation | null,
    enabled: boolean,
    stopped: boolean,
    now: number
  ) {
    this.enter(station)
    if (!station || this.used) return false
    if (!enabled || !stopped) {
      this.stoppedAt = null
      return false
    }
    if (this.stoppedAt === null) this.stoppedAt = now
    if (now - this.stoppedAt < 260) return false
    this.used = true
    return true
  }
}
