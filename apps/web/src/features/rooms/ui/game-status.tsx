import { Heart, Trophy, ChartNoAxesColumnIncreasing } from "lucide-react"
import { useMessages } from "@/shared/i18n/use-messages"

export function GameStatus({
  score,
  lives,
  detail,
}: {
  score: number
  lives: number
  detail: { label: string; value: number }
}) {
  const { m, locale } = useMessages()
  const number = new Intl.NumberFormat(locale)
  return (
    <dl className="grid grid-cols-3 divide-x border-b bg-background py-3">
      {[
        { label: m("Puntos"), value: score, icon: Trophy },
        { label: m("Oportunidades"), value: lives, icon: Heart },
        { ...detail, icon: ChartNoAxesColumnIncreasing },
      ].map(({ label, value, icon: Icon }) => (
        <div key={label} className="min-w-0 px-3 sm:px-5">
          <dt className="flex min-h-8 items-start gap-1.5 text-xs text-muted-foreground sm:min-h-0 sm:items-center sm:text-sm">
            <Icon
              className="hidden size-3.5 shrink-0 sm:block"
              aria-hidden="true"
            />
            <span className="break-words">{label}</span>
          </dt>
          <dd className="mt-0.5 text-xl font-semibold tabular-nums">
            {number.format(value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
