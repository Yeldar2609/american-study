import "server-only"

import type { UserRole } from "@/lib/auth/access"
import { createAdminClient } from "@/lib/supabase/admin"

export type AccountRow = {
  readonly fullName: string
  readonly id: string
  readonly role: UserRole
  readonly username: string
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
    .select("id, full_name, role, username")
    .order("role")
    .order("username")

  if (error !== null || data === null) {
    return { kind: "error" }
  }

  const rows = data as ReadonlyArray<{
    readonly full_name: string | null
    readonly id: string
    readonly role: UserRole
    readonly username: string | null
  }>
  const accounts = rows.map((row) => ({
    fullName: row.full_name ?? "",
    id: row.id,
    role: row.role,
    username: row.username ?? "",
  }))

  return {
    accounts,
    adminCount: accounts.filter((account) => account.role === "admin").length,
    kind: "ready",
  }
}
