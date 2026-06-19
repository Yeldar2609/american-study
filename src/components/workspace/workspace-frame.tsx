import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { UserRole } from "@/lib/auth/access"
import type { DashboardStudent } from "@/lib/dashboard/dashboard-data"

export function StudentSwitcher({
  activeStudentId,
  label,
  role,
  section,
  students,
}: {
  readonly activeStudentId: string
  readonly label: string
  readonly role: UserRole
  readonly section: string
  readonly students: readonly DashboardStudent[]
}) {
  if (students.length < 2) {
    return null
  }
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">{label}</legend>
      {students.map((student) => (
        <Link
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            student.id === activeStudentId
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-white text-slate-700"
          }`}
          href={`/app/${role}?section=${section}&student=${student.id}`}
          key={student.id}
        >
          {student.name}
        </Link>
      ))}
    </fieldset>
  )
}

export function WorkspaceMessage({
  body,
  title,
}: {
  readonly body: string
  readonly title: string
}) {
  return (
    <Card className="mt-8 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
      <h1 className="text-2xl font-black text-slate-950">{title}</h1>
      <p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">{body}</p>
    </Card>
  )
}
