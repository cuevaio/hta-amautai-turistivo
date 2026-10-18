export function nationalPhone(value: string) {
  const compact = value.replace(/[\s().-]/gu, "")
  if (compact.startsWith("+51")) return compact.slice(3)
  if (compact.startsWith("0051")) return compact.slice(4)
  if (compact.length > 9 && compact.startsWith("51")) return compact.slice(2)
  return compact
}

export function phoneEdit(value: string): string | null {
  const number = nationalPhone(value)
  return /^\d{0,9}$/.test(number) ? number : null
}

export function isPeruvianMobile(value: string) {
  return /^9\d{8}$/.test(value)
}
