import { useMessages } from "@/shared/i18n/use-messages"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { useNavigate } from "react-router"
import { useEducation } from "../model/education-provider"
import { useProfileForm } from "../model/use-profile-form"
import { ContextFields } from "./context-fields"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { Badge } from "@workspace/ui/components/badge"
import { BrandLogo } from "@/shared/ui/brand-logo"
export function TeacherProfileForm({
  onboarding = false,
}: {
  onboarding?: boolean
}) {
  const { m, errorMessage } = useMessages()

  const { catalog } = useEducation()
  const form = useProfileForm()
  const navigate = useNavigate()
  const groupStep = !onboarding || form.step === 0
  const Heading = onboarding ? "h1" : "h2"
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        if (onboarding && form.step === 0) {
          if (form.grade.includes("2")) form.setStep(1)
          return
        }
        if ((await form.save()) && onboarding)
          navigate("/dashboard", { replace: true })
      }}
      className="flex max-w-2xl flex-col gap-7"
    >
      <div className="flex flex-col gap-2">
        {onboarding && (
          <p className="text-sm text-muted-foreground">
            {m("Paso {{step}} de {{total}}", { step: form.step + 1, total: 2 })}{" "}
            · {form.step === 0 ? m("Tu grupo") : m("Contexto")}
          </p>
        )}
        <Heading className="text-2xl font-semibold">
          {onboarding
            ? form.step === 0
              ? m("Preparemos tu espacio docente")
              : m("Cuéntanos sobre tu grupo")
            : m("Perfil docente")}
        </Heading>
        <p className="text-sm text-muted-foreground">
          {onboarding
            ? m(
                "Una configuración breve para empezar tus sesiones de aprendizaje."
              )
            : m(
                "Estos datos se usarán en las sesiones nuevas. Los borradores existentes conservan su contexto."
              )}
        </p>
      </div>
      {groupStep && (
        <FieldGroup>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{m("Docente")}</Badge>
            <Badge variant="secondary">{m("Primaria")}</Badge>
            <Badge variant="secondary">{m("Matemática")}</Badge>
          </div>
          <Field>
            <FieldLabel id="grade-label">{m("Grado del grupo")}</FieldLabel>
            <ToggleGroup
              aria-labelledby="grade-label"
              value={form.grade}
              onValueChange={form.setGrade}
              disabled={form.busy}
              variant="outline"
              className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {catalog?.grades.map((g) => (
                <ToggleGroupItem
                  key={g.grade}
                  value={String(g.grade)}
                  disabled={!g.enabled}
                  aria-label={
                    m("Grado {{grade}}", { grade: g.grade }) +
                    (g.enabled
                      ? ""
                      : " · " + m("No disponible en esta versión"))
                  }
                  className="h-auto flex-col items-start gap-1 p-4 whitespace-normal"
                >
                  <span>{m("Grado {{grade}}", { grade: g.grade })}</span>
                  <span className="text-xs text-muted-foreground">
                    {g.enabled
                      ? m("Ciclo {{cycle}}", { cycle: g.cycle })
                      : m("No disponible en esta versión")}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription>
              {m(
                "Esta primera versión está disponible para 2.º de Primaria, ciclo III."
              )}
            </FieldDescription>
          </Field>
        </FieldGroup>
      )}
      {(!onboarding || form.step === 1) && (
        <ContextFields
          value={form.context}
          onChange={form.setContext}
          disabled={form.busy}
          prefix="profile"
        />
      )}
      {form.error && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(form.error)}
        </p>
      )}
      {form.notice && (
        <p role="status" className="text-sm">
          {m(form.notice)}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {onboarding && form.step === 1 && (
          <Button
            type="button"
            variant="outline"
            disabled={form.busy}
            onClick={() => form.setStep(0)}
          >
            {m("Atrás")}
          </Button>
        )}
        <Button type="submit" disabled={form.busy || !form.grade.includes("2")}>
          {form.busy
            ? m("Guardando…")
            : onboarding
              ? form.step === 0
                ? m("Continuar")
                : m("Guardar y continuar")
              : m("Guardar perfil docente")}
        </Button>
      </div>
      {onboarding && form.step === 1 && (
        <p className="text-sm text-muted-foreground">
          {m(
            "Todos los campos de contexto son opcionales. Puedes completarlos después en Configuración."
          )}
        </p>
      )}
    </form>
  )
}
export function Onboarding() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-10 px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <BrandLogo className="w-40" />
        <LanguageSelector compact />
      </div>
      <TeacherProfileForm onboarding />
    </main>
  )
}
