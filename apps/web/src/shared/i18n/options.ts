import type { InitOptions } from "i18next"
import { spanishMessages, chankaMessages, aymaraMessages } from "./messages.ts"

export const i18nOptions = {
  resources: {
    "es-PE": { messages: spanishMessages },
    "quy-PE": { messages: chankaMessages },
    "ay-PE": { messages: aymaraMessages },
  },
  defaultNS: "messages",
  fallbackLng: "es-PE",
  supportedLngs: ["es-PE", "quy-PE", "ay-PE"],
  load: "currentOnly",
  initAsync: false,
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
} satisfies InitOptions
