"use client"

import { useLocale, useTranslations } from "next-intl"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { InterviewPrepItem } from "@/lib/workspace/interview-data"

type Action = (formData: FormData) => void | Promise<void>

type InterviewBoardProps = {
  readonly canEdit: boolean
  readonly canReview: boolean
  readonly feedbackAction: Action
  readonly items: readonly InterviewPrepItem[]
  readonly saveAction: Action
}

export function InterviewBoard({
  canEdit,
  canReview,
  feedbackAction,
  items,
  saveAction,
}: InterviewBoardProps) {
  const grouped = new Map<string, InterviewPrepItem[]>()
  for (const item of items) {
    const list = grouped.get(item.category) ?? []
    list.push(item)
    grouped.set(item.category, list)
  }

  return (
    <div className="mt-6 grid gap-8">
      {[...grouped.entries()].map(([category, questions]) => (
        <section key={category}>
          <h2 className="text-xl font-black text-slate-950">{category}</h2>
          <div className="mt-3 grid gap-3">
            {questions.map((item) => (
              <QuestionCard
                canEdit={canEdit}
                canReview={canReview}
                feedbackAction={feedbackAction}
                item={item}
                key={item.questionId}
                saveAction={saveAction}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function QuestionCard({
  canEdit,
  canReview,
  feedbackAction,
  item,
  saveAction,
}: {
  readonly canEdit: boolean
  readonly canReview: boolean
  readonly feedbackAction: Action
  readonly item: InterviewPrepItem
  readonly saveAction: Action
}) {
  const t = useTranslations("interview")
  const locale = useLocale()
  const fieldId = useId()
  const question = locale === "ru" ? item.questionRu : item.questionEn
  const tip = locale === "ru" ? item.tipRu : item.tipEn

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-black text-slate-950">{question}</h3>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {t(`status.${item.status}`)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        <span className="font-bold text-slate-700">{t("tip")}</span>
        {tip}
      </p>

      {item.sampleYoutubeId !== null && (
        <iframe
          allowFullScreen
          className="mt-3 aspect-video w-full rounded-2xl"
          src={`https://www.youtube-nocookie.com/embed/${item.sampleYoutubeId}`}
          title={question}
        />
      )}

      {canEdit ? (
        <form action={saveAction} className="mt-4 grid gap-3">
          <input name="questionId" type="hidden" value={item.questionId} />
          <label
            className="grid gap-1 text-sm font-bold text-slate-700"
            htmlFor={`${fieldId}-notes`}
          >
            {t("yourAnswer")}
            <textarea
              className="min-h-24 rounded-xl border border-slate-200 p-3"
              defaultValue={item.responseNotes ?? ""}
              id={`${fieldId}-notes`}
              name="responseNotes"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label
              className="grid gap-1 text-sm font-bold text-slate-700"
              htmlFor={`${fieldId}-rating`}
            >
              {t("selfRating")}
              <select
                className="min-h-11 rounded-xl border border-slate-200 px-3"
                defaultValue={item.selfRating === null ? "" : String(item.selfRating)}
                id={`${fieldId}-rating`}
                name="selfRating"
              >
                <option value="">{t("notRated")}</option>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label
              className="grid gap-1 text-sm font-bold text-slate-700"
              htmlFor={`${fieldId}-status`}
            >
              {t("statusLabel")}
              <select
                className="min-h-11 rounded-xl border border-slate-200 px-3"
                defaultValue={item.status === "reviewed" ? "practiced" : item.status}
                id={`${fieldId}-status`}
                name="status"
              >
                <option value="todo">{t("status.todo")}</option>
                <option value="practiced">{t("status.practiced")}</option>
              </select>
            </label>
            <label
              className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-1"
              htmlFor={`${fieldId}-recording`}
            >
              {t("recordingLink")}
              <input
                className="min-h-11 rounded-xl border border-slate-200 px-3"
                defaultValue={item.recordingLink ?? ""}
                id={`${fieldId}-recording`}
                name="recordingLink"
                type="url"
              />
            </label>
          </div>
          <div>
            <Button type="submit">{t("save")}</Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          {item.responseNotes === null ? (
            <span className="text-slate-500">{t("noAnswer")}</span>
          ) : (
            <p className="whitespace-pre-wrap">{item.responseNotes}</p>
          )}
        </div>
      )}

      {item.adminFeedback !== null && (
        <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-900">
          <span className="font-bold">{t("feedback")}</span>
          {item.adminFeedback}
        </div>
      )}

      {canReview &&
        (item.practiceId === null ? (
          <p className="mt-3 text-sm text-slate-500">{t("noAnswer")}</p>
        ) : (
          <form action={feedbackAction} className="mt-3 grid gap-2">
            <input name="practiceId" type="hidden" value={item.practiceId} />
            <label
              className="grid gap-1 text-sm font-bold text-slate-700"
              htmlFor={`${fieldId}-feedback`}
            >
              {t("leaveFeedback")}
              <textarea
                className="min-h-20 rounded-xl border border-slate-200 p-3"
                defaultValue={item.adminFeedback ?? ""}
                id={`${fieldId}-feedback`}
                name="feedback"
              />
            </label>
            <div>
              <Button type="submit" variant="secondary">
                {t("saveFeedback")}
              </Button>
            </div>
          </form>
        ))}
    </Card>
  )
}
