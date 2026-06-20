import type { InputHTMLAttributes, ReactNode } from "react"
import { Input } from "@/components/ui/input"

type StudentFormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  readonly error?: string | undefined
  readonly label: string
  readonly trailing?: ReactNode
}

export function StudentFormField({ error, label, trailing, ...inputProps }: StudentFormFieldProps) {
  const inputId = inputProps.id ?? inputProps.name
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor={inputId}>
      <span className="flex items-center justify-between gap-3">
        {label}
        {trailing}
      </span>
      <Input aria-invalid={error !== undefined} id={inputId} {...inputProps} />
      {error !== undefined && <span className="text-xs font-bold text-red-600">{error}</span>}
    </label>
  )
}
