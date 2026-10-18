import Phaser from "phaser"
import type { CargoRegion, DataTask } from "@amautai/contracts"
import { dataLayout, dataStationAt } from "./data-stations"
import type { DataStation } from "./data-stations"
import { FairVisitGate } from "./fair-stations"
export type DataFrame = {
  task: DataTask
  selected: number | null
  enabled: boolean
  version: number
  labels: string[]
  score: string
  lives: string
  streak: string
  mission: string
  legend: string
  progress: string
  source: string
  column: string
  carrying: string
  instruction: string
  hint: string
  saving: string
  win: string
  feedback: string
  feedbackKind: "" | "correct" | "wrong" | "help"
}
export type DataRuntime = {
  sync: (f: DataFrame) => void
  visit: (s: DataStation) => void
  steer: (x: number, y: number) => void
  nudge: (x: number, y: number) => void
  undo: () => void
  destroy: () => void
}
export function createDataGame(
  host: HTMLElement,
  options: {
    region: CargoRegion
    compact: boolean
    reduced: boolean
    select: (n: number) => void
    deliver: (n: number) => void
    undo: () => void
    ready: () => void
    error: () => void
  }
): DataRuntime {
  const l = dataLayout(options.compact),
    W = l.width,
    H = l.height
  let frame: DataFrame | null = null,
    disposed = false,
    failed = false,
    held = { x: 0, y: 0 },
    result: DataFrame | null = null
  const keys = new Set<string>(),
    moves = new Set([
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
    ])
  const clear = () => {
    keys.clear()
    held = { x: 0, y: 0 }
    scene.destination = null
  }
  const down = (e: KeyboardEvent) => {
    if (
      !frame?.enabled ||
      !host.contains(document.activeElement) ||
      (e.target instanceof HTMLElement &&
        e.target.closest("input,textarea,select"))
    )
      return
    if (moves.has(e.code)) {
      e.preventDefault()
      keys.add(e.code)
      scene.destination = null
    }
    if (e.code === "KeyZ" && !e.repeat) {
      e.preventDefault()
      undo()
    }
  }
  const up = (e: KeyboardEvent) => {
    keys.delete(e.code)
  }
  const hidden = () => {
    if (document.hidden) clear()
  }
  class DataFair extends Phaser.Scene {
    player!: Phaser.GameObjects.Sprite
    shadow!: Phaser.GameObjects.Ellipse
    guide!: Phaser.GameObjects.Sprite
    board!: Phaser.GameObjects.Container
    cargo!: Phaser.GameObjects.Container
    outcome!: Phaser.GameObjects.Container
    score!: Phaser.GameObjects.Text
    lives!: Phaser.GameObjects.Text
    streak!: Phaser.GameObjects.Text
    mission!: Phaser.GameObjects.Text
    instruction!: Phaser.GameObjects.Text
    destination: DataStation | null = null
    gate = new FairVisitGate()
    task = -1
    version = -1
    drawing = ""
    until = 0
    preload() {
      this.load.image("world", `/games/fair/v1/${options.region}.webp`)
      this.load.atlas(
        "helper",
        "/games/fair/v1/helper.webp",
        "/games/fair/v1/helper.json"
      )
      this.load.atlas(
        "guide",
        "/games/data/v1/guide.webp",
        "/games/data/v1/guide.json"
      )
      this.load.image("booth", "/games/data/v1/booth.webp")
      for (const food of ["fish", "corn", "banana"])
        this.load.atlas(
          food,
          `/games/market/v2/${food}.png`,
          `/games/market/v2/${food}-atlas.json`
        )
      this.load.once("loaderror", () => {
        failed = true
        options.error()
      })
    }
    text(
      x: number,
      y: number,
      value: string,
      size = 24,
      color = "#214d40",
      center = false
    ) {
      return this.add
        .text(x, y, value, {
          fontFamily: "Inter Variable, sans-serif",
          fontSize: size + "px",
          color,
          resolution: Math.min(3, Math.max(2, window.devicePixelRatio || 1)),
          align: center ? "center" : "left",
        })
        .setOrigin(center ? 0.5 : 0, 0)
    }
    panel(x: number, y: number, w: number, h: number, color = 0xfff3d7) {
      return this.add
        .graphics()
        .fillStyle(color, 0.98)
        .fillRoundedRect(x - w / 2, y - h / 2, w, h, 10)
        .lineStyle(1.5, 0xbca36b)
        .strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10)
    }
    food(x: number, y: number, category: number, size: number) {
      const k = ["fish", "corn", "banana"][category]!
      const a = this.add.image(x, y, k, "item")
      return a.setScale(size / Math.max(a.width, a.height))
    }
    create() {
      if (disposed || failed) return
      this.add.rectangle(W / 2, H / 2, W, H, 0x133e34)
      const worldTop = options.compact ? 220 : 174
      const world = this.add.image(
        W / 2,
        (worldTop + l.worldBottom) / 2,
        "world"
      )
      world.setScale(
        Math.max(W / world.width, (l.worldBottom - worldTop) / world.height)
      )
      const mask = this.add
        .graphics()
        .fillStyle(0xffffff)
        .fillRect(0, worldTop, W, l.worldBottom - worldTop)
      world.setMask(mask.createGeometryMask())
      mask.setVisible(false)
      this.panel(
        W / 2,
        options.compact ? 141 : 122,
        W - 24,
        options.compact ? 134 : 98
      )
      this.score = this.text(22, 18, "", options.compact ? 25 : 28, "#fff0c6")
      this.lives = this.text(
        W - 22,
        20,
        "",
        options.compact ? 21 : 24,
        "#e4ecd6"
      ).setOrigin(1, 0)
      this.streak = this.text(W / 2, 52, "", 17, "#c8dac5", true)
      this.mission = this.text(
        W / 2,
        options.compact ? 141 : 122,
        "",
        options.compact ? 27 : 30,
        "#214d40",
        true
      )
        .setOrigin(0.5, 0.5)
        .setWordWrapWidth(W - 65)
      const booth = this.add
        .image(W / 2, l.delivery.y - 5, "booth")
        .setOrigin(0.5, 1)
      booth.setScale(220 / booth.width)
      this.guide = this.add
        .sprite(W / 2 + 73, l.delivery.y - 8, "guide", "0")
        .setOrigin(0.5, 1)
      this.guide.setScale(120 / this.guide.height)
      this.anims.create({
        key: "talk",
        frames: [0, 1, 2, 3].map((i) => ({ key: "guide", frame: String(i) })),
        frameRate: 2,
        repeat: -1,
      })
      if (!options.reduced) this.guide.play("talk")
      this.board = this.add.container(0, 0).setDepth(2)
      this.shadow = this.add
        .ellipse(l.spawn.x, l.spawn.y, 62, 17, 0x332719, 0.25)
        .setDepth(9)
      this.player = this.add
        .sprite(l.spawn.x, l.spawn.y, "helper", "0")
        .setOrigin(0.5, 1)
        .setDepth(10)
      this.player.setScale(110 / this.player.height)
      this.anims.create({
        key: "walk",
        frames: [0, 1, 2, 3].map((i) => ({ key: "helper", frame: String(i) })),
        frameRate: 7,
        repeat: -1,
      })
      this.cargo = this.add.container(0, 0).setDepth(11)
      this.add.rectangle(W / 2, l.worldBottom, W, 5, 0xb9cb95)
      this.instruction = this.text(
        24,
        l.worldBottom + 19,
        "",
        options.compact ? 22 : 24,
        "#fff0cc"
      ).setWordWrapWidth(W - 48)
      this.outcome = this.add.container(W / 2, 147).setDepth(40)
      host.querySelector("canvas")?.setAttribute("aria-hidden", "true")
      this.paint()
      options.ready()
    }
    active() {
      return !!frame?.enabled && this.time.now >= this.until
    }
    visit(s: DataStation) {
      if (!this.active()) return
      clear()
      this.destination = s
    }
    paint() {
      if (!frame || !this.player) return
      const display = result ?? frame,
        t = display.task
      if (this.task !== t.id) {
        this.task = t.id
        clear()
        this.gate.reset()
        this.player.setPosition(l.spawn.x, l.spawn.y)
      }
      this.score.setText(frame.score)
      this.lives.setText(frame.lives)
      this.streak.setText(frame.streak)
      this.mission.setText(display.mission).setVisible(!result)
      this.instruction.setText(
        !frame.enabled ? frame.saving : frame.hint || frame.instruction
      )
      const drawing = JSON.stringify([
        t.id,
        t.cursor,
        display.selected,
        display.labels,
        display.legend,
        display.source,
        display.progress,
        display.column,
        display.hint,
      ])
      if (drawing !== this.drawing) {
        this.drawing = drawing
        this.board.removeAll(true)
        this.cargo.removeAll(true)
        this.board.add(
          this.panel(
            W / 2,
            (l.graphTop + l.graphBottom) / 2,
            W - 40,
            l.graphBottom - l.graphTop + 116,
            0xfff9e8
          )
        )
        this.board.add(
          this.text(
            W / 2,
            l.graphTop - 31,
            display.legend,
            options.compact ? 20 : 22,
            "#315949",
            true
          )
        )
        this.board.add(
          this.add.rectangle(W / 2, l.graphBottom + 1, W - 100, 3, 0x537b65)
        )
        const colors = [0x429790, 0xdbad48, 0xc57a53]
        l.supplies.forEach((p, i) => {
          const count = t.registered[i]!,
            units = count / t.unit
          for (let j = 0; j < units; j++) {
            const token = this.add.container(p.x, l.graphBottom - 15 - j * 27)
            token.add(
              this.add
                .rectangle(0, 0, options.compact ? 92 : 120, 24, colors[i]!)
                .setStrokeStyle(1, 0xffffff, 0.7)
            )
            token.add(this.food(t.unit === 2 ? -13 : 0, 0, i, 26))
            if (t.unit === 2)
              token.add(this.text(20, -11, "2", 20, "#ffffff", true))
            this.board.add(token)
            if (
              !options.reduced &&
              t.skill === 0 &&
              j === units - 1 &&
              t.cursor > 0 &&
              t.votes[t.cursor - 1] === i
            )
              this.tweens.add({
                targets: token,
                y: { from: token.y - 10, to: token.y },
                alpha: { from: 0.5, to: 1 },
                duration: 220,
              })
          }
          // Category names use the accessible HTML layer, independent of sprite
          // depth and canvas texture scaling. Reserve their strip in the layout.
          const selected = display.selected === t.choices[i] && t.skill !== 0
          this.board.add(
            this.panel(
              p.x,
              l.supplyTop + l.supplyHeight / 2,
              l.cardWidth,
              l.supplyHeight,
              selected ? 0xf4d073 : 0xffedc4
            )
          )
          if (t.skill === 0) {
            this.board.add(
              this.food(
                p.x - (options.compact ? 52 : 62),
                l.supplyTop + 23,
                i,
                27
              )
            )
            this.board.add(
              this.text(
                p.x + 17,
                l.supplyTop + 13,
                display.column,
                options.compact ? 16 : 18,
                "#315949",
                true
              )
            )
          } else if (t.skill === 2) {
            this.board.add(
              this.food(
                p.x - (options.compact ? 52 : 62),
                l.supplyTop + 23,
                t.choices[i]!,
                27
              )
            )
            this.board.add(
              this.text(
                p.x + 15,
                l.supplyTop + 11,
                display.labels[t.choices[i]!]!,
                options.compact ? 20 : 22,
                "#214d40",
                true
              ).setWordWrapWidth(l.cardWidth - 50)
            )
          } else
            this.board.add(
              this.text(
                p.x,
                l.supplyTop + 3,
                String(t.choices[i]),
                34,
                "#214d40",
                true
              )
            )
          this.board.add(this.add.ellipse(p.x, p.y, 75, 14, 0x315d48, 0.35))
        })
        this.board.add(
          this.add.ellipse(
            l.delivery.x,
            l.delivery.y,
            108,
            20,
            (
              t.skill === 0
                ? display.selected === null
                : display.selected !== null
            )
              ? 0xdca945
              : 0x2a6651,
            0.65
          )
        )
        this.board.add(
          this.panel(
            l.delivery.x,
            l.delivery.y + 22,
            options.compact ? 256 : 280,
            37,
            0x225844
          )
        )
        this.board.add(
          this.text(
            l.delivery.x,
            l.delivery.y + 8,
            display.source,
            21,
            "#fff1cb",
            true
          ).setWordWrapWidth(250)
        )
        if (t.skill === 0) {
          this.board.add(
            this.text(
              W / 2,
              l.graphTop - 57,
              display.progress,
              options.compact ? 18 : 20,
              "#244e40",
              true
            )
          )
          this.board.add(
            this.add
              .circle(W / 2 + 72, l.delivery.y - 140, 31, 0xfff3d6)
              .setStrokeStyle(2, 0xbca36b)
          )
          this.board.add(
            this.food(W / 2 + 72, l.delivery.y - 140, t.votes[t.cursor]!, 43)
          )
        }
        if (display.selected !== null && !result) {
          this.cargo.add(
            this.add.circle(0, 0, 26, 0xffe7a3).setStrokeStyle(2, 0x295b46)
          )
          if (t.skill === 0 || t.skill === 2)
            this.cargo.add(this.food(0, 0, display.selected, 37))
          else
            this.cargo.add(
              this.text(0, -15, String(display.selected), 28, "#214d40", true)
            )
        }
      }
      if (this.version !== frame.version) {
        const first = this.version < 0
        this.version = frame.version
        if (
          !first &&
          (frame.feedbackKind === "correct" || frame.feedbackKind === "wrong")
        ) {
          clear()
          this.until = this.time.now + 1700
          this.outcome.removeAll(true)
          this.outcome.add(
            this.panel(
              0,
              0,
              W - 50,
              145,
              frame.feedbackKind === "correct" ? 0x205a43 : 0x713e2e
            )
          )
          this.outcome.add(
            this.text(
              0,
              -48,
              frame.feedbackKind === "correct" ? frame.win : frame.feedback,
              options.compact ? 27 : 31,
              "#fff2d4",
              true
            ).setWordWrapWidth(W - 90)
          )
          if (frame.feedbackKind === "correct")
            this.outcome.add(
              this.text(0, 10, frame.feedback, 27, "#fff2d4", true)
            )
          if (!options.reduced)
            this.tweens.add({
              targets: this.outcome,
              scaleX: { from: 0.96, to: 1 },
              scaleY: { from: 0.96, to: 1 },
              duration: 180,
              ease: "Back.Out",
            })
          this.time.delayedCall(1700, () => {
            this.outcome.removeAll(true)
            result = null
            this.paint()
          })
        }
      }
    }
    update(_time: number, delta: number) {
      if (!this.player || !frame) return
      let dx =
          held.x +
          Number(keys.has("ArrowRight") || keys.has("KeyD")) -
          Number(keys.has("ArrowLeft") || keys.has("KeyA")),
        dy =
          held.y +
          Number(keys.has("ArrowDown") || keys.has("KeyS")) -
          Number(keys.has("ArrowUp") || keys.has("KeyW"))
      if (!this.active()) {
        dx = 0
        dy = 0
        this.destination = null
      } else if (this.destination !== null && !dx && !dy) {
        const p =
            this.destination === "delivery"
              ? l.delivery
              : l.supplies[this.destination]!,
          x = p.x - this.player.x,
          y = p.y - this.player.y,
          d = Math.hypot(x, y)
        if (d < 7) {
          this.player.setPosition(p.x, p.y)
          this.destination = null
        } else {
          dx = x / d
          dy = y / d
        }
      }
      const norm = Math.hypot(dx, dy),
        dt = Math.min(delta, 40) / 1000
      if (norm) {
        const speed = options.compact ? 250 : 300
        this.player.x = Phaser.Math.Clamp(
          this.player.x + (dx / norm) * speed * dt,
          l.bounds.left,
          l.bounds.right
        )
        this.player.y = Phaser.Math.Clamp(
          this.player.y + (dy / norm) * speed * dt,
          l.bounds.top,
          l.bounds.bottom
        )
        if (dx) this.player.setFlipX(dx < 0)
        this.player.play("walk", true)
      } else {
        this.player.anims.stop()
        this.player.setFrame("0")
      }
      this.shadow.setPosition(this.player.x, this.player.y - 3)
      this.cargo.setPosition(
        this.player.x + (this.player.flipX ? -27 : 27),
        this.player.y - 65
      )
      const s = dataStationAt(this.player.x, this.player.y, options.compact)
      const valid =
        this.active() &&
        (s === "delivery"
          ? frame.task.skill === 0
            ? frame.selected === null
            : frame.selected !== null
          : frame.task.skill === 0
            ? frame.selected !== null
            : true)
      if (this.gate.update(s, this.time.now, !norm, valid) && s !== null) {
        if (s === "delivery") {
          if (frame.task.skill === 0)
            options.select(frame.task.votes[frame.task.cursor]!)
          else options.deliver(frame.selected!)
        } else if (frame.task.skill === 0) options.deliver(s)
        else options.select(frame.task.choices[s]!)
      }
    }
  }
  const scene = new DataFair()
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width: W,
    height: H,
    backgroundColor: "#133e34",
    pixelArt: true,
    scene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true },
    banner: false,
  })
  host.addEventListener("keydown", down)
  host.addEventListener("keyup", up)
  host.addEventListener("focusout", clear)
  window.addEventListener("blur", clear)
  document.addEventListener("visibilitychange", hidden)
  function undo() {
    if (!scene.active()) return
    clear()
    options.undo()
  }
  return {
    sync(next) {
      if (
        frame &&
        next.version !== frame.version &&
        (next.feedbackKind === "correct" || next.feedbackKind === "wrong")
      )
        result = frame
      frame = next
      if (!next.enabled) clear()
      scene.paint()
    },
    visit: (s) => scene.visit(s),
    steer(x, y) {
      held = { x, y }
      scene.destination = null
    },
    nudge(x, y) {
      if (scene.active()) {
        scene.player.x = Phaser.Math.Clamp(
          scene.player.x + x * 32,
          l.bounds.left,
          l.bounds.right
        )
        scene.player.y = Phaser.Math.Clamp(
          scene.player.y + y * 32,
          l.bounds.top,
          l.bounds.bottom
        )
      }
    },
    undo,
    destroy() {
      disposed = true
      clear()
      host.removeEventListener("keydown", down)
      host.removeEventListener("keyup", up)
      host.removeEventListener("focusout", clear)
      window.removeEventListener("blur", clear)
      document.removeEventListener("visibilitychange", hidden)
      game.destroy(true)
    },
  }
}
