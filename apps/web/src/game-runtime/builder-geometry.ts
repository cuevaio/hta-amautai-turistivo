export function builderLayout(compact: boolean) {
  const width = compact ? 600 : 1000
  return {
    width,
    height: compact ? 1080 : 900,
    board: {
      x: 20,
      y: compact ? 220 : 185,
      w: width - 40,
      h: compact ? 470 : 430,
    },
    slots: [
      { x: width / 2, y: compact ? 490 : 465, w: 240, h: 180 },
      { x: width / 2, y: compact ? 325 : 300, w: 310, h: 150 },
      { x: width / 2, y: compact ? 465 : 440, w: 66, h: 66 },
    ],
    pieces: [compact ? 110 : 180, width / 2, compact ? 490 : 820].map((x) => ({
      x,
      y: compact ? 805 : 720,
    })),
    pieceWidth: compact ? 164 : 220,
    pieceHeight: 158,
    guide: { x: width - (compact ? 76 : 115), y: compact ? 668 : 600 },
    footer: compact ? 970 : 815,
  }
}
// Deliberate drops receive forgiving hitboxes. Pointer slips outside are free.
export function builderDropAt(
  x: number,
  y: number,
  cursor: number,
  compact: boolean
) {
  const s = builderLayout(compact).slots[cursor]
  return (
    !!s &&
    Math.abs(x - s.x) <= Math.max(60, s.w / 2 + 12) &&
    Math.abs(y - s.y) <= Math.max(60, s.h / 2 + 12)
  )
}
export function builderPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  compact: boolean
) {
  const l = builderLayout(compact)
  return {
    x: ((clientX - rect.left) / rect.width) * l.width,
    y: ((clientY - rect.top) / rect.height) * l.height,
  }
}
