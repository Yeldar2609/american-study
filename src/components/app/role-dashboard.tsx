import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { AccountManager } from "@/components/admin/account-manager"
import { AdminNotificationSender } from "@/components/admin/admin-notification-sender"
import { AdminAnalytics } from "@/components/admin/analytics/admin-analytics"
import { AdminAnalyticsLoading } from "@/components/admin/analytics/admin-analytics-loading"
import { AppSettingsManager } from "@/components/admin/app-settings-manager"
import { ApplicationsWorkspace } from "@/components/admin/applications-workspace"
import { CollectionsManager } from "@/components/admin/collections-manager"
import { LeadsManager } from "@/components/admin/leads-manager"
import { SchoolEditorWorkspace } from "@/components/admin/school-editor-workspace"
import { SchoolRankings } from "@/components/admin/school-rankings"
import { StudentManager } from "@/components/admin/student-manager"
import { AppSidebar } from "@/components/app/app-sidebar"
import { DashboardHome } from "@/components/app/dashboard-home"
import { WorkspaceEmptyState } from "@/components/app/workspace-empty-state"
import { ApplicationBoardWorkspace } from "@/components/applications/application-board-workspace"
import { BookingsWorkspace } from "@/components/bookings/bookings-workspace"
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace"
import { EssaysWorkspace } from "@/components/essays/essays-workspace"
import { InterviewWorkspace } from "@/components/interview/interview-workspace"
import { ProgressReportWorkspace } from "@/components/report/progress-report-workspace"
import { ResourcesWorkspace } from "@/components/resources/resources-workspace"
import { RoadmapWorkspace } from "@/components/roadmap/roadmap-workspace"
import { SchoolsWorkspace } from "@/components/schools/schools-workspace"
import { ROLE_SECTIONS, type UserRole } from "@/lib/auth/access"
import { getDashboardData } from "@/lib/dashboard/dashboard-data"
import { resolveCalendarBookingLink } from "@/lib/settings/calendar-link"
import type { SchoolCatalogFilters } from "@/lib/workspace/school-catalog"

type RoleDashboardProps = {
  readonly locale: string
  readonly role: UserRole
  readonly section?: string | undefined
  readonly selectedStudentId?: string | undefined
  readonly selectedSchoolId?: string | undefined
  readonly selectedCollectionId?: string | undefined
  readonly schoolFilters?: SchoolCatalogFilters | undefined
}

