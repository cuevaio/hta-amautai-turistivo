export const languageStorageKey = "amautai-ui-language"

export const locales = [
  { code: "es-PE", label: "Español", available: true },
  { code: "quy-PE", label: "Quechua chanka", available: true },
  { code: "ay-PE", label: "Aimara", available: true },
] as const

export type UiLocale = (typeof locales)[number]["code"]

export function resolveLocale(value: unknown): UiLocale {
  return (
    locales.find((locale) => locale.available && locale.code === value)?.code ??
    "es-PE"
  )
}

export function readLocale(storage?: Pick<Storage, "getItem">): UiLocale {
  try {
    return resolveLocale(storage?.getItem(languageStorageKey))
  } catch {
    return "es-PE"
  }
}

export function saveLocale(
  value: UiLocale,
  storage?: Pick<Storage, "setItem">
) {
  const locale = resolveLocale(value)
  try {
    storage?.setItem(languageStorageKey, locale)
  } catch {
    // The selection still works in memory when storage is unavailable.
  }
  return locale
}
