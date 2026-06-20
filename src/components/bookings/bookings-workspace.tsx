import { CalendarDays, Clock3 } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import { LockedCard } from "@/components/locked-card"
import { Card } from "@/components/ui/card"
import { StudentSwitcher, WorkspaceMessage } from "@/components/workspace/workspace-frame"
import type { UserRole } from "@/lib/auth/access"
import type { DashboardDataResult } from "@/lib/dashboard/dashboard-data"
import { readPrivateEnv } from "@/lib/env"
import { resolveWorkspaceAccess } from "@/lib/workspace/feature-access"
import { requestBookingAction } from "@/lib/workspace/workflow-actions"
import type { Booking } from "@/lib/workspace/workflow-data"
import { getBookingsData } from "@/lib/workspace/workflow-queries"

const bookingTypes = [
  "school_list_review",
  "essay_review",
  "mock_interview",
  "final_application_check",
  "general_strategy",
] as const

export async function BookingsWorkspace({
  data,
  locale,
  role,
  selectedStudentId,
}: {
  readonly data: DashboardDataResult
  readonly locale: string
  readonly role: UserRole
  readonly selectedStudentId?: string | undefined
}) {
  const t = await getTranslations("bookings")
  if (data.kind !== "ready") {
    return <WorkspaceMessage body={t("loadError")} title={t("title")} />
  }
  const access = resolveWorkspaceAccess(data.students, selectedStudentId, role !== "admin")
  switch (access.kind) {
    case "empty":
    case "not_found":
      return <WorkspaceMessage body={t(`empty.${access.kind}`)} title={t("title")} />
    case "locked":
      return (
        <div className="mt-8 max-w-2xl">
          <LockedCard description={t("lockedBody")} title={t("title")} />
        </div>
      )
    case "ready":
      break
  }
  const result = await getBookingsData(access.studentId)
  if (result.kind !== "ready") {
    return <WorkspaceMessage body={t("loadError")} title={t("title")} />
  }
  const calendarConfigured = readPrivateEnv().CALENDAR_BOOKING_LINK !== undefined

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
        <StudentSwitcher
          activeStudentId={access.studentId}
          label={t("studentPicker")}
          role={role}
          section="bookings"
          students={data.students}
        />
      </div>
      {!calendarConfigured ? (
        <WorkspaceMessage body={t("configurationBody")} title={t("configurationTitle")} />
      ) : role === "parent" ? (
        <p className="mt-6 rounded-2xl bg-blue-50 p-4 font-bold text-blue-800">
          {t("parentReadOnly")}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bookingTypes.map((type) => (
            <BookingTypeCard key={type} locale={locale} studentId={access.studentId} type={type} />
          ))}
        </div>
      )}
      <BookingHistory bookings={result.value} />
    </section>
  )
}

async function BookingTypeCard({
  locale,
  studentId,
  type,
}: {
  readonly locale: string
  readonly studentId: string
  readonly type: (typeof bookingTypes)[number]
}) {
  const t = await getTranslations("bookings")
  const action = requestBookingAction.bind(null, locale)
  return (
    <Card className="p-5">
      <CalendarDays className="size-7 text-blue-600" />
      <h2 className="mt-4 text-xl font-black text-slate-950">{t(`types.${type}.title`)}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{t(`types.${type}.body`)}</p>
      <form action={action} className="mt-4">
        <input name="studentId" type="hidden" value={studentId} />
        <input name="type" type="hidden" value={type} />
        <button
          className="min-h-11 w-full rounded-xl bg-blue-600 px-4 font-bold text-white"
          type="submit"
        >
          {t("book")}
        </button>
      </form>
    </Card>
  )
}

async function BookingHistory({ bookings }: { readonly bookings: readonly Booking[] }) {
  const t = await getTranslations("bookings")
  const format = await getFormatter()
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-black text-slate-950">{t("history")}</h2>
      {bookings.length === 0 ? (
        <p className="mt-3 text-slate-600">{t("empty.items")}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {bookings.map((booking) => (
            <Card
              className="flex flex-wrap items-center justify-between gap-4 p-4"
              key={booking.id}
            >
              <div>
                <p className="font-black text-slate-950">{t(`types.${booking.type}.title`)}</p>
                <p className="mt-1 text-sm font-bold text-blue-700">
                  {t(`statuses.${booking.status}`)}
                </p>
              </div>
              {booking.scheduled_at && (
                <p className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <Clock3 className="size-4" />
                  {format.dateTime(new Date(booking.scheduled_at), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
