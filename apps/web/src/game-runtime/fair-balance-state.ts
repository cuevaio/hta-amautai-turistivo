/** Screen Y increases downwards: positive rotation lowers the heavier right pan. */
export function balanceAngle(left: number, right: number) {
  return Math.max(-0.115, Math.min(0.115, (right - left) * 0.023))
}
export function balanceEnds(
  centerX: number,
  pivotY: number,
  arm: number,
  angle: number
) {
  const dx = Math.cos(angle) * arm,
    dy = Math.sin(angle) * arm
  return {
    left: { x: centerX - dx, y: pivotY - dy },
    right: { x: centerX + dx, y: pivotY + dy },
  }
}
