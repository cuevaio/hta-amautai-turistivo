export type FairStation = 0 | 1 | 2 | "delivery"
export function fairLayout(compact: boolean) {
  const width = compact ? 600 : 1000
  return {
    width,
    height: compact ? 1020 : 820,
    worldBottom: compact ? 790 : 670,
    cardWidth: compact ? 158 : 190,
    supplyTop: compact ? 570 : 515,
    supplyHeight: compact ? 140 : 132,
    supplies: [
      compact ? 110 : 220,
      compact ? 300 : 500,
      compact ? 490 : 780,
    ].map((x) => ({ x, y: compact ? 742 : 635 })),
    delivery: { x: compact ? 445 : 780, y: compact ? 475 : 485 },
    spawn: { x: compact ? 290 : 500, y: compact ? 520 : 465 },
    bounds: {
      left: 45,
      right: width - 45,
      top: compact ? 450 : 440,
      bottom: compact ? 770 : 650,
    },
  }
}
export function fairStationAt(
  x: number,
  y: number,
  compact: boolean
): FairStation | null {
  const l = fairLayout(compact)
  if (
    Math.abs(x - l.delivery.x) < (compact ? 100 : 105) &&
    Math.abs(y - l.delivery.y) < 35
  )
    return "delivery"
  for (let i = 0; i < l.supplies.length; i++) {
    const p = l.supplies[i]!
    if (Math.abs(x - p.x) < l.cardWidth / 2 && Math.abs(y - p.y) < 32)
      return i as 0 | 1 | 2
  }
  return null
}
export class FairVisitGate {
  private station: FairStation | null = null
  private spent = false
  private since = 0
  update(
    station: FairStation | null,
    now: number,
    stopped: boolean,
    enabled: boolean
  ) {
    if (station !== this.station) {
      this.station = station
      this.spent = false
      this.since = now
    }
    if (!stopped || !enabled) {
      this.since = now
      return false
    }
    if (station === null || this.spent || now - this.since < 240) return false
    this.spent = true
    return true
  }
  reset() {
    this.station = null
    this.spent = false
    this.since = 0
  }
}
