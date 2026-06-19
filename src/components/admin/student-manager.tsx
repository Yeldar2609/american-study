import { CircleAlert, GraduationCap, Plus, Users } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { CreateStudentForm } from "@/components/admin/create-student-form"
import { StudentProfileEditor } from "@/components/admin/student-profile-editor"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { getAdminStudentProfile } from "@/lib/admin/student-profile-query"
import { listAdminStudents } from "@/lib/admin/student-queries"

type StudentManagerProps = {
  readonly locale: string
  readonly selectedStudentId?: string | undefined
}

export async function StudentManager({ locale, selectedStudentId }: StudentManagerProps) {
  const t = await getTranslations("adminStudents")
  const result = await listAdminStudents()
  const selected =
    selectedStudentId === undefined ? null : await getAdminStudentProfile(selectedStudentId)

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-br from-blue-600 to-cyan-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/20">
              <Users aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-sm font-bold text-blue-50">{t("listEyebrow")}</p>
              <h2 className="text-2xl font-black">{t("listTitle")}</h2>
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-5">
          {result.kind === "configuration" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <CircleAlert className="size-6 text-amber-700" />
              <p className="mt-3 font-black text-amber-950">{t("configurationTitle")}</p>
              <p className="mt-1 text-sm leading-6 text-amber-900/75">{t("configurationBody")}</p>
            </div>
          )}
          {result.kind === "error" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 font-bold text-rose-800">
              {t("loadError")}
            </div>
          )}
          {result.kind === "ready" && result.students.length === 0 && (
            <div className="grid place-items-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-5 py-12 text-center">
              <GraduationCap className="size-9 text-blue-600" />
              <p className="mt-4 font-black text-slate-950">{t("emptyTitle")}</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">{t("emptyBody")}</p>
            </div>
          )}
          {result.kind === "ready" &&
            result.students.map((student) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/60"
                key={student.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">{student.fullName}</h3>
                    <p className="mt-1 text-sm text-slate-500">{student.email}</p>
                  </div>
                  <Badge
                    className={
                      student.packageState === "paid"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-cyan-50 text-cyan-800"
                    }
                  >
                    {t(`options.${student.packageState}`)}
                  </Badge>
                </div>
                <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">
                  {t(`stages.${student.stage}`)}
                </p>
                <Link
                  className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                  href={`/app/admin?section=people&student=${student.id}`}
                >
                  {t("editProfile")}
                </Link>
              </article>
            ))}
        </div>
      </Card>

      <Card className="h-fit p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-rose-100 text-rose-700">
            <Plus aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-bold text-rose-700">
              {selected?.kind === "ready" ? t("editEyebrow") : t("formEyebrow")}
            </p>
            <h2 className="text-2xl font-black text-slate-950">
              {selected?.kind === "ready" ? t("editTitle") : t("formTitle")}
            </h2>
          </div>
        </div>
        {selected?.kind === "ready" ? (
          <StudentProfileEditor locale={locale} profile={selected.profile} />
        ) : selected !== null && selected.kind !== "notFound" ? (
          <div className="rounded-2xl bg-rose-50 p-4 font-bold text-rose-800">
            {t(selected.kind === "configuration" ? "configurationBody" : "loadError")}
          </div>
        ) : (
          <CreateStudentForm locale={locale} />
        )}
      </Card>
    </div>
  )
}
