import { useEffect } from "react"
import { useMessages } from "@/shared/i18n/use-messages"

// Social crawlers use the Spanish defaults in index.html without running React.
// In the browser, keep those same tags in sync with the selected UI language.
export function LandingMetadata() {
  const { m, locale } = useMessages()
  const title = `Amautai · ${m("Matemáticas de primaria")}`
  const description = m(
    "Matemáticas de primaria con sesiones contextualizadas y un juego de multiplicación para segundo grado."
  )
  const imageAlt = m(
    "Amautai: una docente y dos niños con una tableta en un paisaje andino."
  )

  useEffect(() => {
    const previousTitle = document.title
    document.title = title
    const values = [
      ['meta[name="description"]', description],
      ['meta[property="og:title"]', title],
      ['meta[property="og:description"]', description],
      ['meta[property="og:locale"]', locale.replace("-", "_")],
      ['meta[property="og:image:alt"]', imageAlt],
      ['meta[name="twitter:title"]', title],
      ['meta[name="twitter:description"]', description],
      ['meta[name="twitter:image:alt"]', imageAlt],
    ]
    const originals = values.map(([selector, content]) => {
      const element = document.head.querySelector(selector)
      const previous = element?.getAttribute("content") ?? ""
      element?.setAttribute("content", content)
      return { element, previous }
    })
    return () => {
      if (document.title === title) document.title = previousTitle
      for (const { element, previous } of originals)
        element?.setAttribute("content", previous)
    }
  }, [title, description, imageAlt, locale])

  return null
}
