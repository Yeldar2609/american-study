import { getTranslations } from "next-intl/server"
import { adminSaveFaqAction, adminSaveVideoAction } from "@/lib/workspace/collaboration-actions"

export async function AdminContentForms({ locale }: { readonly locale: string }) {
  const t = await getTranslations("resources.admin")
  const videoAction = adminSaveVideoAction.bind(null, locale)
  const faqAction = adminSaveFaqAction.bind(null, locale)
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <details className="rounded-3xl border border-blue-100 bg-white p-5">
        <summary className="cursor-pointer text-lg font-black text-blue-800">
          {t("newVideo")}
        </summary>
        <form action={videoAction} className="mt-4 grid gap-3">
          <input name="id" type="hidden" value="" />
          <Field label={t("section")} name="sectionKey" />
          <Field label={t("youtubeId")} name="youtubeId" />
          <Field label={t("titleEn")} name="titleEn" />
          <Field label={t("titleRu")} name="titleRu" />
          <Submit label={t("saveVideo")} />
        </form>
      </details>
      <details className="rounded-3xl border border-blue-100 bg-white p-5">
        <summary className="cursor-pointer text-lg font-black text-blue-800">{t("newFaq")}</summary>
        <form action={faqAction} className="mt-4 grid gap-3">
          <input name="id" type="hidden" value="" />
          <Field label={t("questionEn")} name="questionEn" />
          <Field label={t("questionRu")} name="questionRu" />
          <Area label={t("answerEn")} name="answerEn" />
          <Area label={t("answerRu")} name="answerRu" />
          <Field label={t("order")} name="order" type="number" />
          <Submit label={t("saveFaq")} />
        </form>
      </details>
    </div>
  )
}

function Field({
  label,
  name,
  type = "text",
}: {
  readonly label: string
  readonly name: string
  readonly type?: string
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <input
        className="min-h-11 rounded-xl border border-slate-200 px-3"
        name={name}
        required
        type={type}
      />
    </label>
  )
}

function Area({ label, name }: { readonly label: string; readonly name: string }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <textarea className="min-h-24 rounded-xl border border-slate-200 p-3" name={name} required />
    </label>
  )
}

function Submit({ label }: { readonly label: string }) {
  return (
    <button className="min-h-11 rounded-xl bg-slate-950 px-4 font-bold text-white" type="submit">
      {label}
    </button>
  )
}
