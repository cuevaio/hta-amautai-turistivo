import { useMessages } from "@/shared/i18n/use-messages"
import type {
  CurriculumCatalog,
  LearningSessionInput,
} from "@amautai/contracts"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldLegend,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { ContextFields } from "./context-fields"
import { momentLabels } from "../model/session"
function toggle(values: string[], id: string, checked: boolean) {
  return checked ? [...values, id] : values.filter((value) => value !== id)
}
export function SessionFields({
  values,
  onChange,
  catalog,
  busy,
  issues,
}: {
  values: LearningSessionInput
  onChange: (value: LearningSessionInput) => void
  catalog: CurriculumCatalog
  busy: boolean
  issues: Record<string, string>
}) {
  const { m } = useMessages()

  const change = <K extends keyof LearningSessionInput>(
    key: K,
    value: LearningSessionInput[K]
  ) => onChange({ ...values, [key]: value })
  const competence = catalog.competencies.find(
    (c) => c.id === values.competenceId
  )
  return (
    <FieldGroup>
      <FieldSet disabled={busy} className="gap-5">
        <FieldLegend>{m("Propósito de aprendizaje")}</FieldLegend>
        <Field data-invalid={!!issues.title}>
          <FieldLabel htmlFor="session-title">
            {m("Título de la sesión")}
          </FieldLabel>
          <Input
            id="session-title"
            value={values.title}
            maxLength={120}
            aria-invalid={!!issues.title}
            onChange={(e) => change("title", e.target.value)}
            placeholder={m("Por ejemplo: contamos los frutos de la cosecha")}
          />
          <FieldDescription>
            {m(
              "Entre 3 y 120 caracteres. Puedes guardar con los demás campos pendientes."
            )}
          </FieldDescription>
          {issues.title && (
            <p role="alert" className="text-sm text-destructive">
              {m("Escribe un título de 3 a 120 caracteres.")}
            </p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="competence">{m("Competencia")}</FieldLabel>
          <Select
            items={[
              { value: "", label: m("Selecciona una competencia") },
              ...catalog.competencies.map((c) => ({
                value: c.id,
                label: m(c.label),
              })),
            ]}
            value={values.competenceId}
            disabled={busy}
            onValueChange={(competenceId) => {
              if (competenceId !== null)
                onChange({
                  ...values,
                  competenceId,
                  capacityIds: [],
                })
            }}
          >
            <SelectTrigger id="competence" className="w-full min-w-0">
              <SelectValue className="min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                <SelectItem value="">
                  {m("Selecciona una competencia")}
                </SelectItem>
                {catalog.competencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="whitespace-normal">{m(c.label)}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            {m(
              "Área curricular: Matemática · Primaria · 2.º grado · Ciclo III."
            )}
          </FieldDescription>
        </Field>
        {competence && (
          <FieldSet>
            <FieldLegend variant="label">
              {m("Capacidades que trabajarás")}
            </FieldLegend>
            <FieldDescription>
              {m(
                "Selecciona las que la actividad movilizará. No se marcan automáticamente."
              )}
            </FieldDescription>
            <FieldGroup className="gap-3">
              {competence.capacities.map((c) => (
                <Field key={c.id} orientation="horizontal">
                  <Checkbox
                    id={c.id}
                    checked={values.capacityIds.includes(c.id)}
                    onCheckedChange={(checked) =>
                      change(
                        "capacityIds",
                        toggle(values.capacityIds, c.id, checked)
                      )
                    }
                  />
                  <FieldLabel htmlFor={c.id} className="font-normal">
                    {m(c.label)}
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
          </FieldSet>
        )}
        <Field data-invalid={!!issues.purpose}>
          <FieldLabel htmlFor="purpose">
            {m("Propósito de aprendizaje")}
          </FieldLabel>
          <Textarea
            id="purpose"
            value={values.purpose}
            maxLength={1500}
            aria-invalid={!!issues.purpose}
            onChange={(e) => change("purpose", e.target.value)}
            placeholder={m("¿Qué esperas que el grupo aprenda o demuestre?")}
          />
        </Field>
        <Field data-invalid={!!issues.performance}>
          <FieldLabel htmlFor="performance">
            {m("Desempeño o precisión que estás trabajando (opcional)")}
          </FieldLabel>
          <Textarea
            id="performance"
            value={values.performance}
            maxLength={1500}
            aria-invalid={!!issues.performance}
            onChange={(e) => change("performance", e.target.value)}
          />
          <FieldDescription>
            {m(
              "Pega el texto de tu planificación. Se guardará como aporte docente, sin verificarlo como cita oficial del MINEDU."
            )}
          </FieldDescription>
        </Field>
      </FieldSet>
      <FieldSet disabled={busy} className="gap-5">
        <FieldLegend>{m("Contexto y situación significativa")}</FieldLegend>
        <Field data-invalid={!!issues.situation}>
          <FieldLabel htmlFor="situation">
            {m("¿Cuál es la situación significativa?")}
          </FieldLabel>
          <Textarea
            id="situation"
            value={values.situation}
            maxLength={1500}
            aria-invalid={!!issues.situation}
            onChange={(e) => change("situation", e.target.value)}
            placeholder={m(
              "Por ejemplo: cómo cuidamos el agua en nuestra comunidad"
            )}
          />
        </Field>
        <FieldSet>
          <FieldLegend variant="label">
            {m("Enfoques transversales (opcional)")}
          </FieldLegend>
          <FieldGroup className="gap-3">
            {catalog.approaches.map((a) => (
              <Field key={a.id} orientation="horizontal">
                <Checkbox
                  id={a.id}
                  checked={values.approachIds.includes(a.id)}
                  onCheckedChange={(checked) =>
                    change(
                      "approachIds",
                      toggle(values.approachIds, a.id, checked)
                    )
                  }
                />
                <FieldLabel htmlFor={a.id} className="font-normal">
                  {m(a.label)}
                </FieldLabel>
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>
        <p className="text-sm text-muted-foreground">
          {m(
            "Contexto copiado de tu perfil. Los ajustes de esta sesión no cambian tu configuración habitual."
          )}
        </p>
        <ContextFields
          value={values.context}
          onChange={(context) => change("context", context)}
          disabled={busy}
          prefix="session"
        />
      </FieldSet>
      <FieldSet disabled={busy} className="gap-5">
        <FieldLegend>{m("Momento de la sesión y tiempo")}</FieldLegend>
        <Field>
          <FieldLabel id="moment-label">{m("Momento pedagógico")}</FieldLabel>
          <ToggleGroup
            aria-labelledby="moment-label"
            variant="outline"
            className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3"
            value={values.moment ? [values.moment] : []}
            onValueChange={(selected) => {
              const moment = (selected[0] ||
                "") as LearningSessionInput["moment"]
              onChange({
                ...values,
                moment,
                durationMinutes:
                  values.durationMinutes ??
                  (moment === "development" ? 20 : moment ? 10 : null),
              })
            }}
          >
            {(["start", "development", "closing"] as const).map((moment) => (
              <ToggleGroupItem
                key={moment}
                value={moment}
                className="h-auto flex-col items-start gap-1 p-4 whitespace-normal"
              >
                <span>{m(momentLabels[moment])}</span>
                <span className="text-xs text-muted-foreground">
                  {moment === "start"
                    ? m("Motivación y saberes previos")
                    : moment === "development"
                      ? m("Gestión y acompañamiento")
                      : m("Reflexión y evaluación")}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        <Field data-invalid={!!issues.durationMinutes}>
          <FieldLabel htmlFor="duration">
            {m("Tiempo previsto para la actividad (minutos)")}
          </FieldLabel>
          <Input
            id="duration"
            className="max-w-40"
            type="number"
            min={1}
            max={240}
            step={1}
            value={values.durationMinutes ?? ""}
            aria-invalid={!!issues.durationMinutes}
            onChange={(e) =>
              change(
                "durationMinutes",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />
          <FieldDescription>
            {m(
              "Sugerencias: Inicio 10 min, Desarrollo 20 min, Cierre 10 min. Son editables y no constituyen tiempos obligatorios del CNEB."
            )}
          </FieldDescription>
        </Field>
      </FieldSet>
    </FieldGroup>
  )
}
