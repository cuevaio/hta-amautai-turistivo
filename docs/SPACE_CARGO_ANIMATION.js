// Standalone design-document renderer; this does not implement game logic.
const assets = JSON.parse(document.getElementById("animation-data").textContent)
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
const pause = document.getElementById("pause")
const sprites = []
let elapsed = 0
let lastTime
let animationId
const lifetime = new AbortController()

function draw(sprite, index) {
  const { frame, spriteSourceSize: offset, sourceSize } = sprite.asset.frames[index]
  const ctx = sprite.context
  const scale = 176 / Math.max(sourceSize.w, sourceSize.h)
  const x = (192 - sourceSize.w * scale) / 2 + offset.x * scale
  const y = (192 - sourceSize.h * scale) / 2 + offset.y * scale
  ctx.clearRect(0, 0, 192, 192)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(sprite.image, frame.x, frame.y, frame.w, frame.h,
    Math.round(x), Math.round(y), Math.round(frame.w * scale), Math.round(frame.h * scale))
  sprite.element.dataset.frame = index
}

for (const asset of assets) {
  const image = new Image()
  image.addEventListener("load", () => {
    for (const element of document.querySelectorAll(`.sprite.${asset.key}`)) {
      const canvas = document.createElement("canvas")
      canvas.width = canvas.height = 192
      canvas.setAttribute("aria-hidden", "true")
      element.append(canvas)
      const sprite = { asset, image, element, context: canvas.getContext("2d") }
      if (!sprite.context) continue
      sprites.push(sprite)
      draw(sprite, "0")
    }
  }, { signal: lifetime.signal })
  image.addEventListener("error", () => {
    for (const element of document.querySelectorAll(`.sprite.${asset.key}`)) {
      element.textContent = "Sprite could not load."
      element.setAttribute("role", "alert")
    }
  }, { signal: lifetime.signal })
  image.src = `../apps/web/public/games/space-cargo/pixel/${asset.file}`
}

function tick(time) {
  if (lastTime !== undefined && !pause.checked && !reducedMotion.matches && !document.hidden)
    elapsed += Math.min(time - lastTime, 100)
  lastTime = time
  for (const sprite of sprites) {
    const frame = reducedMotion.matches ? "0" : String(Math.floor(elapsed / (sprite.asset.durationMs / 4)) % 4)
    if (sprite.element.dataset.frame !== frame) draw(sprite, frame)
  }
  animationId = requestAnimationFrame(tick)
}
animationId = requestAnimationFrame(tick)

window.addEventListener("pagehide", () => {
  cancelAnimationFrame(animationId)
  lifetime.abort()
}, { once: true })
