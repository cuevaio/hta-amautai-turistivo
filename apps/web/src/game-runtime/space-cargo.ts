import Phaser from "phaser"
import { canCatch, flightBounds, moveBird } from "./cargo-controls"
import type { Point } from "./cargo-controls"
import type { CargoRegion } from "@amautai/contracts"
export type FoodHud = {
  score: string
  goal: string
  lives: string
  level: string
  win: string
  scoreValue: number
  feedbackVersion: number
  feedback: string
  progress: string
  instruction: string
  status: string
}
export type CargoRuntime = {
  challenge: (
    value: number,
    current: number,
    target: number,
    hud: FoodHud
  ) => void
  pause: (paused: boolean) => void
  steer: (x: number, y: number) => void
  step: (x: number, y: number) => void
  launch: () => void
  destroy: () => void
}
export function createCargoGame(
  host: HTMLElement,
  options: {
    region: CargoRegion
    reducedMotion: boolean
    onCollect: (value: number | null) => void
    onReady: () => void
    onError: () => void
  }
): CargoRuntime {
  const base = "/games/space-cargo/pixel/"
  const bird = {
    coast: "pelican",
    highlands: "condor",
    jungle: "cock-of-the-rock",
  }[options.region]
  const food = { coast: "fish", highlands: "food", jungle: "fruit" }[
    options.region
  ]
  const background =
    options.region === "jungle" ? "cloud-forest" : options.region
  let value = 4,
    target = 12,
    stopped = false,
    dead = false,
    failed = false,
    waiting = false,
    celebrating = false
  let held: Point = { x: 0, y: 0 },
    destination: Point | null = null
  let hud: FoodHud = {
    score: "",
    goal: "",
    lives: "",
    level: "",
    win: "",
    scoreValue: 0,
    feedbackVersion: 0,
    feedback: "",
    progress: "",
    instruction: "",
    status: "",
  }
  const keys = new Set<string>(),
    movementKeys = new Set([
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "KeyA",
      "KeyD",
      "KeyW",
      "KeyS",
    ])
  const clearInput = () => {
    keys.clear()
    held = { x: 0, y: 0 }
    destination = null
  }
  const keydown = (e: KeyboardEvent) => {
    if (
      !movementKeys.has(e.code) ||
      stopped ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey
    )
      return
    e.preventDefault()
    keys.add(e.code)
    destination = null
  }
  const keyup = (e: KeyboardEvent) => {
    keys.delete(e.code)
  }
  const visibility = () => {
    if (document.hidden) clearInput()
  }
  document.addEventListener("visibilitychange", visibility)
  host.addEventListener("keydown", keydown)
  host.addEventListener("keyup", keyup)
  host.addEventListener("blur", clearInput)
  window.addEventListener("blur", clearInput)
  class NatureScene extends Phaser.Scene {
    player?: Phaser.GameObjects.Sprite
    scoreText?: Phaser.GameObjects.Text
    goalText?: Phaser.GameObjects.Text
    livesText?: Phaser.GameObjects.Text
    levelText?: Phaser.GameObjects.Text
    instructionText?: Phaser.GameObjects.Text
    progressText?: Phaser.GameObjects.Text
    statusText?: Phaser.GameObjects.Text
    feedbackUntil = 0
    feedbackBox?: Phaser.GameObjects.Container
    drops: { sprite: Phaser.GameObjects.Container; value: number }[] = []
    count = 0
    preload() {
      this.load.image("land", base + background + ".png")
      this.load.atlas("meal", base + food + ".png", base + food + "-atlas.json")
      this.load.atlas(
        "bird",
        base + bird + "-sheet.png",
        base + bird + "-atlas.json"
      )
      this.load.on("loaderror", () => {
        failed = true
        if (!dead) options.onError()
      })
    }
    create() {
      if (failed) return
      this.cameras.main.setScroll(0, 104)
      this.add.image(480, 320, "land").setDisplaySize(960, 640)
      this.anims.create({
        key: "fly",
        frames: [0, 1, 2, 3].map((n) => ({ key: "bird", frame: String(n) })),
        frameRate: 5,
        repeat: -1,
      })
      this.player = this.add.sprite(430, 390, "bird", "0").setDepth(4)
      this.player.setScale(
        140 / Math.max(this.player.width, this.player.height)
      )
      if (!options.reducedMotion) this.player.play("fly")
      const pointTo = (p: Phaser.Input.Pointer) => {
        if (stopped) return
        host.focus({ preventScroll: true })
        const point = this.cameras.main.getWorldPoint(p.x, p.y)
        destination = {
          x: Phaser.Math.Clamp(point.x, flightBounds.left, flightBounds.right),
          y: Phaser.Math.Clamp(point.y, flightBounds.top, flightBounds.bottom),
        }
      }
      this.input.on("pointerdown", pointTo)
      this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
        if (p.isDown) pointTo(p)
      })
      this.spawn()
      this.time.addEvent({
        delay: 1500,
        loop: true,
        callback: () => this.spawn(),
      })
      if (!dead) options.onReady()
    }
    spawn() {
      if (stopped || celebrating || this.drops.length >= 8) return
      const n = this.count++,
        amount = n % 3 === 2 ? (value === 5 ? 3 : value + 1) : value
      const x = 130 + ((n * 173 + 300) % 560)
      const sprite = this.add.container(x, 160)
      sprite.add(
        this.add
          .rectangle(0, 0, 124, 104, 0xfff9e9, 0.97)
          .setStrokeStyle(2, 0x173e3b)
      )
      for (let i = 0; i < amount; i++) {
        const icon = this.add.image(
          -36 + (i % 3) * 36,
          -27 + Math.floor(i / 3) * 29,
          "meal",
          "item"
        )
        icon.setScale(32 / Math.max(icon.width, icon.height))
        sprite.add(icon)
      }
      sprite.add(
        this.add
          .text(0, 38, String(amount), {
            fontFamily: "sans-serif",
            fontSize: "44px",
            color: "#102f38",
            backgroundColor: "#fff9e9",
            padding: { x: 4, y: 1 },
          })
          .setOrigin(0.5)
      )
      this.drops.push({ sprite, value: amount })
    }
    remove(drop: NatureScene["drops"][number]) {
      drop.sprite.destroy(true)
      this.drops = this.drops.filter((d) => d !== drop)
    }
    update(_time: number, delta: number) {
      if (
        stopped ||
        waiting ||
        celebrating ||
        this.time.now < this.feedbackUntil ||
        !this.player
      )
        return
      const dir = {
        x:
          held.x +
          Number(keys.has("ArrowRight") || keys.has("KeyD")) -
          Number(keys.has("ArrowLeft") || keys.has("KeyA")),
        y:
          held.y +
          Number(keys.has("ArrowDown") || keys.has("KeyS")) -
          Number(keys.has("ArrowUp") || keys.has("KeyW")),
      }
      if (destination && dir.x === 0 && dir.y === 0) {
        const dx = destination.x - this.player.x,
          dy = destination.y - this.player.y,
          distance = Math.hypot(dx, dy)
        if (distance <= (330 * Math.min(delta, 50)) / 1000) {
          this.player.setPosition(destination.x, destination.y)
          destination = null
        } else {
          dir.x = dx / distance
          dir.y = dy / distance
        }
      }
      const next = moveBird(this.player, dir, delta)
      this.player.setPosition(next.x, next.y)
      if (dir.x) this.player.setFlipX(dir.x < 0)
      for (const drop of [...this.drops]) {
        drop.sprite.y += Math.min(delta, 50) * 0.07
        if (canCatch(this.player, drop.sprite)) {
          this.remove(drop)
          waiting = true
          options.onCollect(drop.value)
          break
        } else if (drop.sprite.y > 555) this.remove(drop)
      }
    }
  }
  const scene = new NatureScene("nature")
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width: 960,
    height: 536,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    backgroundColor: "#bddde3",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [scene],
    audio: { noAudio: true },
    banner: false,
  })
  return {
    challenge(next, _current, goal, nextHud) {
      if (value !== next || target !== goal) {
        for (const drop of [...scene.drops]) scene.remove(drop)
        scene.count = 0
      }
      if (nextHud.scoreValue < hud.scoreValue && scene.player) {
        scene.player.setTint(0xff6666)
        scene.time.delayedCall(350, () => scene.player?.clearTint())
      }
      if (
        nextHud.feedbackVersion !== hud.feedbackVersion &&
        nextHud.feedback &&
        scene.player
      ) {
        scene.feedbackBox?.destroy(true)
        const wrong = nextHud.scoreValue < hud.scoreValue
        if (wrong) clearInput()
        scene.feedbackUntil = wrong ? scene.time.now + 2200 : 0
        const box = scene.add.container(480, wrong ? 270 : 565).setDepth(20)
        scene.feedbackBox = box
        box.add(
          scene.add
            .rectangle(
              0,
              0,
              wrong ? 790 : 660,
              wrong ? 126 : 78,
              0x102f38,
              0.97
            )
            .setStrokeStyle(3, wrong ? 0xf09b73 : 0xffda65)
        )
        box.add(
          scene.add
            .text(0, 0, nextHud.feedback, {
              fontFamily: "sans-serif",
              fontSize: "28px",
              color: "#ffffff",
              align: "center",
              wordWrap: { width: 730 },
            })
            .setOrigin(0.5)
        )
        scene.time.delayedCall(wrong ? 2200 : 1600, () => {
          box.destroy(true)
          if (scene.feedbackBox === box) scene.feedbackBox = undefined
        })
      }
      value = next
      target = goal
      hud = nextHud
      scene.scoreText?.setText(hud.score)
      scene.goalText?.setText(hud.goal)
      scene.livesText?.setText(hud.lives)
      scene.levelText?.setText(hud.level)
      scene.instructionText?.setText(hud.instruction)
      scene.progressText?.setText(hud.progress)
      scene.statusText?.setText(hud.status).setVisible(!!hud.status)
    },
    pause(paused) {
      stopped = paused
      if (paused) clearInput()
      else waiting = false
      if (scene.sys.isActive()) {
        if (paused) scene.sys.pause()
      } else if (!paused && scene.sys.isPaused()) scene.sys.resume()
    },
    steer(x, y) {
      if (stopped) return
      destination = null
      held = { x, y }
    },
    step(x, y) {
      if (stopped || !scene.player) return
      destination = {
        x: Phaser.Math.Clamp(
          scene.player.x + x * 100,
          flightBounds.left,
          flightBounds.right
        ),
        y: Phaser.Math.Clamp(
          scene.player.y + y * 100,
          flightBounds.top,
          flightBounds.bottom
        ),
      }
    },
    launch() {
      if (!scene.sys.isActive()) return
      celebrating = true
      for (const drop of [...scene.drops]) scene.remove(drop)
      const box = scene.add
        .rectangle(480, 300, 570, 140, 0x102f38, 0.95)
        .setDepth(20)
      const text = scene.add
        .text(480, 300, hud.win, {
          fontFamily: "sans-serif",
          fontSize: "48px",
          color: "#ffda65",
        })
        .setOrigin(0.5)
        .setDepth(21)
      scene.time.delayedCall(1200, () => {
        box.destroy()
        text.destroy()
        celebrating = false
      })
    },
    destroy() {
      dead = true
      clearInput()
      host.removeEventListener("keydown", keydown)
      host.removeEventListener("keyup", keyup)
      host.removeEventListener("blur", clearInput)
      window.removeEventListener("blur", clearInput)
      document.removeEventListener("visibilitychange", visibility)
      game.destroy(true)
    },
  }
}
