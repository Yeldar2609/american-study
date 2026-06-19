// Pure selection logic for the school-comparison feature (A3). Kept out of the
// React layer so the "at most three" rule is unit-testable without a DOM.
export const MAX_COMPARE = 3

export function canAddToCompare(selected: readonly string[], id: string): boolean {
  return selected.includes(id) || selected.length < MAX_COMPARE
}

// Toggles `id` in the selection: removes it when present, adds it when there is
// room, and otherwise returns the selection unchanged (never exceeds MAX_COMPARE).
export function toggleCompare(selected: readonly string[], id: string): string[] {
  if (selected.includes(id)) {
    return selected.filter((value) => value !== id)
  }
  if (selected.length >= MAX_COMPARE) {
    return [...selected]
  }
  return [...selected, id]
}
