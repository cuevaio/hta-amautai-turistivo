import { MoonIcon, SunIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useTheme } from "@/shared/model/theme-provider"
import { useMessages } from "@/shared/i18n/use-messages"

export function ThemeToggle({ className = "size-11" }: { className?: string }) {
  const { setTheme } = useTheme()
  const { m } = useMessages()
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label={m("Cambiar tema")}
      onClick={() =>
        setTheme(
          document.documentElement.classList.contains("dark") ? "light" : "dark"
        )
      }
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  )
}
