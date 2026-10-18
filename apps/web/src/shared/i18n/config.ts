import { createInstance } from "i18next"
import { initReactI18next } from "react-i18next"
import { i18nOptions } from "./options"
import {
  languageStorageKey,
  readLocale,
  resolveLocale,
  saveLocale,
} from "./locales"
import type { UiLocale } from "./locales"

export const i18n = createInstance()

function browserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

void i18n.use(initReactI18next).init({
  ...i18nOptions,
  lng: readLocale(browserStorage()),
})

function updateDocument(locale: string) {
  if (typeof document !== "undefined") document.documentElement.lang = locale
}

updateDocument(i18n.language)
i18n.on("languageChanged", updateDocument)

type LocaleTransition = (
  locale: UiLocale,
  commit: () => Promise<void>
) => Promise<void>
let localeTransition: LocaleTransition | undefined
let latestRequest = 0
let pendingChange = Promise.resolve()

export function registerLocaleTransition(transition: LocaleTransition) {
  localeTransition = transition
  return () => {
    if (localeTransition === transition) localeTransition = undefined
  }
}

function applyUiLocale(locale: UiLocale, persist: boolean) {
  const request = ++latestRequest
  const run = async () => {
    if (request !== latestRequest) return
    const commit = async () => {
      if (request === latestRequest) await i18n.changeLanguage(locale)
    }
    if (i18n.resolvedLanguage !== locale) {
      if (localeTransition) await localeTransition(locale, commit)
      else await commit()
    }
    if (persist && request === latestRequest)
      saveLocale(locale, browserStorage())
  }
  const change = pendingChange.then(run, run)
  pendingChange = change.catch(() => {})
  return change
}

export function changeUiLocale(locale: UiLocale) {
  return applyUiLocale(resolveLocale(locale), true)
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.storageArea !== browserStorage()) return
    if (event.key === languageStorageKey || event.key === null) {
      void applyUiLocale(readLocale(browserStorage()), false)
    }
  })
}
