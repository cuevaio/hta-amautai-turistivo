import { FairBalance } from "./fair-balance"
import Phaser from "phaser"
import type { FairTask, CargoRegion } from "@amautai/contracts"
import { fairLayout, fairStationAt, FairVisitGate } from "./fair-stations"
import type { FairStation } from "./fair-stations"
export type FairFrame = {
  task: FairTask
  selected: number | null
  enabled: boolean
  version: number
  score: string
  lives: string
  streak: string
  mission: string
  equation: string
  fixed: string
  editable: string
  delivery: string
  packet: string
  carrying: string
  chooseHint: string
  deliverHint: string
  hint: string
  saving: string
  win: string
  feedback: string
  feedbackKind: "" | "correct" | "wrong" | "help"
}
export type FairRuntime = {
  sync: (frame: FairFrame) => void
  visit: (station: FairStation) => void
  steer: (x: number, y: number) => void
  nudge: (x: number, y: number) => void
  undo: () => void
  destroy: () => void
}
export function createFairGame(
  host: HTMLElement,
  options: {
    region: CargoRegion
    compact: boolean
    reduced: boolean
    select: (n: number) => void
    deliver: () => void
    undo: () => void
    ready: () => void
    error: () => void
  }
): FairRuntime {
  const l = fairLayout(options.compact),
    W = l.width,
    H = l.height
  let frame: FairFrame | null = null,
    disposed = false,
    failed = false
  let resultEquation = ""
  let resultDisplay: { previous: FairFrame; actual: number } | null = null
  const keys = new Set<string>()
  let held = { x: 0, y: 0 }
  const clear = () => {
    keys.clear()
    held = { x: 0, y: 0 }
    if (scene) scene.destination = null
  }
  const moves = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
  ])
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
      if (scene) scene.destination = null
    }
    if (e.code === "KeyZ" && !e.repeat) {
      e.preventDefault()
      options.undo()
    }
  }
  const up = (e: KeyboardEvent) => {
    keys.delete(e.code)
  }
  const blur = () => clear()
  const hidden = () => {
    if (document.hidden) clear()
  }
  host.addEventListener("keydown", down)
  host.addEventListener("keyup", up)
  host.addEventListener("focusout", blur)
  window.addEventListener("blur", blur)
  document.addEventListener("visibilitychange", hidden)
  class Fair extends Phaser.Scene {
    balance!: FairBalance
    player!: Phaser.GameObjects.Sprite
    shadow!: Phaser.GameObjects.Ellipse
    cargo!: Phaser.GameObjects.Container
    board!: Phaser.GameObjects.Container
    outcome!: Phaser.GameObjects.Container
    score!: Phaser.GameObjects.Text
    lives!: Phaser.GameObjects.Text
    streak!: Phaser.GameObjects.Text
    mission!: Phaser.GameObjects.Text
    equation!: Phaser.GameObjects.Text
    instruction!: Phaser.GameObjects.Text
    destination: FairStation | null = null
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
      const food = { coast: "fish", highlands: "corn", jungle: "banana" }[
        options.region
      ]
      this.load.atlas(
        "food",
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
      color = "#204a40",
      align = "left"
    ) {
      return this.add.text(x, y, value, {
        fontFamily: "Inter Variable, sans-serif",
        fontSize: size + "px",
        color,
        align,
      })
    }
    create() {
      if (disposed || failed) return
      this.add.rectangle(W / 2, H / 2, W, H, 0x123c32)
      const world = this.add.image(W / 2, (220 + l.worldBottom) / 2, "world")
      world.setScale(
        Math.max(W / world.width, (l.worldBottom - 220) / world.height)
      )
      const mask = this.add
        .graphics()
        .fillStyle(0xffffff)
        .fillRect(0, 220, W, l.worldBottom - 220)
      world.setMask(mask.createGeometryMask())
      mask.setVisible(false)
      this.add
        .rectangle(W / 2, 142, W - 24, 144, 0xf7efd9)
        .setStrokeStyle(1, 0xc8af77)
      this.score = this.text(22, 18, "", options.compact ? 25 : 26, "#fff1c9")
      this.lives = this.text(
        W - 22,
        18,
        "",
        options.compact ? 22 : 24,
        "#e4ecd6"
      ).setOrigin(1, 0)
      this.streak = this.text(W / 2, 49, "", 17, "#c8dac5").setOrigin(0.5, 0)
      this.mission = this.text(
        30,
        84,
        "",
        options.compact ? 23 : 26
      ).setWordWrapWidth(W - 60)
      this.equation = this.text(
        W / 2,
        158,
        "",
        options.compact ? 34 : 38
      ).setOrigin(0.5, 0)
      this.board = this.add.container(0, 0)
      this.balance = new FairBalance(this, options.compact, options.reduced)
      this.shadow = this.add
        .ellipse(l.spawn.x, l.spawn.y, 62, 17, 0x3b3124, 0.24)
        .setDepth(9)
      this.player = this.add
        .sprite(l.spawn.x, l.spawn.y, "helper", "0")
        .setOrigin(0.5, 1)
        .setDepth(10)
      this.player.setScale((options.compact ? 130 : 110) / this.player.height)
      this.anims.create({
        key: "walk",
        frames: [0, 1, 2, 3].map((n) => ({ key: "helper", frame: String(n) })),
        frameRate: 7,
        repeat: -1,
      })
      this.cargo = this.add.container(0, 0).setDepth(11)
      this.add.rectangle(W / 2, l.worldBottom + 2, W, 5, 0xb6ca90)
      this.instruction = this.text(
        24,
        l.worldBottom + 22,
        "",
        options.compact ? 22 : 23,
        "#f6ebc7"
      ).setWordWrapWidth(W - 48)
      this.outcome = this.add.container(W / 2, 142).setDepth(40)
      host.querySelector("canvas")?.setAttribute("aria-hidden", "true")
      this.paint()
      options.ready()
    }
    active() {
      return !!frame?.enabled && this.time.now >= this.until
    }
    visit(station: FairStation) {
      if (
        !this.active() ||
        (station === "delivery" && frame?.selected === null)
      )
        return
      clear()
      this.destination = station
    }
    food(x: number, y: number, size: number) {
      const sprite = this.add.image(x, y, "food", "item")
      sprite.setScale(size / Math.max(sprite.width, sprite.height))
      return sprite
    }
    paint() {
      if (!frame || !this.player) return
      const display = resultDisplay?.previous ?? frame
      this.balance.sync(
        display.task.target,
        resultDisplay?.actual ?? display.task.base,
        display.fixed,
        display.editable
      )
      if (this.task !== display.task.id) {
        this.task = display.task.id
        clear()
        this.gate.reset()
        this.player.setPosition(l.spawn.x, l.spawn.y)
      }
      this.score.setText(frame.score)
      this.lives.setText(frame.lives)
      this.streak.setText(frame.streak)
      this.mission.setText(display.mission).setVisible(!resultDisplay)
      this.equation
        .setText(resultDisplay ? resultEquation : frame.equation)
        .setVisible(!resultDisplay)
      this.instruction.setText(
        !frame.enabled
          ? frame.saving
          : frame.hint ||
              (frame.selected === null ? frame.chooseHint : frame.deliverHint)
      )
      const drawing = [
        resultDisplay?.actual,
        display.task.id,
        display.selected,
        display.fixed,
        display.editable,
        display.delivery,
        display.packet,
        display.carrying,
      ].join("|")
      if (drawing !== this.drawing) {
        this.drawing = drawing
        this.board.removeAll(true)
        this.cargo.removeAll(true)
        this.board.add(
          this.add
            .rectangle(
              l.delivery.x,
              l.delivery.y - 2,
              options.compact ? 208 : 240,
              49,
              0x265949
            )
            .setStrokeStyle(2, 0xe4cc8a)
        )
        this.board.add(
          this.text(
            l.delivery.x,
            l.delivery.y - 19,
            display.delivery,
            22,
            "#fff2c9",
            "center"
          )
            .setOrigin(0.5, 0)
            .setWordWrapWidth(options.compact ? 200 : 230)
        )
        display.task.choices.forEach((n, i) => {
          const p = l.supplies[i]!,
            selected = n === display.selected
          this.board.add(
            this.add
              .rectangle(
                p.x,
                l.supplyTop + l.supplyHeight / 2,
                l.cardWidth,
                l.supplyHeight,
                selected ? 0xf8d47a : 0xfff0ce,
                0.97
              )
              .setStrokeStyle(selected ? 4 : 2, selected ? 0x265949 : 0xb99454)
          )
          this.board.add(
            this.text(
              p.x,
              l.supplyTop + 8,
              display.packet,
              options.compact ? 19 : 20,
              "#39563e",
              "center"
            )
              .setOrigin(0.5, 0)
              .setWordWrapWidth(l.cardWidth - 12)
          )
          this.board.add(
            this.text(p.x, l.supplyTop + 35, String(n), 34).setOrigin(0.5, 0)
          )
          for (let j = 0; j < n; j++)
            this.board.add(
              this.food(
                p.x - 50 + (j % 5) * 25,
                l.supplyTop + 79 + Math.floor(j / 5) * 14,
                16
              )
            )
          this.board.add(
            this.add.ellipse(
              p.x,
              p.y,
              72,
              18,
              selected ? 0x275c49 : 0x9c7c43,
              0.32
            )
          )
        })
        if (!resultDisplay && frame.selected !== null) {
          this.cargo.add(
            this.add
              .rectangle(0, 0, 46, 32, 0x1e4e41, 0.95)
              .setStrokeStyle(1, 0xf5d38b)
          )
          this.cargo.add(
            this.text(0, -14, String(frame.selected), 24, "#fff2c9").setOrigin(
              0.5,
              0
            )
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
          this.until = this.time.now + 1800
          this.outcome.removeAll(true)
          this.outcome.add(
            this.add
              .rectangle(
                0,
                0,
                W - 54,
                142,
                frame.feedbackKind === "correct" ? 0x204f3e : 0x673f31,
                0.98
              )
              .setStrokeStyle(2, 0xe7cc8c)
          )
          this.outcome.add(
            this.text(
              0,
              -60,
              frame.feedbackKind === "correct" ? frame.win : frame.feedback,
              options.compact ? 28 : 32,
              "#fff1c4",
              "center"
            )
              .setOrigin(0.5, 0)
              .setWordWrapWidth(W - 90)
          )
          if (frame.feedbackKind === "correct")
            this.outcome.add(
              this.text(
                0,
                30,
                frame.feedback,
                27,
                "#fff1c4",
                "center"
              ).setOrigin(0.5, 0)
            )
          this.outcome.add(
            this.text(
              0,
              -16,
              resultEquation,
              options.compact ? 30 : 34,
              "#fff1c4",
              "center"
            ).setOrigin(0.5, 0)
          )
          if (!options.reduced)
            this.tweens.add({
              targets: this.outcome,
              scaleX: { from: 0.96, to: 1 },
              scaleY: { from: 0.96, to: 1 },
              duration: 180,
              ease: "Back.Out",
            })
          this.time.delayedCall(1800, () => {
            this.outcome.removeAll(true)
            resultDisplay = null
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
        Number(keys.has("ArrowLeft") || keys.has("KeyA"))
      let dy =
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
            : l.supplies[this.destination]!
        const x = p.x - this.player.x,
          y = p.y - this.player.y,
          distance = Math.hypot(x, y)
        if (distance < 6) {
          this.player.setPosition(p.x, p.y)
          this.destination = null
        } else {
          dx = x / distance
          dy = y / distance
        }
      }
      const norm = Math.hypot(dx, dy),
        dt = Math.min(delta, 40) / 1000
      if (norm) {
        const speed = options.compact ? 240 : 280
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
      this.shadow.setPosition(this.player.x, this.player.y - 4)
      this.cargo.setPosition(
        this.player.x + (this.player.flipX ? -24 : 24),
        this.player.y - 54
      )
      const station = fairStationAt(
        this.player.x,
        this.player.y,
        options.compact
      )
      const enabled =
        this.active() && (station !== "delivery" || frame.selected !== null)
      if (
        this.gate.update(station, this.time.now, !norm, enabled) &&
        station !== null
      ) {
        if (station === "delivery") options.deliver()
        else options.select(frame.task.choices[station]!)
      }
    }
  }
  const scene = new Fair()
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width: W,
    height: H,
    backgroundColor: "#123c32",
    pixelArt: true,
    scene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true },
    banner: false,
  })
  return {
    sync(next) {
      if (
        frame &&
        next.version !== frame.version &&
        frame.selected !== null &&
        (next.feedbackKind === "correct" || next.feedbackKind === "wrong")
      ) {
        const previous = frame,
          t = previous.task
        const actual =
          t.operation === "remove"
            ? t.base - previous.selected!
            : t.base + previous.selected!
        resultDisplay = { previous, actual }
        const left = t.leftB ? `${t.leftA} + ${t.leftB}` : String(t.target)
        resultEquation =
          next.feedbackKind === "correct"
            ? `${left} = ${t.base} ${t.operation === "remove" ? "−" : "+"} ${previous.selected}`
            : `${t.target} ≠ ${actual}`
      }
      frame = next
      if (!next.enabled) clear()
      scene?.paint()
    },
    visit(station) {
      scene?.visit(station)
    },
    steer(x, y) {
      held = { x, y }
      if (scene) scene.destination = null
    },
    nudge(x, y) {
      if (scene?.active()) {
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
    undo() {
      clear()
      options.undo()
    },
    destroy() {
      disposed = true
      clear()
      host.removeEventListener("keydown", down)
      host.removeEventListener("keyup", up)
      host.removeEventListener("focusout", blur)
      window.removeEventListener("blur", blur)
      document.removeEventListener("visibilitychange", hidden)
      game.destroy(true)
    },
  }
}
