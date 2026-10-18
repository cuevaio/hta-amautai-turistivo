import { useMessages } from "@/shared/i18n/use-messages"
import { cn } from "@workspace/ui/lib/utils"

export function BrandLogo({ className }: { className?: string }) {
  const { m } = useMessages()

  return (
    <span
      role="img"
      aria-label={m("Amautai")}
      data-slot="brand-logo"
      className={cn("inline-grid h-8 w-[141px] shrink-0", className)}
    >
      <img
        src="/brand/amautai-logo.svg"
        alt=""
        width={423}
        height={96}
        className="col-start-1 row-start-1 size-full object-contain dark:hidden"
      />
      <img
        src="/brand/amautai-logo-inverse.svg"
        alt=""
        width={423}
        height={96}
        className="col-start-1 row-start-1 hidden size-full object-contain dark:block"
      />
    </span>
  )
}
