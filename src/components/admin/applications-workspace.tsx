import { Download, Send } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import { Card } from "@/components/ui/card"
import { WorkspaceMessage } from "@/components/workspace/workspace-frame"
import { applicationRowsToCsv } from "@/lib/workspace/collaboration-data"
import { getAdminApplications } from "@/lib/workspace/collaboration-queries"

export async function ApplicationsWorkspace() {
  const t = await getTranslations("applications")
  const format = await getFormatter()
  const result = await getAdminApplications()
  if (result.kind !== "ready") {
    return <WorkspaceMessage body={t("loadError")} title={t("title")} />
  }
  const csv = encodeURIComponent(applicationRowsToCsv(result.value))
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-blue-700">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{t("title")}</h1>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">{t("body")}</p>
        </div>
        <a
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white"
          download="american-study-applications.csv"
          href={`data:text/csv;charset=utf-8,%EF%BB%BF${csv}`}
        >
          <Download className="size-4" />
          {t("export")}
        </a>
      </div>
      {result.value.length === 0 ? (
        <WorkspaceMessage body={t("empty")} title={t("emptyTitle")} />
      ) : (
        <Card className="mt-6 overflow-x-auto">
          <table className="w-full min-w-2xl border-collapse text-left">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="p-4">{t("student")}</th>
                <th className="p-4">{t("school")}</th>
                <th className="p-4">{t("status")}</th>
                <th className="p-4">{t("deadline")}</th>
              </tr>
            </thead>
            <tbody>
              {result.value.map((row) => (
                <tr
                  className="border-t border-slate-100"
                  key={`${row.student_name}-${row.school_name}`}
                >
                  <td className="p-4 font-black text-slate-950">{row.student_name}</td>
                  <td className="p-4 text-slate-700">{row.school_name}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-2 font-bold text-blue-700">
                      <Send className="size-4" />
                      {t(`statuses.${row.status}`)}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    {row.sao_deadline
                      ? format.dateTime(new Date(`${row.sao_deadline}T00:00:00`), {
                          dateStyle: "medium",
                        })
                      : t("notSet")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  )
}
