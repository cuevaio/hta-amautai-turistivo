import { MarketDeliveryGate } from "./market-delivery"
import {
  approachMarket,
  driveMarket,
  marketTapTarget,
  marketZoneAt,
} from "./market-controls"
import type { MarketZone } from "./market-controls"
import Phaser from "phaser"
import type { CargoRegion } from "@amautai/contracts"
export type MarketFrame = {
  quantity: number
  stop: number
  task: number
  operation: "+" | "−"
  remaining: number
  action: string
  enabled: boolean
  cargo: string
  source: string
  destination: string
  scoreLabel: string
  livesLabel: string
  streakLabel: string
  winLabel: string
  feedbackText: string
  feedbackVersion: number
  feedbackKind: string
  instruction: string
}
export type MarketRuntime = {
  sync: (frame: MarketFrame) => void
  steer: (x: number, y: number) => void
  step: (x: number, y: number) => void
  interact: (amount: number) => void
  destroy: () => void
}
export function createMarketGame(
  host: HTMLElement,
  options: {
    region: CargoRegion
    reduced: boolean
    ready: () => void
    error: () => void
    transfer: (amount: number) => void
    checkout: () => void
    zone: (zone: MarketZone) => void
  }
): MarketRuntime {
  const base = "/games/market/v2/",
    vehicleName = {
      coast: "tricycle",
      highlands: "llama",
      jungle: "peque-peque",
    }[options.region],
    foodName = { coast: "fish", highlands: "corn", jungle: "banana" }[
      options.region
    ]
  let latest: MarketFrame = {
      quantity: 0,
      stop: 0,
      task: 0,
      operation: "+",
      enabled: false,
      remaining: 0,
      action: "",
      cargo: "",
      source: "",
      destination: "",
      scoreLabel: "",
      livesLabel: "",
      streakLabel: "",
      winLabel: "",
      feedbackText: "",
      feedbackVersion: 0,
      feedbackKind: "",
      instruction: "",
    },
    dead = false,
    failed = false
  const inputRoot = host.parentElement ?? host
  const keys = new Set<string>(),
    moveKeys = new Set([
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "KeyA",
      "KeyD",
      "KeyW",
      "KeyS",
    ])
  let destination: { x: number; y: number } | null = null
  let held = { x: 0, y: 0 },
    impulse = { x: 0, y: 0, until: 0 }
  const clearKeys = () => keys.clear()
  const clearInput = () => {
    keys.clear()
    destination = null
    held = { x: 0, y: 0 }
    impulse = { x: 0, y: 0, until: 0 }
  }
  const keydown = (event: KeyboardEvent) => {
    if (!latest.enabled || event.metaKey || event.ctrlKey || event.altKey)
      return
    if (moveKeys.has(event.code)) {
      event.preventDefault()
      keys.add(event.code)
      destination = null
    } else if (event.code === "Space" || event.code === "KeyE") {
      if (
        event.code === "Space" &&
        event.target instanceof HTMLElement &&
        event.target.closest("button")
      )
        return
      event.preventDefault()
      if (!event.repeat) scene.request(event.shiftKey ? 10 : 1)
    }
  }
  const keyup = (event: KeyboardEvent) => keys.delete(event.code)
  const visibility = () => {
    if (document.hidden) clearInput()
  }
  const focusout = (event: FocusEvent) => {
    if (
      !(event.relatedTarget instanceof Node) ||
      !inputRoot.contains(event.relatedTarget)
    )
      clearInput()
  }
  inputRoot.addEventListener("focusout", focusout)
  inputRoot.addEventListener("keydown", keydown)
  inputRoot.addEventListener("keyup", keyup)
  host.addEventListener("blur", clearKeys)
  window.addEventListener("blur", clearInput)
  document.addEventListener("visibilitychange", visibility)
  class MarketScene extends Phaser.Scene {
    vehicle?: Phaser.GameObjects.Sprite
    vendor?: Phaser.GameObjects.Sprite
    inventory?: Phaser.GameObjects.Container
    cargoText?: Phaser.GameObjects.Text
    sourceText?: Phaser.GameObjects.Text
    destinationText?: Phaser.GameObjects.Text
    instructionText?: Phaser.GameObjects.Text
    sourcePlate?: Phaser.GameObjects.Rectangle
    cargoPlate?: Phaser.GameObjects.Rectangle
    supply: Phaser.GameObjects.Image[] = []
    last: MarketFrame | null = null
    velocity = { x: 0, y: 0 }
    zone: MarketZone = "road"
    delivery = new MarketDeliveryGate()
    feedbackUntil = 0
    feedbackBox?: Phaser.GameObjects.Container
    scoreText?: Phaser.GameObjects.Text
    livesText?: Phaser.GameObjects.Text
    streakText?: Phaser.GameObjects.Text
    carried?: Phaser.GameObjects.Image
    carriedCount?: Phaser.GameObjects.Text
    preload() {
      this.load.image(
        "land",
        "/games/space-cargo/pixel/" +
          { coast: "coast", highlands: "highlands", jungle: "cloud-forest" }[
            options.region
          ] +
          ".png"
      )
      for (const [key, name] of [
        ["vehicle", vehicleName],
        ["vendor", "market-stall"],
      ])
        this.load.atlas(
          key,
          base + name + "-sheet.png",
          base + name + "-atlas.json"
        )
      for (const [key, name] of [
        ["food", foodName],
        ["crate", "crate"],
      ])
        this.load.atlas(key, base + name + ".png", base + name + "-atlas.json")
      this.load.on("loaderror", () => {
        failed = true
        if (!dead) options.error()
      })
    }
    fit<T extends Phaser.GameObjects.Image | Phaser.GameObjects.Sprite>(
      object: T,
      width: number,
      height: number
    ): T {
      object.setScale(Math.min(width / object.width, height / object.height))
      return object
    }
    create() {
      if (failed) return
      this.cameras.main.setScroll(0, 72)
      this.add.image(480, 280, "land").setDisplaySize(960, 560)
      this.add.rectangle(
        480,
        325,
        960,
        150,
        options.region === "jungle" ? 0x3a8b9d : 0xc69d6b,
        0.94
      )
      if (options.region !== "jungle")
        for (let x = 20; x < 960; x += 100)
          this.add.rectangle(x, 337, 38, 5, 0xf4d79d, 0.8)
      this.sourcePlate = this.add
        .rectangle(135, 275, 190, 150, 0xfff6df, 0.96)
        .setStrokeStyle(3, 0x7b694e)
      const textStyle = {
        fontFamily: "sans-serif",
        fontSize: "23px",
        color: "#203e39",
        align: "center",
        wordWrap: { width: 200 },
      }
      this.sourceText = this.add.text(135, 190, "", textStyle).setOrigin(0.5, 0)
      this.destinationText = this.add
        .text(820, 358, "", {
          ...textStyle,
          color: "#ffffff",
          backgroundColor: "#183d3b",
          padding: { x: 10, y: 5 },
        })
        .setOrigin(0.5, 0)
      this.vendor = this.fit(
        this.add.sprite(820, 340, "vendor", "0"),
        220,
        190
      ).setOrigin(0.5, 1)
      this.vehicle = this.fit(
        this.add.sprite(480, 346, "vehicle", "0"),
        260,
        175
      ).setOrigin(0.5, 1)
      this.vehicle.setDepth(4)
      for (const x of [245, 700])
        this.add
          .ellipse(x, 350, 100, 32, 0xf7ce69, 0.8)
          .setStrokeStyle(3, 0xfff6df)
      for (const x of [380, 480, 580])
        this.add
          .text(x, 365, "›", {
            fontFamily: "sans-serif",
            fontSize: "38px",
            color: "#fff6df",
          })
          .setOrigin(0.5)
      this.carried = this.fit(
        this.add.image(480, 300, "crate", "item"),
        42,
        32
      ).setDepth(5)
      this.carriedCount = this.add
        .text(480, 280, "", {
          fontFamily: "sans-serif",
          fontSize: "20px",
          color: "#ffffff",
          backgroundColor: "#183d3b",
          padding: { x: 3, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(6)
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        host.focus({ preventScroll: true })
        if (!latest.enabled || this.time.now < this.feedbackUntil) return
        destination = marketTapTarget(
          this.cameras.main.getWorldPoint(pointer.x, pointer.y)
        )
      })
      for (const key of ["vehicle", "vendor"]) {
        this.anims.create({
          key: key + "-loop",
          frames: [0, 1, 2, 3].map((n) => ({ key, frame: String(n) })),
          frameRate: 5,
          repeat: -1,
          repeatDelay: key === "vendor" ? 1200 : 0,
        })
        if (
          !options.reduced &&
          (key === "vendor" || vehicleName === "peque-peque")
        )
          (key === "vehicle" ? this.vehicle : this.vendor).play(key + "-loop")
      }
      for (let i = 0; i < 3; i++) {
        const image = this.fit(
          this.add.image(88 + i * 47, 278 + (i % 2) * 12, "food", "item"),
          50,
          54
        )
        this.supply.push(image)
      }
      this.cargoPlate = this.add
        .rectangle(480, 465, 880, 145, 0xfff6df, 0.97)
        .setStrokeStyle(3, 0x7b694e)
      this.cargoText = this.add.text(65, 405, "", textStyle)
      this.inventory = this.add.container(0, 0)
      this.paint(latest)
      options.zone("road")
      if (!dead) options.ready()
    }
    request(amount: number) {
      if (!this.vehicle || !latest.enabled || latest.remaining < amount) return
      const zone = marketZoneAt(this.vehicle)
      if (zone !== "source" || this.time.now < this.feedbackUntil) return
      if (Math.hypot(this.velocity.x, this.velocity.y) > 35) return
      options.transfer(amount)
    }
    update(_time: number, delta: number) {
      if (!this.vehicle) return
      if (!latest.enabled || this.time.now < this.feedbackUntil) {
        this.velocity = { x: 0, y: 0 }
        this.vehicle.stop().setFrame("0")
        return
      }
      const nudge = this.time.now < impulse.until ? impulse : { x: 0, y: 0 }
      const direction = {
        x:
          held.x +
          nudge.x +
          Number(keys.has("ArrowRight") || keys.has("KeyD")) -
          Number(keys.has("ArrowLeft") || keys.has("KeyA")),
        y:
          held.y +
          nudge.y +
          Number(keys.has("ArrowDown") || keys.has("KeyS")) -
          Number(keys.has("ArrowUp") || keys.has("KeyW")),
      }
      const next =
        destination && direction.x === 0 && direction.y === 0
          ? approachMarket(this.vehicle, destination, delta)
          : driveMarket(this.vehicle, this.velocity, direction, delta)
      if ("arrived" in next && next.arrived) destination = null
      this.velocity = next.velocity
      this.vehicle.setPosition(next.position.x, next.position.y)
      if (Math.abs(this.velocity.x) > 8)
        this.vehicle.setFlipX(this.velocity.x < 0)
      const moving = Math.hypot(this.velocity.x, this.velocity.y) > 8
      if (!options.reduced && (moving || vehicleName === "peque-peque")) {
        if (!this.vehicle.anims.isPlaying) this.vehicle.play("vehicle-loop")
      } else if (this.vehicle.anims.isPlaying) this.vehicle.stop().setFrame("0")
      this.updateCarried()
      const zone = marketZoneAt(this.vehicle)
      const ready =
        zone === "source" && Math.hypot(this.velocity.x, this.velocity.y) <= 35
      const interactionZone = zone === "source" && !ready ? "road" : zone
      if (interactionZone !== this.zone) {
        this.zone = interactionZone
        options.zone(interactionZone)
      }
      this.instructionText?.setText(ready ? latest.action : latest.instruction)
      this.sourcePlate?.setStrokeStyle(
        4,
        zone === "source" ? 0x2d9f74 : 0x7b694e
      )
      this.cargoPlate?.setStrokeStyle(
        4,
        zone === "market" && latest.operation === "−" ? 0x2d9f74 : 0x7b694e
      )
      if (
        this.delivery.tick(
          zone,
          latest.enabled,
          Math.hypot(this.velocity.x, this.velocity.y) <= 35,
          this.time.now
        )
      ) {
        clearInput()
        this.velocity = { x: 0, y: 0 }
        options.checkout()
      }
    }
    updateCarried() {
      if (!this.vehicle) return
      const offset =
        vehicleName === "llama"
          ? { x: -15, y: -95 }
          : vehicleName === "tricycle"
            ? { x: -55, y: -60 }
            : { x: 0, y: -24 }
      const x = this.vehicle.x + offset.x * (this.vehicle.flipX ? -1 : 1),
        y = this.vehicle.y + offset.y
      this.carried?.setPosition(x, y).setVisible(latest.quantity > 0)
      this.carriedCount
        ?.setPosition(x, y - 25)
        .setText(String(latest.quantity))
        .setVisible(latest.quantity > 0)
    }
    paint(data: MarketFrame) {
      if (!this.inventory) return
      const old = this.last
      this.last = { ...data }
      this.inventory.removeAll(true)
      this.scoreText?.setText(data.scoreLabel)
      this.livesText?.setText(data.livesLabel)
      this.streakText?.setText(data.streakLabel)
      this.cargoText?.setText(data.cargo)
      this.sourceText?.setText("1 · " + data.source)
      this.destinationText?.setText("2 · " + data.destination)
      this.instructionText?.setText(data.instruction)
      this.sourcePlate?.setStrokeStyle(
        4,
        data.operation === "+" ? 0x2d9f74 : 0x7b694e
      )
      this.cargoPlate?.setStrokeStyle(
        4,
        data.operation === "−" ? 0x2d9f74 : 0x7b694e
      )
      this.supply.forEach((item) =>
        item.setAlpha(data.operation === "+" ? 1 : 0.35)
      )
      const tens = Math.floor(data.quantity / 10),
        units = data.quantity % 10
      for (let i = 0; i < tens; i++) {
        const x = 97 + i * 76
        const image = this.fit(this.add.image(x, 470, "crate", "item"), 68, 57)
        this.inventory.add(image)
        this.inventory.add(
          this.add
            .text(x, 474, "10", {
              fontFamily: "sans-serif",
              fontSize: "23px",
              color: "#ffffff",
              backgroundColor: "#664525",
              padding: { x: 3, y: 1 },
            })
            .setOrigin(0.5)
        )
      }
      for (let i = 0; i < units; i++) {
        const image = this.fit(
          this.add.image(93 + i * 65, tens ? 510 : 475, "food", "item"),
          49,
          tens ? 34 : 51
        )
        this.inventory.add(image)
      }
      this.inventory.add(
        this.add
          .text(895, 408, String(data.quantity), {
            fontFamily: "sans-serif",
            fontSize: "34px",
            color: "#203e39",
          })
          .setOrigin(1, 0)
      )
      if (
        old &&
        old.task === data.task &&
        old.quantity !== data.quantity &&
        !options.reduced
      )
        this.transfer(data.quantity - old.quantity)
      this.updateCarried()
      if (
        old &&
        old.feedbackVersion !== data.feedbackVersion &&
        (data.feedbackKind === "correct" || data.feedbackKind === "wrong")
      )
        this.showFeedback(data)
      if (old && data.stop > old.stop) this.celebrate()
    }
    transfer(delta: number) {
      const adding = delta > 0,
        external = { x: 135, y: 275 }
      const load = {
        x: this.vehicle?.x ?? 480,
        y: (this.vehicle?.y ?? 346) - 55,
      }
      const from = adding ? external : load,
        to = adding ? load : external
      const icon = this.fit(
        this.add.image(
          from.x,
          from.y,
          Math.abs(delta) >= 10 ? "crate" : "food",
          "item"
        ),
        65,
        65
      ).setDepth(10)
      this.tweens.add({
        targets: icon,
        x: to.x,
        y: to.y,
        duration: 380,
        ease: "Sine.easeInOut",
        onComplete: () => icon.destroy(),
      })
      const label = this.add
        .text(480, 365, (adding ? "+" : "−") + Math.abs(delta), {
          fontFamily: "sans-serif",
          fontSize: "34px",
          color: adding ? "#ffffff" : "#ffe09a",
          backgroundColor: "#183d3b",
          padding: { x: 7, y: 3 },
        })
        .setOrigin(0.5)
        .setDepth(11)
      this.tweens.add({
        targets: label,
        y: 340,
        alpha: 0,
        duration: 700,
        onComplete: () => label.destroy(),
      })
    }
    showFeedback(data: MarketFrame) {
      this.feedbackBox?.destroy(true)
      clearInput()
      this.velocity = { x: 0, y: 0 }
      this.feedbackUntil = this.time.now + 2600
      const box = this.add.container(480, 220).setDepth(30)
      this.feedbackBox = box
      box.add(
        this.add
          .rectangle(0, 0, 660, 140, 0x183d3b, 0.97)
          .setStrokeStyle(
            3,
            data.feedbackKind === "correct" ? 0xf7ce69 : 0xf09b73
          )
      )
      if (data.feedbackKind === "correct")
        box.add(
          this.add
            .text(0, -35, data.winLabel, {
              fontFamily: "sans-serif",
              fontSize: "43px",
              color: "#ffda65",
            })
            .setOrigin(0.5)
        )
      box.add(
        this.add
          .text(
            0,
            data.feedbackKind === "correct" ? 22 : 0,
            data.feedbackText,
            {
              fontFamily: "sans-serif",
              fontSize: "25px",
              color: "#ffffff",
              align: "center",
              wordWrap: { width: 610 },
            }
          )
          .setOrigin(0.5)
      )
      this.time.delayedCall(2600, () => {
        if (this.feedbackBox === box) this.feedbackBox = undefined
        box.destroy(true)
      })
    }
    celebrate() {
      if (!this.vehicle) return
      if (!options.reduced) {
        for (let i = 0; i < 12; i++) {
          const bit = this.add
            .rectangle(790, 235, 8, 8, [0xf7ce69, 0xf09b73, 0x84c7a2][i % 3])
            .setDepth(12)
          this.tweens.add({
            targets: bit,
            x: 735 + (i % 5) * 31,
            y: 150 + (i % 4) * 48,
            angle: i * 40,
            alpha: 0,
            duration: 750,
            onComplete: () => bit.destroy(),
          })
        }
      }
    }
  }
  const scene = new MarketScene("market-route-v2")
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width: 960,
    height: 488,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    backgroundColor: "#183d3b",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [scene],
    audio: { noAudio: true },
    banner: false,
  })
  return {
    sync(frame) {
      latest = frame
      if (!frame.enabled) clearInput()
      scene.paint(frame)
    },
    steer(x, y) {
      destination = null
      held = latest.enabled ? { x, y } : { x: 0, y: 0 }
    },
    step(x, y) {
      if (latest.enabled) {
        destination = null
        impulse = { x, y, until: scene.time.now + 250 }
      }
    },
    interact(amount) {
      scene.request(amount)
    },
    destroy() {
      clearInput()
      inputRoot.removeEventListener("focusout", focusout)
      inputRoot.removeEventListener("keydown", keydown)
      inputRoot.removeEventListener("keyup", keyup)
      host.removeEventListener("blur", clearKeys)
      window.removeEventListener("blur", clearInput)
      document.removeEventListener("visibilitychange", visibility)
      dead = true
      game.destroy(true)
    },
  }
}
