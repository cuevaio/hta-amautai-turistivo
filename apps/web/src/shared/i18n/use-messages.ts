import { useTranslation } from "react-i18next"
import { formatDate } from "./format"

export function useMessages() {
  const { t, i18n } = useTranslation("messages")
  const m = (message: string, values?: Record<string, unknown>): string =>
    message
      ? t(message.trim(), {
          ...values,
          defaultValue: message,
          keySeparator: false,
          nsSeparator: false,
        })
      : ""
  const locale = i18n.resolvedLanguage ?? "es-PE"
  return {
    m,
    errorMessage: (message: string) =>
      m(
        i18n.exists(message.trim(), { ns: "messages" })
          ? message
          : "No pudimos completar la solicitud. Inténtalo de nuevo."
      ),
    locale,
    formatDate: (value: string, options?: Intl.DateTimeFormatOptions) =>
      formatDate(value, locale, options),
  }
}