// The shell (sidebar + chrome) renders immediately from locale/role/section
// alone; the data-heavy workspace streams in behind a Suspense boundary so the
// page paints instantly instead of blocking on the slowest query.
export function RoleDashboard({
  locale,
  role,
  section = "home",
  selectedStudentId,
  selectedSchoolId,
  selectedCollectionId,
  schoolFilters = {},
}: RoleDashboardProps) {
  const activeSection = ROLE_SECTIONS[role].some((candidate) => candidate === section)
    ? section
    : "home"

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar activeSection={activeSection} locale={locale} role={role} />
      <main className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl">
          <Suspense fallback={<WorkspaceSkeleton />}>
            <DashboardSections
              activeSection={activeSection}
              locale={locale}
              role={role}
              schoolFilters={schoolFilters}
              selectedCollectionId={selectedCollectionId}
              selectedSchoolId={selectedSchoolId}
              selectedStudentId={selectedStudentId}
            />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

async function DashboardSections({
  activeSection,
  locale,
  role,
  schoolFilters,
  selectedCollectionId,
  selectedSchoolId,
  selectedStudentId,
}: {
  readonly activeSection: string
  readonly locale: string
  readonly role: UserRole
  readonly schoolFilters: SchoolCatalogFilters
  readonly selectedCollectionId: string | undefined
  readonly selectedSchoolId: string | undefined
  readonly selectedStudentId: string | undefined
}) {
  const t = await getTranslations("app")
  const data = await getDashboardData()
  const sectionLabel = t(`nav.${activeSection}`)
  const calendarLink = activeSection === "bookings" ? await resolveCalendarBookingLink() : undefined

  if (role === "admin" && activeSection === "people") {
    return (
      <section className="mt-8 space-y-6">
        <StudentManager locale={locale} selectedStudentId={selectedStudentId} />
        <AccountManager locale={locale} />
        {data.kind === "ready" && (
          <AdminNotificationSender
            locale={locale}
            students={data.students.map((student) => ({ id: student.id, name: student.name }))}
          />
        )}
      </section>
    )
  }
  if (role === "admin" && activeSection === "leads") {
    return <LeadsManager locale={locale} />
  }
  if (role === "admin" && activeSection === "rankings") {
    return selectedSchoolId !== undefined ? (
      <SchoolEditorWorkspace locale={locale} schoolId={selectedSchoolId} />
    ) : (
      <SchoolRankings locale={locale} />
    )
  }
  if (role === "admin" && activeSection === "collections") {
    return <CollectionsManager locale={locale} selectedCollectionId={selectedCollectionId} />
  }
  if (role === "admin" && activeSection === "applications") {
    return <ApplicationsWorkspace />
  }
  if (role === "admin" && activeSection === "settings") {
    return <AppSettingsManager locale={locale} />
  }
  if (role === "admin" && activeSection === "home") {
    return (
      <Suspense fallback={<AdminAnalyticsLoading />}>
        <AdminAnalytics locale={locale} />
      </Suspense>
    )
  }
  if (activeSection === "home") {
    return <DashboardHome data={data} locale={locale} role={role} />
  }
  if (activeSection === "schools") {
    return (
      <SchoolsWorkspace
        data={data}
        filters={schoolFilters}
        locale={locale}
        role={role}
        selectedSchoolId={selectedSchoolId}
        selectedStudentId={selectedStudentId}
      />
    )
  }
  if (activeSection === "roadmap") {
    return (
      <RoadmapWorkspace
        data={data}
        locale={locale}
        role={role}
        selectedStudentId={selectedStudentId}
      />
    )
  }
  if (activeSection === "calendar") {
    return (
      <CalendarWorkspace
        data={data}
        locale={locale}
        role={role}
        selectedStudentId={selectedStudentId}
      />
    )
  }
  if (activeSection === "essays") {
    return (
      <EssaysWorkspace
        data={data}
        locale={locale}
        role={role}
        selectedStudentId={selectedStudentId}
      />
    )
  }
  if (activeSection === "interview") {
    return (
      <InterviewWorkspace
        data={data}
        locale={locale}
        role={role}
        selectedStudentId={selectedStudentId}
      />
    )
  }
  if (activeSection === "applications") {
    return (
      <ApplicationBoardWorkspace
        data={data}
        locale={locale}
        role={role}
        selectedStudentId={selectedStudentId}
      />
    )
  }
  if (activeSection === "report") {
    return <ProgressReportWorkspace data={data} role={role} selectedStudentId={selectedStudentId} />
  }
  if (activeSection === "bookings") {
    return (
      <BookingsWorkspace
        calendarLink={calendarLink}
        data={data}
        locale={locale}
        role={role}
        selectedStudentId={selectedStudentId}
      />
    )
  }
  if (activeSection === "resources") {
    return (
      <ResourcesWorkspace
        data={data}
        locale={locale}
        role={role}
        selectedStudentId={selectedStudentId}
      />
    )
  }
  return <WorkspaceEmptyState data={data} role={role} sectionLabel={sectionLabel} />
}

function WorkspaceSkeleton() {
  return (
    <div aria-hidden="true" className="mt-8 animate-pulse space-y-4">
      <div className="h-10 w-56 rounded-2xl bg-slate-100" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-2xl bg-slate-100" />
        <div className="h-28 rounded-2xl bg-slate-100" />
        <div className="h-28 rounded-2xl bg-slate-100" />
      </div>
      <div className="h-72 rounded-2xl bg-slate-100" />
    </div>
  )
}
