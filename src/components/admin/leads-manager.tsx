import { getFormatter, getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { setLeadHandledAction } from "@/lib/admin/leads-actions"
import { getConsultationLeads } from "@/lib/admin/leads-queries"

export async function LeadsManager({ locale }: { readonly locale: string }) {
  const t = await getTranslations("leads")
  const format = await getFormatter()
  const result = await getConsultationLeads()

  return (
    <section className="mt-8">
      <h1 className="text-3xl font-black text-slate-950">{t("title")}</h1>
      {result.kind !== "ready" || result.leads.length === 0 ? (
        <Card className="mt-6 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
          <p className="mx-auto max-w-xl leading-7 text-slate-600">{t("empty")}</p>
        </Card>
      ) : (
        <Card className="mt-6 overflow-x-auto">
          <table className="w-full min-w-3xl border-collapse text-left">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="p-4">{t("colName")}</th>
                <th className="p-4">{t("colPhone")}</th>
                <th className="p-4">{t("colEmail")}</th>
                <th className="p-4">{t("colGrade")}</th>
                <th className="p-4">{t("colDate")}</th>
                <th className="p-4">{t("colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {result.leads.map((lead) => (
                <tr className="border-t border-slate-100 align-top" key={lead.id}>
                  <td className="p-4 font-black text-slate-950">{lead.fullName}</td>
                  <td className="p-4 text-slate-700">{lead.phone}</td>
                  <td className="p-4 text-slate-700">{lead.email ?? t("notSet")}</td>
                  <td className="p-4 text-slate-700">{lead.grade ?? t("notSet")}</td>
                  <td className="p-4 text-slate-600">
                    {format.dateTime(new Date(lead.createdAt), { dateStyle: "medium" })}
                  </td>
                  <td className="p-4">
                    <Badge
                      className={
                        lead.handled ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-700"
                      }
                    >
                      {lead.handled ? t("handled") : t("new")}
                    </Badge>
                    <form action={setLeadHandledAction} className="mt-3">
                      <input name="leadId" type="hidden" value={lead.id} />
                      <input name="locale" type="hidden" value={locale} />
                      <input name="handled" type="hidden" value={lead.handled ? "false" : "true"} />
                      <Button size="default" type="submit" variant="secondary">
                        {lead.handled ? t("markUnhandled") : t("markHandled")}
                      </Button>
                    </form>
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
