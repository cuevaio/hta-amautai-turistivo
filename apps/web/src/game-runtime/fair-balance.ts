import Phaser from "phaser"
import { balanceAngle, balanceEnds } from "./fair-balance-state"

/** A procedural prop: the beam turns while the suspended pans stay horizontal. */
export class FairBalance {
  readonly root: Phaser.GameObjects.Container
  private readonly beam: Phaser.GameObjects.Container
  private readonly pans: Phaser.GameObjects.Container[]
  private readonly labels: Phaser.GameObjects.Text[]
  private readonly quantities: Phaser.GameObjects.Text[]
  private readonly goods: Phaser.GameObjects.Container[]
  private readonly level: Phaser.GameObjects.Graphics
  private readonly pose = { angle: 0 }
  private counts = ""
  private readonly arm: number
  private readonly center: number
  private readonly pivot = 280
  private readonly scene: Phaser.Scene
  private readonly reduced: boolean
  constructor(scene: Phaser.Scene, compact: boolean, reduced: boolean) {
    this.scene = scene
    this.reduced = reduced
    this.center = compact ? 297.5 : 500
    this.arm = compact ? 147.5 : 280
    this.root = scene.add.container(0, 0).setDepth(3)
    this.root.add(
      scene.add
        .graphics()
        .fillStyle(0xf7efd9, 0.92)
        .fillRoundedRect(30, 222, (compact ? 600 : 1000) - 60, 235, 16)
    )
    const metal = scene.add.graphics()
    metal.fillStyle(0x3d3528, 0.2).fillEllipse(this.center, 443, 174, 25)
    metal.fillStyle(0x67422a).fillRoundedRect(this.center - 16, 280, 32, 145, 6)
    metal.fillStyle(0xb98742).fillRoundedRect(this.center - 9, 282, 10, 137, 4)
    metal.fillStyle(0x69452c).fillRoundedRect(this.center - 67, 419, 134, 19, 7)
    metal.fillStyle(0xd3a558).fillRoundedRect(this.center - 57, 415, 114, 10, 4)
    this.root.add(metal)
    this.beam = scene.add.container(this.center, this.pivot)
    const beam = scene.add
      .graphics()
      .lineStyle(14, 0x684329)
      .lineBetween(-this.arm, 0, this.arm, 0)
    beam.lineStyle(7, 0xe2bd73).lineBetween(-this.arm, -3, this.arm, -3)
    for (const x of [-this.arm, this.arm])
      beam.fillStyle(0xf1d38d).fillCircle(x, 0, 8)
    this.beam.add(beam)
    this.root.add(this.beam)
    this.labels = []
    this.quantities = []
    this.goods = []
    this.pans = []
    for (let i = 0; i < 2; i++) {
      const x = this.center + (i ? this.arm : -this.arm)
      const label = scene.add
        .text(x, 225, "", {
          fontFamily: "Inter Variable, sans-serif",
          fontSize: compact ? 20 : 23,
          color: "#214b3e",
          align: "center",
          backgroundColor: "#f7efd9",
          padding: { x: 10, y: 5 },
          wordWrap: { width: compact ? 228 : 260 },
        })
        .setOrigin(0.5, 0)
      this.labels.push(label)
      this.root.add(label)
      const pan = scene.add.container(x, 365),
        width = compact ? 220 : 250
      const shape = scene.add.graphics().lineStyle(3, 0x6b5940)
      shape
        .lineBetween(0, -85, -width / 2 + 12, 0)
        .lineBetween(0, -85, width / 2 - 12, 0)
      shape.fillStyle(0x79512d).fillEllipse(0, 10, width, 30)
      shape.fillStyle(0xd8b76d).fillEllipse(0, 1, width, 24)
      shape.lineStyle(3, 0x5c432a).strokeEllipse(0, 1, width, 24)
      pan.add(shape)
      const goods = scene.add.container(0, 0)
      pan.add(goods)
      this.goods.push(goods)
      const badgeX = (i ? 1 : -1) * (width / 2 - 36)
      pan.add(
        scene.add
          .rectangle(badgeX, 38, 68, 38, 0xf7efd9)
          .setStrokeStyle(2, 0x718364)
      )
      const quantity = scene.add
        .text(badgeX, 38, "0", {
          fontFamily: "Inter Variable, sans-serif",
          fontSize: 30,
          color: "#214b3e",
        })
        .setOrigin(0.5)
      this.quantities.push(quantity)
      pan.add(quantity)
      this.pans.push(pan)
      this.root.add(pan)
    }
    const hub = scene.add
      .graphics()
      .fillStyle(0x67442b)
      .fillCircle(this.center, this.pivot, 16)
    hub.fillStyle(0xe7c579).fillCircle(this.center, this.pivot, 10)
    this.root.add(hub)
    this.level = scene.add.graphics()
    this.root.add(this.level)
    this.place()
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      scene.tweens.killTweensOf(this.pose)
    )
  }
  sync(left: number, right: number, fixedLabel: string, editableLabel: string) {
    this.labels[0]!.setText(fixedLabel)
    this.labels[1]!.setText(editableLabel)
    const key = `${left}:${right}`
    if (key === this.counts) return
    this.counts = key
    ;[left, right].forEach((count, i) => {
      const goods = this.goods[i]!
      goods.removeAll(true)
      this.quantities[i]!.setText(String(count))
      for (let j = 0; j < count; j++) {
        const item = this.scene.add.image(
          -64 + (j % 5) * 32,
          -17 - Math.floor(j / 5) * 21,
          "food",
          "item"
        )
        item.setScale(27 / Math.max(item.width, item.height))
        goods.add(item)
      }
    })
    const angle = balanceAngle(left, right)
    this.scene.tweens.killTweensOf(this.pose)
    if (this.reduced) {
      this.pose.angle = angle
      this.place()
    } else
      this.scene.tweens.add({
        targets: this.pose,
        angle,
        duration: 650,
        ease: "Cubic.Out",
        onUpdate: () => this.place(),
      })
  }
  private place() {
    const ends = balanceEnds(this.center, this.pivot, this.arm, this.pose.angle)
    this.beam.setRotation(this.pose.angle)
    this.pans[0]!.setPosition(ends.left.x, ends.left.y + 85)
    this.pans[1]!.setPosition(ends.right.x, ends.right.y + 85)
    const equal = Math.abs(this.pose.angle) < 0.002
    this.level
      .clear()
      .lineStyle(3, 0xf0d597, 0.85)
      .lineBetween(this.center - 30, 308, this.center + 30, 308)
    this.level
      .lineStyle(5, equal ? 0xa5d78a : 0xc8934b)
      .lineBetween(
        this.center - 24,
        308,
        this.center + 24,
        308 + this.pose.angle * 200
      )
  }
}
