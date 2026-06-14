import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const studentListRowSchema = z.object({
  created_at: z.string(),
  id: z.string(),
  package_state: z.enum(["trial", "paid"]),
  stage: z.enum(["diagnostic", "trial", "list_building", "finalized", "application", "submitted"]),
  user_id: z.string(),
})

const userListRowSchema = z.object({
  email: z.string(),
  full_name: z.string(),
  id: z.string(),
})

export type AdminStudentListItem = {
  readonly createdAt: string
  readonly email: string
  readonly fullName: string
  readonly id: string
  readonly packageState: "trial" | "paid"
  readonly stage:
    | "diagnostic"
    | "trial"
    | "list_building"
    | "finalized"
    | "application"
    | "submitted"
}

export type AdminStudentListResult =
  | { readonly kind: "ready"; readonly students: readonly AdminStudentListItem[] }
  | { readonly kind: "configuration" }
  | { readonly kind: "error" }

export async function listAdminStudents(): Promise<AdminStudentListResult> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const { data: studentData, error: studentError } = await supabase
    .from("students")
    .select("id,user_id,package_state,stage,created_at")
    .order("created_at", { ascending: false })
  if (studentError !== null) {
    return { kind: "error" }
  }

  const students = z.array(studentListRowSchema).safeParse(studentData)
  if (!students.success) {
    return { kind: "error" }
  }
  const userIds = students.data.map((student) => student.user_id)
  if (userIds.length === 0) {
    return { kind: "ready", students: [] }
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id,email,full_name")
    .in("id", userIds)
  const users = z.array(userListRowSchema).safeParse(userData)
  if (userError !== null || !users.success) {
    return { kind: "error" }
  }
  const userById = new Map(users.data.map((user) => [user.id, user]))

  return {
    kind: "ready",
    students: students.data.flatMap((student) => {
      const user = userById.get(student.user_id)
      return user === undefined
        ? []
        : [
            {
              createdAt: student.created_at,
              email: user.email,
              fullName: user.full_name,
              id: student.id,
              packageState: student.package_state,
              stage: student.stage,
            },
          ]
    }),
  }
}
