"use client"

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react"
import { canAddToCompare, toggleCompare } from "@/lib/match/compare-selection"

export type ComparableSchool = {
  readonly body: "coed" | "boys" | "girls" | null
  readonly city: string | null
  readonly enrollment: number | null
  readonly financialAid: boolean | null
  readonly id: string
  readonly matchPercent: number
  readonly name: string
  readonly saoDeadline: string | null
  readonly setting: "urban" | "suburban" | "rural" | null
  readonly shortlisted: boolean
  readonly starred: boolean
  readonly state: string | null
  readonly status: "researching" | "applied" | "submitted"
  readonly strengths: readonly string[]
  readonly tuition: number | null
}

type CompareContextValue = {
  readonly canAdd: (id: string) => boolean
  readonly clear: () => void
  readonly isSelected: (id: string) => boolean
  readonly items: readonly ComparableSchool[]
  readonly selected: readonly string[]
  readonly toggle: (id: string) => void
}

const CompareContext = createContext<CompareContextValue | null>(null)

export function CompareProvider({
  children,
  items,
}: {
  readonly children: ReactNode
  readonly items: readonly ComparableSchool[]
}) {
  const [selected, setSelected] = useState<readonly string[]>([])

  const toggle = useCallback((id: string) => {
    setSelected((current) => toggleCompare(current, id))
  }, [])
  const clear = useCallback(() => setSelected([]), [])

  const value = useMemo<CompareContextValue>(
    () => ({
      canAdd: (id) => canAddToCompare(selected, id),
      clear,
      isSelected: (id) => selected.includes(id),
      items,
      selected,
      toggle,
    }),
    [clear, items, selected, toggle],
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare(): CompareContextValue {
  const value = useContext(CompareContext)
  if (value === null) {
    throw new Error("useCompare must be used within a CompareProvider")
  }
  return value
}
