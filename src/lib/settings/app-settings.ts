// Shared, framework-free constants and validation for admin-editable settings.
// Keep this file pure so it unit-tests without Supabase or Next.

export const CALENDAR_BOOKING_LINK_KEY = "calendar_booking_link"

// A booking link is an absolute https URL that users are redirected to.
export function isValidBookingLink(value: string): boolean {
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}
