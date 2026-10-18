import { useId } from "react"
import { useMessages } from "@/shared/i18n/use-messages"
import { changeUiLocale } from "@/shared/i18n/config"
import { locales, resolveLocale } from "@/shared/i18n/locales"
import { cn } from "@workspace/ui/lib/utils"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

const languageItems = locales.map((locale) => ({
  value: locale.code,
  label: locale.label,
}))

export function LanguageSelector({
  compact = false,
  touchTarget = false,
}: {
  compact?: boolean
  touchTarget?: boolean
}) {
  const id = useId()
  const { m, locale: language } = useMessages()
  return (
    <Field className={compact ? "w-40 max-w-[40vw] shrink-0" : undefined}>
      <FieldLabel htmlFor={id} className={compact ? "sr-only" : undefined}>
        {m("Idioma de la interfaz")}
      </FieldLabel>
      <Select
        items={languageItems}
        value={resolveLocale(language)}
        onValueChange={(value) => {
          if (value !== null) void changeUiLocale(resolveLocale(value))
        }}
      >
        <SelectTrigger
          className={cn(
            "w-full max-w-full",
            compact && "gap-1 px-2.5",
            touchTarget && "min-h-11"
          )}
          id={id}
          size={compact ? "sm" : "default"}
          aria-describedby={compact ? undefined : id + "-help"}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" alignItemWithTrigger={false}>
          <SelectGroup>
            {locales.map((locale) => (
              <SelectItem
                key={locale.code}
                value={locale.code}
                lang={locale.code}
                disabled={!locale.available}
              >
                {locale.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {!compact && (
        <FieldDescription id={id + "-help"}>
          {m(
            "Se guarda en este navegador. El idioma del grupo se configura por separado."
          )}
        </FieldDescription>
      )}
    </Field>
  )
}
