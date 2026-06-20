"use client"

import { Check, ChevronsUpDown, School } from "lucide-react"
import { useTranslations } from "next-intl"
import { type KeyboardEvent, useId, useMemo, useState } from "react"
import {
  type CurrentSchoolOption,
  currentSchoolLabel,
  filterCurrentSchools,
} from "@/lib/current-schools/options"

type CurrentSchoolPickerProps = {
  readonly options: readonly CurrentSchoolOption[]
  readonly label: string
  readonly defaultSchoolId?: string | null
  readonly defaultSchoolText?: string | null
  readonly defaultIndependent?: boolean
}

const controlClassName =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

// Searchable, keyboard-accessible current-school picker. Submits three hidden
// fields the admin form parser understands:
//   currentSchoolId       — uuid of a catalog match, or "" for custom/independent
//   currentSchool         — display/fallback text (catalog name or typed name)
//   isIndependentStudent  — "true" | "false"
export function CurrentSchoolPicker({
  options,
  label,
  defaultSchoolId = null,
  defaultSchoolText = null,
  defaultIndependent = false,
}: CurrentSchoolPickerProps) {
  const t = useTranslations("adminStudents.picker")
  const listId = useId()

  const defaultOption =
    defaultSchoolId === null ? null : (options.find((o) => o.id === defaultSchoolId) ?? null)

  const [independent, setIndependent] = useState(defaultIndependent)
  const [selectedId, setSelectedId] = useState<string | null>(defaultOption?.id ?? null)
  const [query, setQuery] = useState(
    defaultOption !== null ? currentSchoolLabel(defaultOption) : (defaultSchoolText ?? ""),
  )
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const filtered = useMemo(() => filterCurrentSchools(options, query), [options, query])
  const trimmed = query.trim()
  const hasExactMatch = options.some((o) => currentSchoolLabel(o) === trimmed || o.name === trimmed)
  const showCustomRow = trimmed.length > 0 && !hasExactMatch

  // Total selectable rows = filtered options (+ optional custom row).
  const rowCount = filtered.length + (showCustomRow ? 1 : 0)

  const currentSchoolText = useMemo(() => {
    if (independent) {
      return ""
    }
    if (selectedId !== null) {
      return defaultOption?.id === selectedId
        ? defaultOption.name
        : (options.find((o) => o.id === selectedId)?.name ?? "")
    }
    return trimmed
  }, [independent, selectedId, defaultOption, options, trimmed])

  function chooseOption(option: CurrentSchoolOption) {
    setSelectedId(option.id)
    setQuery(currentSchoolLabel(option))
    setOpen(false)
  }

  function chooseCustom() {
    setSelectedId(null)
    setOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setOpen(true)
      setHighlight((index) => (rowCount === 0 ? 0 : (index + 1) % rowCount))
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlight((index) => (rowCount === 0 ? 0 : (index - 1 + rowCount) % rowCount))
      return
    }
    if (event.key === "Enter" && open) {
      event.preventDefault()
      if (highlight < filtered.length) {
        const option = filtered[highlight]
        if (option !== undefined) {
          chooseOption(option)
        }
      } else if (showCustomRow) {
        chooseCustom()
      }
      return
    }
    if (event.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
      <span>{label}</span>

      <label className="flex items-center gap-2 font-bold text-slate-700">
        <input
          checked={independent}
          className="size-4 rounded border-slate-300"
          name="isIndependentStudent"
          onChange={(event) => {
            const next = event.target.checked
            setIndependent(next)
            if (next) {
              setSelectedId(null)
              setQuery("")
              setOpen(false)
            }
          }}
          type="checkbox"
          value="true"
        />
        {t("independent")}
      </label>

      {!independent && (
        <div className="relative">
          <div className="relative">
            <School
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-activedescendant={open && rowCount > 0 ? `${listId}-${highlight}` : undefined}
              aria-autocomplete="list"
              aria-controls={listId}
              aria-expanded={open}
              autoComplete="off"
              className={`${controlClassName} pl-10 pr-10`}
              onBlur={() => {
                // Allow option mousedown to register before closing.
                window.setTimeout(() => setOpen(false), 120)
              }}
              onChange={(event) => {
                setQuery(event.target.value)
                setSelectedId(null)
                setOpen(true)
                setHighlight(0)
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={t("searchPlaceholder")}
              role="combobox"
              type="text"
              value={query}
            />
            <ChevronsUpDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
          </div>

          {open && (
            <div
              className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-200/70"
              id={listId}
              role="listbox"
            >
              {filtered.map((option, index) => (
                <div
                  aria-selected={selectedId === option.id}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-4 py-2 text-sm font-semibold ${
                    index === highlight ? "bg-blue-50 text-blue-800" : "text-slate-700"
                  }`}
                  id={`${listId}-${index}`}
                  key={option.id}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    chooseOption(option)
                  }}
                  onMouseEnter={() => setHighlight(index)}
                  role="option"
                  tabIndex={-1}
                >
                  <span>{currentSchoolLabel(option)}</span>
                  {selectedId === option.id && (
                    <Check aria-hidden="true" className="size-4 text-blue-700" />
                  )}
                </div>
              ))}

              {showCustomRow && (
                <div
                  aria-selected={false}
                  className={`cursor-pointer px-4 py-2 text-sm font-semibold ${
                    highlight === filtered.length ? "bg-blue-50 text-blue-800" : "text-slate-700"
                  }`}
                  id={`${listId}-${filtered.length}`}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    chooseCustom()
                  }}
                  onMouseEnter={() => setHighlight(filtered.length)}
                  role="option"
                  tabIndex={-1}
                >
                  {t("useTyped", { query: trimmed })}
                </div>
              )}

              {rowCount === 0 && (
                <p className="px-4 py-2 text-sm text-slate-500">{t("noResults")}</p>
              )}
            </div>
          )}

          <p className="mt-1 text-xs font-medium text-slate-500">{t("cantFind")}</p>
        </div>
      )}

      {/* Hidden submitted values derived from picker state. */}
      <input name="currentSchoolId" type="hidden" value={independent ? "" : (selectedId ?? "")} />
      <input name="currentSchool" type="hidden" value={currentSchoolText} />
      {!independent && <input name="isIndependentStudent" type="hidden" value="false" />}
    </div>
  )
}
