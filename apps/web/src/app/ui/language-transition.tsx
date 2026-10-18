import { useLayoutEffect } from "react"
import { flushSync } from "react-dom"
import { animate } from "motion"
import { i18n, registerLocaleTransition } from "@/shared/i18n/config"

const highlightName = "amautai-language-change"

function translatedRanges(locale: string) {
  const messages = i18n.getResourceBundle(locale, "messages") as Record<
    string,
    string
  >
  const translations = new Set(Object.values(messages))
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const ranges: Range[] = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (
      !translations.has(node.textContent?.trim() ?? "") ||
      node.parentElement?.closest(
        "script, style, textarea, input, [contenteditable], svg"
      )
    )
      continue
    const range = new Range()
    range.selectNodeContents(node)
    ranges.push(range)
  }
  return ranges
}

export function LanguageTransition() {
  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let disposed = false
    let finishPhase = () => {}
    let clear = () => {}
    const unregister = registerLocaleTransition(async (locale, commit) => {
      if (
        reducedMotion.matches ||
        typeof Highlight === "undefined" ||
        !CSS.highlights
      ) {
        await commit()
        return
      }

      const style = document.createElement("style")
      style.textContent = `::highlight(${highlightName}) { color: currentColor; }`
      document.head.append(style)
      const rule = style.sheet!.cssRules[0] as CSSStyleRule
      const paint = (opacity: number) => {
        rule.style.color = `color-mix(in srgb, currentColor ${opacity * 100}%, transparent)`
      }
      clear = () => {
        CSS.highlights.delete(highlightName)
        style.remove()
      }
      const fade = (from: number, to: number, duration: number) =>
        new Promise<void>((resolve) => {
          paint(from)
          const animation = animate(from, to, {
            duration,
            ease: "easeOut",
            onUpdate: paint,
            onComplete: resolve,
          })
          finishPhase = () => {
            animation.stop()
            resolve()
          }
        })

      try {
        CSS.highlights.set(
          highlightName,
          new Highlight(...translatedRanges(i18n.resolvedLanguage ?? "es-PE"))
        )
        await fade(1, 0, 0.08)
        // Commit while the old words are hidden, keeping the same React tree.
        let committed: Promise<void> | undefined
        flushSync(() => {
          committed = commit()
        })
        if (!disposed) {
          paint(0)
          CSS.highlights.set(
            highlightName,
            new Highlight(...translatedRanges(i18n.resolvedLanguage ?? locale))
          )
        }
        await committed
        if (!disposed && !reducedMotion.matches) await fade(0, 1, 0.15)
      } finally {
        clear()
      }
    })
    const cancel = () => {
      finishPhase()
      clear()
    }
    reducedMotion.addEventListener("change", cancel)
    return () => {
      disposed = true
      unregister()
      reducedMotion.removeEventListener("change", cancel)
      cancel()
    }
  }, [])

  return null
}
