import { useMessages } from "@/shared/i18n/use-messages"
import type { EducationContext } from "@amautai/contracts"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
export function ContextFields({
  value,
  onChange,
  disabled = false,
  prefix = "context",
}: {
  value: EducationContext
  onChange: (value: EducationContext) => void
  disabled?: boolean
  prefix?: string
}) {
  const { m } = useMessages()

  const update = (key: keyof EducationContext, text: string) =>
    onChange({ ...value, [key]: text })
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={prefix + "-location"}>
          {m("Lugar o comunidad")}
        </FieldLabel>
        <Input
          id={prefix + "-location"}
          value={value.location}
          maxLength={200}
          disabled={disabled}
          placeholder={m("Por ejemplo: mi comunidad en Oxapampa")}
          onChange={(e) => update("location", e.target.value)}
        />
        <FieldDescription>
          {m("Sin direcciones ni datos de estudiantes.")}
        </FieldDescription>
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={prefix + "-region"}>{m("Región")}</FieldLabel>
          <Select
            items={[
              { value: "", label: m("Sin indicar") },
              { value: "coast", label: m("Costa") },
              { value: "highlands", label: m("Sierra") },
              { value: "jungle", label: m("Selva") },
            ]}
            value={value.region}
            disabled={disabled}
            onValueChange={(region) => {
              if (region !== null) update("region", region)
            }}
          >
            <SelectTrigger id={prefix + "-region"} className="w-full min-w-0">
              <SelectValue className="min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                <SelectItem value="">{m("Sin indicar")}</SelectItem>
                <SelectItem value="coast">{m("Costa")}</SelectItem>
                <SelectItem value="highlands">{m("Sierra")}</SelectItem>
                <SelectItem value="jungle">{m("Selva")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "-setting"}>{m("Ámbito")}</FieldLabel>
          <Select
            items={[
              { value: "", label: m("Sin indicar") },
              { value: "urban", label: m("Urbano") },
              { value: "rural", label: m("Rural") },
            ]}
            value={value.setting}
            disabled={disabled}
            onValueChange={(setting) => {
              if (setting !== null) update("setting", setting)
            }}
          >
            <SelectTrigger id={prefix + "-setting"} className="w-full min-w-0">
              <SelectValue className="min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                <SelectItem value="">{m("Sin indicar")}</SelectItem>
                <SelectItem value="urban">{m("Urbano")}</SelectItem>
                <SelectItem value="rural">{m("Rural")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor={prefix + "-language"}>
          {m("Idioma del grupo")}
        </FieldLabel>
        <Input
          id={prefix + "-language"}
          value={value.language}
          maxLength={100}
          disabled={disabled}
          placeholder={m("Por ejemplo: español, quechua y su variedad…")}
          onChange={(e) => update("language", e.target.value)}
        />
        <FieldDescription>
          {m("Solo orienta el contexto; no activa traducciones.")}
        </FieldDescription>
      </Field>
    </FieldGroup>
  )
}
