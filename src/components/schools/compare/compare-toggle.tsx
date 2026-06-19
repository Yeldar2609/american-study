"use client"

import { useTranslations } from "next-intl"
import { useCompare } from "@/components/schools/compare/compare-context"

export function CompareToggle({ schoolId }: { readonly schoolId: string }) {
  const t = useTranslations("schools")
  const { canAdd, isSelected, toggle } = useCompare()
  const selected = isSelected(schoolId)
  const disabled = !selected && !canAdd(schoolId)

  return (
    <label
      className={`mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold ${
        disabled ? "text-slate-400" : "text-slate-700"
      }`}
    >
      <input
        checked={selected}
        className="size-4 accent-blue-600"
        disabled={disabled}
        onChange={() => toggle(schoolId)}
        type="checkbox"
      />
      {t(disabled ? "compare.limit" : "compare.add")}
    </label>
  )
}
