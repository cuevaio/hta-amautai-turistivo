import Phaser from "phaser"
import type {
  CargoRegion,
  BuilderTask,
  BuilderPlacement,
  BuilderShape,
} from "@amautai/contracts"
import { builderLayout } from "./builder-geometry"
export type BuilderFrame = {
  task: BuilderTask
  selected: BuilderPlacement | null
  enabled: boolean
  complete: boolean
}
export type BuilderRuntime = {
  sync: (f: BuilderFrame) => void
  drag: (p: { x: number; y: number } | null, piece?: BuilderPlacement) => void
  destroy: () => void
}
const colors: Record<BuilderShape, number> = {
  rectangle: 0x4b9689,
  triangle: 0xd97c50,
  square: 0xe3b54e,
  circle: 0xe3b54e,
}
export function createBuilderGame(
  host: HTMLElement,
  options: {
    region: CargoRegion
    compact: boolean
    reduced: boolean
    ready: () => void
    error: () => void
  }
): BuilderRuntime {
  const l = builderLayout(options.compact),
    W = l.width,
    H = l.height
  let frame: BuilderFrame | null = null,
    disposed = false,
    failed = false
  class Builders extends Phaser.Scene {
    parts!: Phaser.GameObjects.Container
    floating!: Phaser.GameObjects.Container
    guide!: Phaser.GameObjects.Sprite
    drawing = ""
    previousTask = -1
    previousCursor = -1
    preload() {
      this.load.image("world", `/games/fair/v1/${options.region}.webp`)
      this.load.image("bench", "/games/builder/v1/workbench.webp")
      this.load.atlas(
        "guide",
        "/games/builder/v1/guide.webp",
        "/games/builder/v1/guide.json"
      )
      this.load.once("loaderror", () => {
        failed = true
        options.error()
      })
    }
    polygon(
      g: Phaser.GameObjects.Graphics,
      shape: BuilderShape,
      w: number,
      h: number,
      fill: number,
      alpha: number,
      stroke: number
    ) {
      g.fillStyle(fill, alpha).lineStyle(3, stroke, 1)
      if (shape === "circle") {
        g.fillCircle(0, 0, w / 2)
        g.strokeCircle(0, 0, w / 2)
      } else if (shape === "triangle") {
        const p = [
          { x: 0, y: -h / 2 },
          { x: w / 2, y: h / 2 },
          { x: -w / 2, y: h / 2 },
        ]
        g.fillPoints(p, true)
        g.strokePoints(p, true)
      } else {
        g.fillRect(-w / 2, -h / 2, w, h)
        g.strokeRect(-w / 2, -h / 2, w, h)
      }
    }
    piece(
      x: number,
      y: number,
      shape: BuilderShape,
      w: number,
      h: number,
      rotation = 0,
      ghost = false,
      active = false
    ) {
      const c = this.add.container(x, y),
        shadow = this.add.graphics().setPosition(0, 5),
        body = this.add.graphics()
      if (!ghost) {
        this.polygon(shadow, shape, w, h, 0x5b432b, 0.2, 0x765b36)
        c.add(shadow)
      }
      this.polygon(
        body,
        shape,
        w,
        h,
        ghost ? 0x587969 : colors[shape],
        ghost ? (active ? 0.16 : 0.06) : 1,
        ghost ? (active ? 0x9b6628 : 0xa9a18a) : 0x345f4e
      )
      c.add(body)
      c.setAngle(rotation * 90)
      if (!ghost) {
        const shine = this.add.graphics().lineStyle(3, 0xfff3ca, 0.6)
        if (shape === "circle") shine.strokeCircle(0, 0, Math.max(1, w / 2 - 7))
        else if (shape === "triangle")
          shine.lineBetween(0, -h / 2 + 10, -w / 2 + 12, h / 2 - 7)
        else shine.lineBetween(-w / 2 + 8, -h / 2 + 8, w / 2 - 8, -h / 2 + 8)
        c.add(shine)
      }
      return c
    }
    create() {
      if (disposed || failed) return
      const world = this.add.image(W / 2, H / 2, "world")
      world.setScale(Math.max(W / world.width, H / world.height))
      this.add.rectangle(W / 2, H / 2, W, H, 0xf8f2df, 0.25)
      const b = l.board
      this.add
        .image(b.x + b.w / 2, b.y + b.h / 2, "bench")
        .setDisplaySize(b.w, b.h)
      this.parts = this.add.container(0, 0)
      this.guide = this.add
        .sprite(l.guide.x, l.guide.y, "guide", "0")
        .setOrigin(0.5, 1)
      this.guide.setScale((options.compact ? 115 : 140) / this.guide.height)
      this.anims.create({
        key: "cheer",
        frames: [1, 2, 3, 0].map((i) => ({ key: "guide", frame: String(i) })),
        frameRate: 4,
      })
      this.floating = this.add.container(0, 0).setDepth(30)
      host.querySelector("canvas")?.setAttribute("aria-hidden", "true")
      this.paint()
      options.ready()
    }
    paint() {
      if (!frame || !this.parts) return
      const t = frame.task,
        key = JSON.stringify([t, frame.selected, frame.complete])
      if (this.drawing === key) return
      this.drawing = key
      this.tweens.killAll()
      this.parts.removeAll(true)
      this.floating.removeAll(true)
      // Body first, then roof and window: intentional layering without ambiguous drop targets.
      l.slots.forEach((s, i) => {
        const placed = i < t.cursor || frame!.complete,
          active = i === t.cursor && !frame!.complete
        const part = this.piece(
          s.x,
          s.y,
          t.targets[i]!,
          s.w,
          s.h,
          0,
          !placed,
          active
        )
        this.parts.add(part)
        if (active) {
          const g = this.add.graphics().lineStyle(3, 0x94612b, 0.75)
          const hw = Math.max(60, s.w / 2 + 12),
            hh = Math.max(60, s.h / 2 + 12),
            d = 17
          for (const [dx, dy] of [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ]) {
            const x = s.x + dx! * hw,
              y = s.y + dy! * hh
            g.lineBetween(x, y, x - dx! * d, y)
            g.lineBetween(x, y, x, y - dy! * d)
          }
          this.parts.add(g)
        }
        if (
          placed &&
          t.id === this.previousTask &&
          t.cursor > this.previousCursor &&
          i === t.cursor - 1 &&
          !options.reduced
        )
          this.tweens.add({
            targets: part,
            scaleX: { from: 0.88, to: 1 },
            scaleY: { from: 0.88, to: 1 },
            duration: 240,
            ease: "Back.Out",
          })
      })
      t.pieces.forEach((p, i) => {
        const pos = l.pieces[i]!,
          selected = p.shape === frame!.selected?.shape
        const bg = this.add
          .graphics()
          .fillStyle(selected ? 0xffe5a0 : 0xfff7e4, 0.97)
          .fillRoundedRect(
            pos.x - l.pieceWidth / 2,
            pos.y - 74,
            l.pieceWidth,
            158,
            16
          )
          .lineStyle(selected ? 4 : 2, selected ? 0x355f4c : 0xb89b61)
          .strokeRoundedRect(
            pos.x - l.pieceWidth / 2,
            pos.y - 74,
            l.pieceWidth,
            158,
            16
          )
        this.parts.add(bg)
        const shape = p.shape,
          w = shape === "square" || shape === "circle" ? 82 : 112,
          h = shape === "triangle" ? 88 : shape === "rectangle" ? 70 : 82
        this.parts.add(
          this.piece(
            pos.x,
            pos.y - 7,
            shape,
            w,
            h,
            selected ? frame!.selected!.rotation : p.rotation
          )
        )
      })
      if (
        t.id === this.previousTask &&
        t.cursor > this.previousCursor &&
        !options.reduced
      )
        this.guide.play("cheer", true)
      this.previousTask = t.id
      this.previousCursor = t.cursor
    }
    drag(p: { x: number; y: number } | null, piece?: BuilderPlacement) {
      if (!this.floating) return
      this.floating.removeAll(true)
      if (p && piece)
        this.floating
          .add(
            this.piece(
              p.x,
              p.y,
              piece.shape,
              piece.shape === "square" || piece.shape === "circle" ? 85 : 112,
              piece.shape === "triangle"
                ? 88
                : piece.shape === "rectangle"
                  ? 70
                  : 85,
              piece.rotation
            )
          )
          .setAlpha(0.9)
    }
  }
  const scene = new Builders(),
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: W,
      height: H,
      pixelArt: true,
      scene,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      audio: { noAudio: true },
      banner: false,
    })
  return {
    sync(f) {
      frame = f
      scene.paint()
    },
    drag: (p, piece) => scene.drag(p, piece),
    destroy() {
      disposed = true
      game.destroy(true)
    },
  }
}
