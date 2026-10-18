export type DataStation = 0 | 1 | 2 | "delivery"
export function dataLayout(compact: boolean) {
  const width = compact ? 600 : 1000
  return {
    width,
    height: compact ? 1140 : 900,
    worldBottom: compact ? 900 : 790,
    cardWidth: compact ? 150 : 180,
    supplyTop: compact ? 590 : 550,
    supplyHeight: 46,
    supplies: [compact ? 105 : 180, width / 2, compact ? 495 : 820].map(
      (x) => ({ x, y: compact ? 710 : 655 })
    ),
    delivery: { x: width / 2, y: compact ? 850 : 745 },
    sourceTop: (compact ? 850 : 745) - 60,
    spawn: { x: compact ? 120 : 180, y: compact ? 780 : 710 },
    graphBottom: compact ? 526 : 490,
    labelTop: (compact ? 526 : 490) + 12,
    labelHeight: 38,
    graphTop: 300,
    bounds: {
      left: 40,
      right: width - 40,
      top: compact ? 680 : 625,
      bottom: compact ? 870 : 765,
    },
  }
}
export function dataStationAt(
  x: number,
  y: number,
  compact: boolean
): DataStation | null {
  const l = dataLayout(compact)
  if (Math.abs(x - l.delivery.x) < 80 && Math.abs(y - l.delivery.y) < 28)
    return "delivery"
  for (let i = 0; i < 3; i++) {
    const p = l.supplies[i]!
    if (Math.abs(x - p.x) < l.cardWidth / 2 - 10 && Math.abs(y - p.y) < 24)
      return i as 0 | 1 | 2
  }
  return null
}
