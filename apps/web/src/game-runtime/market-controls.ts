export type MarketZone = "road" | "source" | "market"
export type DrivePoint = { x: number; y: number }
export const marketBounds = { left: 235, right: 720, top: 285, bottom: 370 }
export function marketZoneAt(p: DrivePoint): MarketZone {
  if (Math.abs(p.x - 245) <= 75 && Math.abs(p.y - 346) <= 35) return "source"
  if (Math.abs(p.x - 700) <= 75 && Math.abs(p.y - 346) <= 35) return "market"
  return "road"
}
export function driveMarket(
  position: DrivePoint,
  velocity: DrivePoint,
  direction: DrivePoint,
  delta: number
) {
  const dt = Math.max(0, Math.min(50, delta)) / 1000,
    length = Math.max(1, Math.hypot(direction.x, direction.y)),
    blend = 1 - Math.exp(-9 * dt)
  const vx = velocity.x + ((direction.x / length) * 220 - velocity.x) * blend,
    vy = velocity.y + ((direction.y / length) * 105 - velocity.y) * blend
  const x = Math.max(
      marketBounds.left,
      Math.min(marketBounds.right, position.x + vx * dt)
    ),
    y = Math.max(
      marketBounds.top,
      Math.min(marketBounds.bottom, position.y + vy * dt)
    )
  return {
    position: { x, y },
    velocity: {
      x: x === marketBounds.left || x === marketBounds.right ? 0 : vx,
      y: y === marketBounds.top || y === marketBounds.bottom ? 0 : vy,
    },
  }
}
// Tap destinations stay on the travel lane, away from inventory and HUD.
export function marketTapTarget(point: DrivePoint): DrivePoint | null {
  if (point.y < 170 || point.y > 398) return null
  return { x: Math.max(245, Math.min(700, point.x)), y: 346 }
}
export function approachMarket(
  position: DrivePoint,
  target: DrivePoint,
  delta: number
) {
  const dx = target.x - position.x,
    dy = target.y - position.y
  const distance = Math.hypot(dx, dy)
  const travel = (220 * Math.max(0, Math.min(50, delta))) / 1000
  if (distance <= travel)
    return { position: { ...target }, velocity: { x: 0, y: 0 }, arrived: true }
  const velocity = { x: (dx / distance) * 220, y: (dy / distance) * 220 }
  return {
    position: {
      x: position.x + (velocity.x * travel) / 220,
      y: position.y + (velocity.y * travel) / 220,
    },
    velocity,
    arrived: false,
  }
}
