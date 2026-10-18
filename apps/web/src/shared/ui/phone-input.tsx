import { useState, type ComponentProps } from "react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@workspace/ui/components/input-group"
import { nationalPhone, phoneEdit } from "@/shared/lib/peruvian-phone"

type Props = Omit<
  ComponentProps<"input">,
  | "value"
  | "defaultValue"
  | "onChange"
  | "onPaste"
  | "type"
  | "maxLength"
  | "pattern"
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export function PhoneInput({
  value,
  defaultValue = "",
  onValueChange,
  disabled,
  ...props
}: Props) {
  const [draft, setDraft] = useState(() => nationalPhone(defaultValue))
  const current = value === undefined ? draft : nationalPhone(value)
  function update(next: string) {
    const number = phoneEdit(next)
    if (number === null) return
    setDraft(number)
    onValueChange?.(number)
  }
  return (
    <InputGroup aria-disabled={disabled}>
      <InputGroupInput
        {...props}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="999999999"
        maxLength={9}
        pattern="9[0-9]{8}"
        value={current}
        disabled={disabled}
        onChange={(event) => update(event.target.value)}
        onPaste={(event) => {
          event.preventDefault()
          const pasted = nationalPhone(event.clipboardData.getData("text"))
          const input = event.currentTarget
          const start = input.selectionStart ?? current.length
          const end = input.selectionEnd ?? start
          update(current.slice(0, start) + pasted + current.slice(end))
        }}
      />
      <InputGroupAddon>
        <InputGroupText>+51</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}
