export function dateLocale(locale: string) {
  return Intl.DateTimeFormat.supportedLocalesOf([locale])[0] ?? "es-PE"
}

export function formatDate(
  value: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  if (
    locale !== "es-PE" &&
    !Intl.DateTimeFormat.supportedLocalesOf([locale]).length
  ) {
    const { dateStyle, timeStyle, ...fields } = options
    const numeric: Intl.DateTimeFormatOptions = { ...fields }
    if (dateStyle)
      Object.assign(numeric, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    if (
      numeric.month === "long" ||
      numeric.month === "short" ||
      numeric.month === "narrow"
    )
      numeric.month = "2-digit"
    delete numeric.weekday
    delete numeric.era
    delete numeric.dayPeriod
    if (timeStyle)
      Object.assign(numeric, {
        hour: "2-digit",
        minute: "2-digit",
        ...(timeStyle !== "short" ? { second: "2-digit" } : {}),
      })
    if (numeric.hour) numeric.hourCycle = "h23"
    if (numeric.hour) numeric.hour12 = false
    return new Intl.DateTimeFormat("es-PE", numeric).format(date)
  }
  return new Intl.DateTimeFormat(dateLocale(locale), options).format(date)
}
