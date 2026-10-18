import Phaser from "phaser"
import type { CargoRegion } from "@amautai/contracts"
import {
  nurseryLayout,
  nurseryStationAt,
  nurseryStationEnabled,
  NurseryStationGate,
} from "./nursery-stations"
import type { NurseryCommand, NurseryStation } from "./nursery-stations"
export type { NurseryCommand, NurseryStation } from "./nursery-stations"
export type NurseryFrame = {
  task: number
  target: number
  trays: number
  units: number
  enabled: boolean
  canUndo: boolean
  score: string
  lives: string
  streak: string
  mission: string
  goal: string
  inventory: string
  tens: string
  ones: string
  stationLabels: Record<NurseryStation, string>
  touchHint: string
  walkHint: string
  saved: string
  hint: string
  feedback: string
  feedbackKind: string
  version: number
  win: string
  planted: number
}
export type NurseryRuntime = {
  sync: (frame: NurseryFrame) => void
  steer: (x: number, y: number) => void
  nudge: (x: number, y: number) => void
  visit: (station: NurseryStation) => void
  undo: () => void
  destroy: () => void
}
export function createNurseryGame(
  host: HTMLElement,
  options: {
    region: CargoRegion
    compact: boolean
    reduced: boolean
    action: (command: NurseryCommand) => void
    deliver: () => void
    undo: () => void
    ready: () => void
    error: () => void
  }
): NurseryRuntime {
  const layout = nurseryLayout(options.compact),
    { width: W, height: H } = layout
  let frame: NurseryFrame | null = null,
    scene: Garden | null = null,
    disposed = false,
    failed = false
  const root = host.parentElement ?? host,
    keys = new Set<string>(),
    moves = new Set([
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "KeyA",
      "KeyD",
      "KeyW",
      "KeyS",
    ])
  let held = { x: 0, y: 0 },
    impulse = { x: 0, y: 0, until: 0 }
  const clear = () => {
    keys.clear()
    held = { x: 0, y: 0 }
    impulse = { x: 0, y: 0, until: 0 }
    scene?.cancelWalk()
  }
  const down = (e: KeyboardEvent) => {
    if (
      !frame?.enabled ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      (e.target instanceof HTMLElement &&
        e.target.closest("input,textarea,select"))
    )
      return
    if (moves.has(e.code)) {
      e.preventDefault()
      keys.add(e.code)
      scene?.cancelWalk()
    }
    if (e.code === "KeyZ" && !e.repeat && frame.canUndo) {
      e.preventDefault()
      scene?.undo()
    }
  }
  const up = (e: KeyboardEvent) => keys.delete(e.code)
  const blur = (e: FocusEvent) => {
    if (!(e.relatedTarget instanceof Node) || !root.contains(e.relatedTarget))
      clear()
  }
  const hidden = () => {
    if (document.hidden) clear()
  }
  root.addEventListener("keydown", down)
  root.addEventListener("keyup", up)
  root.addEventListener("focusout", blur)
  window.addEventListener("blur", clear)
  document.addEventListener("visibilitychange", hidden)
  class Garden extends Phaser.Scene {
    player!: Phaser.GameObjects.Sprite
    shadow!: Phaser.GameObjects.Ellipse
    cargo!: Phaser.GameObjects.Container
    inventory!: Phaser.GameObjects.Container
    outcome!: Phaser.GameObjects.Container
    flowers!: Phaser.GameObjects.Container
    status!: Phaser.GameObjects.Text
    mission!: Phaser.GameObjects.Text
    target!: Phaser.GameObjects.Text
    score!: Phaser.GameObjects.Text
    lives!: Phaser.GameObjects.Text
    streak!: Phaser.GameObjects.Text
    rings!: Phaser.GameObjects.Graphics
    stationCards = new Map<
      NurseryStation,
      {
        box: Phaser.GameObjects.Rectangle
        label: Phaser.GameObjects.Text
        ring: Phaser.GameObjects.Arc
      }
    >()
    velocity = { x: 0, y: 0 }
    destination: NurseryStation | null = null
    gate = new NurseryStationGate()
    task = -1
    version = -1
    inventoryKey = ""
    stationKey = ""
    resultUntil = 0
    lastIntent = 0
    completed = -1
    preload() {
      this.load.image(
        "nursery-world",
        "/games/nursery/v2/" + options.region + ".webp"
      )
      for (const [key, file] of [
        ["gardener", "caretaker"],
        ["plant", "plant"],
        ["tray", "tray"],
      ])
        this.load.atlas(
          key!,
          "/games/nursery/v2/" + file + ".webp",
          "/games/nursery/v1/" + file + ".json"
        )
      this.load.on("loaderror", () => {
        failed = true
        options.error()
      })
    }
    text(
      x: number,
      y: number,
      value: string,
      size = 24,
      color = "#234c40",
      align = "left"
    ) {
      return this.add.text(x, y, value, {
        fontFamily: "Inter Variable, sans-serif",
        fontSize: size + "px",
        color,
        align,
      })
    }
    image(x: number, y: number, key: string, height: number) {
      const image = this.add.image(x, y, key, "0")
      image.setScale(height / image.height)
      return image
    }
    create() {
      if (disposed || failed) return
      const g = this.add.graphics()
      g.fillStyle(0x133e33).fillRect(0, 0, W, H)
      const world = this.add.image(
        W / 2,
        layout.worldTop + layout.worldHeight / 2,
        "nursery-world"
      )
      const cover = Math.max(W / world.width, layout.worldHeight / world.height)
      world.setScale(cover)
      const sceneryMask = this.add
        .graphics()
        .fillStyle(0xffffff)
        .fillRect(0, layout.worldTop, W, layout.worldHeight)
      world.setMask(sceneryMask.createGeometryMask())
      sceneryMask.setVisible(false)
      g.fillStyle(0xe2caa0, 0.86).fillRoundedRect(
        20,
        layout.worldTop + layout.worldHeight - 85,
        W - 40,
        70,
        24
      )
      this.add.rectangle(
        W / 2,
        layout.worldTop + layout.worldHeight - 4,
        W,
        8,
        0x7d9c70
      )
      this.score = this.text(
        22,
        16,
        "",
        options.compact ? 26 : 28,
        "#fff1c6"
      ).setDepth(20)
      this.lives = this.text(
        W - 22,
        16,
        "",
        options.compact ? 22 : 25,
        "#e5edda"
      )
        .setOrigin(1, 0)
        .setDepth(20)
      this.streak = this.text(W / 2, 48, "", 18, "#a9c6ae")
        .setOrigin(0.5, 0)
        .setDepth(20)
      this.add
        .rectangle(W / 2, 125, W - 30, 90, 0xf5edd8)
        .setStrokeStyle(2, 0xd1c5a1)
        .setDepth(18)
      this.add.circle(68, 125, 32, 0x2c6955).setDepth(19)
      this.target = this.text(68, 125, "", 38, "#fff2c2")
        .setOrigin(0.5)
        .setDepth(20)
      this.mission = this.text(118, 95, "", options.compact ? 24 : 27)
        .setWordWrapWidth(W - 150)
        .setDepth(20)
      for (const key of Object.keys(layout.stations) as NurseryStation[]) {
        const { x, y } = layout.stations[key],
          garden = key === "garden"
        const box = this.add
          .rectangle(
            x,
            y - 44,
            layout.cardWidth,
            layout.cardHeight + 4,
            garden ? 0x214e3f : 0xfff6df,
            0.97
          )
          .setStrokeStyle(2, garden ? 0xc3d689 : 0xc6b487)
          .setDepth(3)
        this.add
          .ellipse(x, y + 17, 102, 24, garden ? 0x719858 : 0x456a56, 0.28)
          .setDepth(2)
        const ring = this.add
          .circle(x, y + 15, 29, 0xf2d58d, 0.18)
          .setStrokeStyle(3, garden ? 0xdbeeb8 : 0xbfa56c, 0.8)
          .setScale(1, 0.45)
          .setDepth(3)
        if (key === "unit") this.image(x, y - 57, "plant", 42).setDepth(4)
        else if (key === "tray") {
          this.image(x, y - 57, "tray", 25).setDepth(4)
          for (let i = 0; i < 10; i++)
            this.image(
              x - 34 + (i % 5) * 17,
              y - 65 + Math.floor(i / 5) * 12,
              "plant",
              15
            ).setDepth(5)
        } else if (garden) {
          this.text(x, y - 72, "✓", 40, "#fff1b5")
            .setOrigin(0.5)
            .setDepth(4)
        } else
          this.text(x, y - 66, key === "group" ? "10 → 1" : "1 → 10", 30)
            .setOrigin(0.5)
            .setDepth(4)
        const label = this.text(
          x,
          y - 27,
          "",
          options.compact ? 20 : 21,
          garden ? "#f6f1d5" : "#244a39",
          "center"
        )
          .setOrigin(0.5, 0)
          .setWordWrapWidth(layout.cardWidth - 12)
          .setDepth(5)
        if (key === "unit" || key === "tray")
          this.text(
            x + 52,
            y - 84,
            key === "unit" ? "+1" : "+10",
            23,
            "#23533e"
          )
            .setOrigin(0.5)
            .setDepth(5)
        this.stationCards.set(key, { box, label, ring })
      }
      this.flowers = this.add.container(0, 0).setDepth(2)
      this.shadow = this.add
        .ellipse(layout.spawn.x, layout.spawn.y, 83, 18, 0x292b1d, 0.22)
        .setDepth(8)
      this.player = this.add
        .sprite(layout.spawn.x, layout.spawn.y, "gardener", "0")
        .setOrigin(0.5, 1)
        .setDepth(9)
      this.player.setScale((options.compact ? 95 : 112) / this.player.height)
      this.cargo = this.add.container(0, 0).setDepth(10)
      this.anims.create({
        key: "walk",
        frames: [0, 1, 2, 3].map((i) => ({
          key: "gardener",
          frame: String(i),
        })),
        frameRate: 8,
        repeat: -1,
      })
      this.rings = this.add.graphics().setDepth(6)
      this.inventory = this.add.container(0, 0).setDepth(12)
      if (!options.compact)
        this.add
          .rectangle(
            W / 2,
            layout.worldTop + layout.worldHeight - 29,
            W,
            58,
            0xf5edd8,
            0.95
          )
          .setDepth(11)
      this.status = this.text(
        options.compact ? W - 20 : 24,
        options.compact ? H - 205 : layout.worldTop + layout.worldHeight - 55,
        "",
        options.compact ? 22 : 21,
        options.compact ? "#dbe9c9" : "#244d3d",
        options.compact ? "right" : "left"
      )
        .setOrigin(options.compact ? 1 : 0, 0)
        .setWordWrapWidth(options.compact ? 250 : W - 300)
        .setDepth(13)
      this.outcome = this.add
        .container(W / 2, layout.worldTop + layout.worldHeight / 2)
        .setDepth(30)
      host.querySelector("canvas")?.setAttribute("aria-hidden", "true")
      this.paint()
      options.ready()
    }
    active() {
      return !!frame?.enabled && this.time.now >= this.resultUntil
    }
    cancelWalk() {
      this.destination = null
    }
    undo() {
      if (this.active() && frame?.canUndo) {
        clear()
        this.gate.consume(
          nurseryStationAt(this.player, options.compact) ?? "garden"
        )
        options.undo()
      }
    }
    visit(key: NurseryStation) {
      if (
        !this.active() ||
        !frame ||
        !nurseryStationEnabled(key, frame.trays, frame.units)
      )
        return
      if (
        nurseryStationAt(this.player, options.compact) === key &&
        Math.hypot(this.velocity.x, this.velocity.y) < 30
      ) {
        if (key === "garden" || this.time.now - this.lastIntent < 300) return
        this.gate.consume(key)
        this.perform(key)
        return
      }
      keys.clear()
      held = { x: 0, y: 0 }
      this.destination = key
    }
    perform(key: NurseryStation) {
      if (
        !this.active() ||
        !frame ||
        !nurseryStationEnabled(key, frame.trays, frame.units)
      )
        return
      this.lastIntent = this.time.now
      if (key === "garden") {
        clear()
        this.velocity = { x: 0, y: 0 }
        options.deliver()
      } else options.action(key)
    }
    paint() {
      if (!frame || !this.player) return
      const first = this.task < 0
      if (this.task !== frame.task) {
        this.task = frame.task
        clear()
        this.player.setPosition(layout.spawn.x, layout.spawn.y)
        this.velocity = { x: 0, y: 0 }
        this.gate.enter(null)
      }
      this.score.setText(frame.score)
      this.lives.setText(frame.lives)
      this.streak.setText(frame.streak)
      this.target.setText(String(frame.target))
      this.mission.setText(frame.mission)
      const help = options.compact
        ? (frame.hint.match(/\d+ × 10 \+ \d+ = \d+/)?.[0] ?? "")
        : frame.hint
      this.status.setText(
        frame.enabled
          ? help || (options.compact ? frame.touchHint : frame.walkHint)
          : frame.saved
      )
      const stationKey = [
        frame.stationLabels.unit,
        frame.stationLabels.tray,
        frame.stationLabels.group,
        frame.stationLabels.ungroup,
        frame.stationLabels.garden,
        frame.trays,
        frame.units,
      ].join("|")
      if (stationKey !== this.stationKey) {
        this.stationKey = stationKey
        for (const [key, card] of this.stationCards) {
          const enabled = nurseryStationEnabled(key, frame.trays, frame.units)
          card.label.setText(frame.stationLabels[key])
          card.box.setAlpha(enabled ? 1 : 0.5)
          card.label.setAlpha(enabled ? 1 : 0.55)
        }
      }
      if (frame.version !== this.version) {
        this.version = frame.version
        if (
          !first &&
          (frame.feedbackKind === "correct" || frame.feedbackKind === "wrong")
        )
          this.showOutcome()
      }
      if (this.completed !== frame.planted) {
        this.completed = frame.planted
        this.flowers.removeAll(true)
        const bed = layout.stations.garden
        for (let i = 0; i < Math.min(8, frame.planted); i++)
          this.flowers.add(
            this.image(
              bed.x - 45 + (i % 4) * 28,
              bed.y - 115 - Math.floor(i / 4) * 22,
              "plant",
              24
            )
          )
      }
      const key = [
        frame.task,
        frame.trays,
        frame.units,
        frame.inventory,
        frame.tens,
        frame.ones,
      ].join("|")
      if (key !== this.inventoryKey) {
        const before = this.inventoryKey
        this.inventoryKey = key
        this.drawInventory()
        if (before && !first && !options.reduced) {
          for (let i = 0; i < 5; i++) {
            const plant = this.image(
              this.player.x + (i - 2) * 12,
              this.player.y - 40,
              "plant",
              24
            ).setDepth(25)
            this.tweens.add({
              targets: plant,
              x: W / 2 + (i - 2) * 25,
              y: layout.inventoryTop + 30,
              alpha: 0,
              duration: 470,
              delay: i * 35,
              onComplete: () => plant.destroy(),
            })
          }
        }
      }
    }
    drawInventory() {
      if (!frame) return
      this.inventory.removeAll(true)
      this.cargo.removeAll(true)
      const y = layout.inventoryTop,
        half = W / 2,
        total = frame.trays * 10 + frame.units
      const panel = this.add
        .graphics()
        .fillStyle(0x123b31)
        .fillRoundedRect(14, y, W - 28, layout.inventoryHeight, 18)
        .lineStyle(1, 0x608771)
        .strokeRoundedRect(14, y, W - 28, layout.inventoryHeight, 18)
      this.inventory.add(panel)
      this.inventory.add(
        this.text(
          30,
          y + 12,
          frame.inventory,
          options.compact ? 23 : 25,
          "#cce0ce"
        )
      )
      this.inventory.add(
        this.text(
          30,
          y + 48,
          frame.tens,
          options.compact ? 20 : 21,
          "#cce0ce"
        ).setWordWrapWidth(half - 130)
      )
      this.inventory.add(
        this.text(
          half + 14,
          y + 48,
          frame.ones,
          options.compact ? 20 : 21,
          "#cce0ce"
        ).setWordWrapWidth(half - 130)
      )
      this.inventory.add(
        this.text(
          half - 35,
          y + 44,
          String(frame.trays),
          36,
          "#fff2c2"
        ).setOrigin(1, 0)
      )
      this.inventory.add(
        this.text(W - 35, y + 44, String(frame.units), 36, "#fff2c2").setOrigin(
          1,
          0
        )
      )
      const trayWidth = options.compact ? 72 : 135,
        trayRow = options.compact ? 43 : 35,
        start = y + (options.compact ? 111 : 100)
      for (let i = 0; i < frame.trays; i++) {
        const x = 30 + trayWidth / 2 + ((i % 3) * (half - 50)) / 3,
          ty = start + Math.floor(i / 3) * trayRow
        this.inventory.add(
          this.image(x, ty, "tray", options.compact ? 25 : 29).setDisplaySize(
            trayWidth,
            options.compact ? 25 : 29
          )
        )
        for (let j = 0; j < 10; j++)
          this.inventory.add(
            this.image(
              x - trayWidth * 0.34 + (j % 5) * trayWidth * 0.17,
              ty - 6 + Math.floor(j / 5) * 10,
              "plant",
              options.compact ? 11 : 14
            )
          )
      }
      const columns = options.compact ? 10 : 20,
        pitch = (half - 48) / columns,
        row = options.compact ? 13 : 18
      for (let i = 0; i < frame.units; i++)
        this.inventory.add(
          this.image(
            half + 25 + (i % columns) * pitch,
            start - 8 + Math.floor(i / columns) * row,
            "plant",
            options.compact ? 12 : 17
          )
        )
      if (total) {
        if (frame.trays)
          this.cargo.add(this.image(0, 0, "tray", 14).setDisplaySize(40, 14))
        for (let i = 0; i < Math.min(3, total); i++)
          this.cargo.add(this.image(-12 + i * 12, -13, "plant", 22))
        this.cargo.add(
          this.text(0, 2, String(total), 18, "#fff4cf")
            .setOrigin(0.5)
            .setBackgroundColor("#173e33")
            .setPadding(4, 1)
        )
      }
    }
    showOutcome() {
      if (!frame) return
      clear()
      this.velocity = { x: 0, y: 0 }
      this.resultUntil = this.time.now + 1700
      this.outcome.removeAll(true)
      const correct = frame.feedbackKind === "correct",
        width = W - 80
      this.outcome.add(
        this.add
          .rectangle(0, 0, width, 142, 0x153f32, 0.98)
          .setStrokeStyle(3, correct ? 0xf0d18d : 0xdba58d)
      )
      this.outcome.add(
        this.text(
          0,
          -45,
          correct ? frame.win : frame.feedback,
          correct ? 42 : 23,
          correct ? "#ffe2a3" : "#ffe9d4",
          "center"
        )
          .setOrigin(0.5, 0)
          .setWordWrapWidth(width - 32)
      )
      if (correct)
        this.outcome.add(
          this.text(0, 16, frame.feedback, 28, "#fff8e4", "center").setOrigin(
            0.5,
            0
          )
        )
      if (correct && !options.reduced)
        for (let i = 0; i < 20; i++) {
          const particle = this.add
            .rectangle(
              W / 2,
              layout.worldTop + 170,
              6,
              9,
              [0xffd98a, 0xc3e3aa, 0xf5b49a][i % 3]
            )
            .setDepth(32)
          this.tweens.add({
            targets: particle,
            x: W / 2 + Math.cos(i) * W * 0.34,
            y: layout.worldTop + 130 + Math.sin(i) * 110,
            alpha: 0,
            angle: i * 27,
            duration: 850,
            onComplete: () => particle.destroy(),
          })
        }
    }
    update(_time: number, delta: number) {
      if (!frame || !this.player) return
      const enabled = this.active(),
        dir = { x: 0, y: 0 }
      this.outcome.setVisible(this.time.now < this.resultUntil)
      if (enabled) {
        dir.x =
          Number(keys.has("ArrowRight") || keys.has("KeyD")) -
          Number(keys.has("ArrowLeft") || keys.has("KeyA")) +
          held.x
        dir.y =
          Number(keys.has("ArrowDown") || keys.has("KeyS")) -
          Number(keys.has("ArrowUp") || keys.has("KeyW")) +
          held.y
        if (performance.now() < impulse.until) {
          dir.x += impulse.x
          dir.y += impulse.y
        }
        if (this.destination) {
          const target = layout.stations[this.destination],
            dx = target.x - this.player.x,
            dy = target.y - this.player.y,
            distance = Math.hypot(dx, dy)
          if (distance < 5) this.destination = null
          else {
            dir.x = dx / distance
            dir.y = dy / distance
          }
        }
      }
      const dt = Math.max(0, Math.min(60, delta)) / 1000,
        speed = options.compact ? 205 : 270,
        blend = 1 - Math.exp(-14 * dt),
        length = Math.max(1, Math.hypot(dir.x, dir.y))
      this.velocity.x += ((dir.x / length) * speed - this.velocity.x) * blend
      this.velocity.y += ((dir.y / length) * speed - this.velocity.y) * blend
      this.player.x = Phaser.Math.Clamp(
        this.player.x + this.velocity.x * dt,
        layout.bounds.left,
        layout.bounds.right
      )
      this.player.y = Phaser.Math.Clamp(
        this.player.y + this.velocity.y * dt,
        layout.bounds.top,
        layout.bounds.bottom
      )
      const moving = Math.hypot(this.velocity.x, this.velocity.y) > 24
      if (moving) {
        if (Math.abs(this.velocity.x) > 8)
          this.player.setFlipX(this.velocity.x < 0)
        if (!options.reduced && !this.player.anims.isPlaying)
          this.player.play("walk")
      } else {
        this.player.anims.stop()
        this.player.setFrame("0")
      }
      this.shadow.setPosition(this.player.x, this.player.y)
      this.cargo.setPosition(
        this.player.x + (this.player.flipX ? -27 : 27),
        this.player.y - 35
      )
      const station = nurseryStationAt(this.player, options.compact),
        available =
          station !== null &&
          nurseryStationEnabled(station, frame.trays, frame.units)
      this.rings.clear()
      for (const [key, card] of this.stationCards)
        card.ring.setStrokeStyle(
          key === station ? 4 : 2,
          key === station ? 0xfff0a8 : 0xc6b17b,
          key === station ? 1 : 0.7
        )
      if (this.destination) {
        const p = layout.stations[this.destination]
        this.rings
          .lineStyle(2, 0xf8efbd, 0.65)
          .lineBetween(this.player.x, this.player.y, p.x, p.y + 14)
      }
      if (
        this.gate.tick(station, enabled && available, !moving, this.time.now) &&
        station
      )
        this.perform(station)
    }
  }
  const garden = new Garden()
  scene = garden
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width: W,
    height: H,
    backgroundColor: "#133e33",
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: garden,
    audio: { noAudio: true },
  })
  return {
    sync(next) {
      frame = next
      if (!next.enabled) clear()
      scene?.paint()
    },
    steer(x, y) {
      held = { x, y }
      scene?.cancelWalk()
    },
    nudge(x, y) {
      scene?.cancelWalk()
      impulse = { x, y, until: performance.now() + 180 }
    },
    visit: (key) => scene?.visit(key),
    undo: () => scene?.undo(),
    destroy() {
      disposed = true
      clear()
      root.removeEventListener("keydown", down)
      root.removeEventListener("keyup", up)
      root.removeEventListener("focusout", blur)
      window.removeEventListener("blur", clear)
      document.removeEventListener("visibilitychange", hidden)
      game.destroy(true)
    },
  }
}
