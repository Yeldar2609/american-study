// Pure, client-safe helpers for the current-school picker. No server imports
// here so the picker (a client component) and unit tests can use them directly.

export type CurrentSchoolOption = {
  readonly id: string
  readonly name: string
  readonly city: string | null
  readonly region: string | null
  readonly code: string | null
}

export function currentSchoolLabel(option: CurrentSchoolOption): string {
  const place = [option.city, option.region].filter((part) => part && part.length > 0)
  return place.length > 0 ? `${option.name} — ${[...new Set(place)].join(", ")}` : option.name
}

// Case-insensitive search across name, city, region, and code.
export function filterCurrentSchools(
  options: readonly CurrentSchoolOption[],
  query: string,
): readonly CurrentSchoolOption[] {
  const needle = query.trim().toLocaleLowerCase()
  if (needle === "") {
    return options
  }
  return options.filter((option) => {
    const haystack = [option.name, option.city, option.region, option.code]
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .join(" ")
      .toLocaleLowerCase()
    return haystack.includes(needle)
  })
}
