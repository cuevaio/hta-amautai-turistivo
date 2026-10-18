import { useState, type FormEvent } from "react"
import type { FamilyProfileInput } from "@amautai/contracts"
import { useNavigate } from "react-router"
import { useMessages } from "@/shared/i18n/use-messages"
import { BrandLogo } from "@/shared/ui/brand-logo"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { useProfile } from "../model/profile-provider"

const gradeLabels = [
  "1er grado",
  "2do grado",
  "3er grado",
  "4to grado",
  "5to grado",
  "6to grado",
] as const

export function FamilyOnboarding() {
  const { m } = useMessages()
  const { familyProfile, saveFamily } = useProfile()
  const navigate = useNavigate()
  const [grade, setGrade] = useState<number | null>(
    familyProfile?.grade ?? null
  )
  const [location, setLocation] = useState(familyProfile?.location ?? "")
  const [language, setLanguage] = useState(familyProfile?.language ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (grade === null || !location.trim() || !language.trim() || busy) return
    setBusy(true)
    setError("")
    const profile: FamilyProfileInput = {
      grade,
      location: location.trim(),
      language: language.trim(),
    }
    try {
      await saveFamily(profile)
      navigate("/panel", { replace: true })
    } catch {
      setError(m("No pudimos guardar el perfil"))
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/70 p-5 sm:p-8">
      <section className="w-full max-w-2xl rounded-4xl bg-card p-6 text-card-foreground sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <BrandLogo className="w-32" />
          <LanguageSelector compact />
        </div>
        <div className="mb-7 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {m("Perfil de aprendizaje familiar")}
          </h1>
          <p className="text-muted-foreground">
            {m("Cuéntanos el contexto de aprendizaje, sin datos personales.")}
          </p>
        </div>
        <form onSubmit={(event) => void submit(event)}>
          <FieldGroup>
            <Field>
              <FieldLabel id="family-grade-label">
                {m("Grado de primaria")}
              </FieldLabel>
              <ToggleGroup
                aria-labelledby="family-grade-label"
                value={grade ? [String(grade)] : []}
                onValueChange={(values) =>
                  setGrade(values[0] ? Number(values[0]) : null)
                }
                disabled={busy}
                variant="outline"
                className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
              >
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <ToggleGroupItem
                    key={value}
                    value={String(value)}
                    aria-label={m("Grado {{grade}}", { grade: value })}
                    className="border-[3px] aria-pressed:border-primary"
                  >
                    {m(gradeLabels[value - 1])}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="family-location">
                  {m("Ciudad")} <span aria-hidden="true">*</span>
                </FieldLabel>
                <Input
                  id="family-location"
                  value={location}
                  required
                  maxLength={200}
                  onChange={(event) => setLocation(event.target.value)}
                  disabled={busy}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="family-language">
                  {m("Idioma principal")} <span aria-hidden="true">*</span>
                </FieldLabel>
                <Input
                  id="family-language"
                  value={language}
                  required
                  maxLength={100}
                  onChange={(event) => setLanguage(event.target.value)}
                  disabled={busy}
                />
              </Field>
            </div>
          </FieldGroup>
          {error && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="mt-7 flex justify-end">
            <Button
              type="submit"
              disabled={
                grade === null || !location.trim() || !language.trim() || busy
              }
            >
              {busy ? m("Guardando…") : m("Guardar perfil")}
            </Button>
          </div>
        </form>
      </section>
    </main>
  )
}
