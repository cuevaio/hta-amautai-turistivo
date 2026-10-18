import { useState } from "react"
import type { AccountProfileRole } from "@amautai/contracts"
import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router"
import { useMessages } from "@/shared/i18n/use-messages"
import { BrandLogo } from "@/shared/ui/brand-logo"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { Button } from "@workspace/ui/components/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { useProfile } from "../model/profile-provider"

export function ProfileTypeSelection() {
  const { m } = useMessages()
  const { save } = useProfile()
  const navigate = useNavigate()
  const [role, setRole] = useState<AccountProfileRole | "">("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (!role || busy) return
    setBusy(true)
    setError("")
    try {
      await save(role)
      navigate(role === "teacher" ? "/registro/docente" : "/registro/familia", {
        replace: true,
      })
    } catch {
      setError(m("No pudimos guardar tu perfil"))
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/70 p-5 sm:p-8">
      <section className="w-full max-w-2xl rounded-4xl bg-card p-6 text-card-foreground sm:p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <BrandLogo className="h-10 w-40" />
          <LanguageSelector compact />
        </div>
        <div className="mb-7 flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {m("Elige tu perfil")}
          </h1>
          <p className="text-muted-foreground">{m("¿Cómo usarás Amautai?")}</p>
        </div>
        <p id="profile-type-label" className="mb-3 text-sm font-medium">
          {m("Selecciona una opción")}
        </p>
        <ToggleGroup
          aria-labelledby="profile-type-label"
          value={role ? [role] : []}
          onValueChange={(values) =>
            setRole((values[0] as AccountProfileRole | undefined) ?? "")
          }
          disabled={busy}
          variant="outline"
          orientation="vertical"
          className="mx-auto grid w-full max-w-[80%] grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <ToggleGroupItem
            value="teacher"
            className="h-auto min-h-0 flex-col items-stretch gap-0 overflow-hidden rounded-xl border-[3px] p-0 text-left whitespace-normal aria-pressed:border-primary"
          >
            <img
              src="/images/profile-selection/teacher.webp"
              alt=""
              aria-hidden="true"
              className="aspect-square w-full object-cover"
            />
            <span className="flex min-w-0 flex-col gap-1 px-4 py-3">
              <span className="text-base font-semibold">{m("Profesor")}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {m("Crear experiencias de aprendizaje para tu grupo.")}
              </span>
            </span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="parent"
            className="h-auto min-h-0 flex-col items-stretch gap-0 overflow-hidden rounded-xl border-[3px] p-0 text-left whitespace-normal aria-pressed:border-primary"
          >
            <div className="aspect-square w-full overflow-hidden rounded-t-xl">
              <img
                src="/images/profile-selection/family.webp"
                alt=""
                aria-hidden="true"
                className="h-full w-full origin-bottom scale-105 object-cover"
              />
            </div>
            <span className="flex min-w-0 flex-col gap-1 px-4 py-3">
              <span className="text-base font-semibold">
                {m("Padre o madre")}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {m("Acompañar el aprendizaje en casa.")}
              </span>
            </span>
          </ToggleGroupItem>
        </ToggleGroup>
        {error && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="mt-7 flex justify-end">
          <Button onClick={() => void submit()} disabled={!role || busy}>
            {busy ? m("Guardando…") : m("Continuar")}
            {!busy && <ArrowRight aria-hidden="true" />}
          </Button>
        </div>
      </section>
    </main>
  )
}
