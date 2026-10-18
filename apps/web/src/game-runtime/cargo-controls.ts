export type Point = { x: number; y: number }
export const flightBounds = { left: 70, right: 885, top: 180, bottom: 470 }
export function moveBird(
  position: Point,
  direction: Point,
  deltaMs: number
): Point {
  const length = Math.hypot(direction.x, direction.y)
  const distance = (330 * Math.max(0, Math.min(deltaMs, 50))) / 1000
  const scale = length > 0 ? distance / Math.max(1, length) : 0
  return {
    x: Math.max(
      flightBounds.left,
      Math.min(flightBounds.right, position.x + direction.x * scale)
    ),
    y: Math.max(
      flightBounds.top,
      Math.min(flightBounds.bottom, position.y + direction.y * scale)
    ),
  }
}
export function canCatch(bird: Point, drop: Point) {
  // Stable gameplay hitbox: wing-frame size must not change collection reach.
  return Math.abs(bird.x - drop.x) <= 54 && Math.abs(bird.y - drop.y) <= 40
}
