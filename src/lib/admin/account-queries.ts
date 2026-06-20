import "server-only"

import type { UserRole } from "@/lib/auth/access"
import { createAdminClient } from "@/lib/supabase/admin"

export type AccountRow = {
  readonly email: string
  readonly fullName: string
  readonly id: string
  readonly role: UserRole
}

export type AccountList =
  | {
      readonly kind: "ready"
      readonly accounts: readonly AccountRow[]
      readonly adminCount: number
    }
  | { readonly kind: "configuration" }
  | { readonly kind: "error" }

// Admin-only listing of every account. Rendered exclusively inside the
// admin-gated People section, so the service-role read is acceptable.
export async function listAccounts(): Promise<AccountList> {
  const admin = createAdminClient()
  if (admin === null) {
    return { kind: "configuration" }
  }

  const { data, error } = await admin
    .from("users")
    .select("id, email, full_name, role")
    .order("role")
    .order("email")

  if (error !== null || data === null) {
    return { kind: "error" }
  }

  const rows = data as ReadonlyArray<{
    readonly email: string | null
    readonly full_name: string | null
    readonly id: string
    readonly role: UserRole
  }>
  const accounts = rows.map((row) => ({
    email: row.email ?? "",
    fullName: row.full_name ?? "",
    id: row.id,
    role: row.role,
  }))

  return {
    accounts,
    adminCount: accounts.filter((account) => account.role === "admin").length,
    kind: "ready",
  }
}
