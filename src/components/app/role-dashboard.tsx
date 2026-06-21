import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { AccountManager } from "@/components/admin/account-manager"
import { AdminNotificationSender } from "@/components/admin/admin-notification-sender"
import { AdminAnalytics } from "@/components/admin/analytics/admin-analytics"
import { AdminAnalyticsLoading } from "@/components/admin/analytics/admin-analytics-loading"
import { AppSettingsManager } from "@/components/admin/app-settings-manager"
import { ApplicationsWorkspace } from "@/components/admin/applications-workspace"
import { StudentManager } from "@/components/admin/student-manager"
import { AppSidebar } from "@/components/app/app-sidebar"
import { DashboardHome } from "@/components/app/dashboard-home"
import { WorkspaceEmptyState } from "@/components/app/workspace-empty-state"
import { BookingsWorkspace } from "@/components/bookings/bookings-workspace"
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace"
import { EssaysWorkspace } from "@/components/essays/essays-workspace"
import { ResourcesWorkspace } from "@/components/resources/resources-workspace"
import { RoadmapWorkspace } from "@/components/roadmap/roadmap-workspace"
import { SchoolsWorkspace } from "@/components/schools/schools-workspace"
import type { UserRole } from "@/lib/auth/access"
import { getDashboardData } from "@/lib/dashboard/dashboard-data"
import { resolveCalendarBookingLink } from "@/lib/settings/calendar-link"
import type { SchoolCatalogFilters } from "@/lib/workspace/school-catalog"

type RoleDashboardProps = {
  readonly locale: string
  readonly role: UserRole
  readonly section?: string | undefined
  readonly selectedStudentId?: string | undefined
  readonly selectedSchoolId?: string | undefined
  readonly schoolFilters?: SchoolCatalogFilters | undefined
}

export async function RoleDashboard({
  locale,
  role,
  section = "home",
  selectedStudentId,
  selectedSchoolId,
  schoolFilters = {},
}: RoleDashboardProps) {
  const t = await getTranslations("app")
  const data = await getDashboardData()
  const validSections = [
    "home",
    "roadmap",
    "calendar",
    "schools",
    "essays",
    "bookings",
    "people",
    "applications",
    "resources",
    "settings",
  ] as const
  const activeSection = validSections.some((candidate) => candidate === section) ? section : "home"
  const sectionLabel = t(`nav.${activeSection}`)
  const calendarLink = activeSection === "bookings" ? await resolveCalendarBookingLink() : undefined

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar activeSection={activeSection} locale={locale} role={role} />
      <main className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl">
          {role === "admin" && activeSection === "people" ? (
            <section className="mt-8 space-y-6">
              <StudentManager locale={locale} selectedStudentId={selectedStudentId} />
              <AccountManager locale={locale} />
              {data.kind === "ready" && (
                <AdminNotificationSender
                  locale={locale}
                  students={data.students.map((student) => ({
                    id: student.id,
                    name: student.name,
                  }))}
                />
              )}
            </section>
          ) : role === "admin" && activeSection === "applications" ? (
            <ApplicationsWorkspace />
          ) : role === "admin" && activeSection === "settings" ? (
            <AppSettingsManager locale={locale} />
          ) : role === "admin" && activeSection === "home" ? (
            <Suspense fallback={<AdminAnalyticsLoading />}>
              <AdminAnalytics locale={locale} />
            </Suspense>
          ) : activeSection === "home" ? (
            <DashboardHome data={data} locale={locale} role={role} />
          ) : activeSection === "schools" ? (
            <SchoolsWorkspace
              data={data}
              filters={schoolFilters}
              locale={locale}
              role={role}
              selectedSchoolId={selectedSchoolId}
              selectedStudentId={selectedStudentId}
            />
          ) : activeSection === "roadmap" ? (
            <RoadmapWorkspace
              data={data}
              locale={locale}
              role={role}
              selectedStudentId={selectedStudentId}
            />
          ) : activeSection === "calendar" ? (
            <CalendarWorkspace
              data={data}
              locale={locale}
              role={role}
              selectedStudentId={selectedStudentId}
            />
          ) : activeSection === "essays" ? (
            <EssaysWorkspace
              data={data}
              locale={locale}
              role={role}
              selectedStudentId={selectedStudentId}
            />
          ) : activeSection === "bookings" ? (
            <BookingsWorkspace
              calendarLink={calendarLink}
              data={data}
              locale={locale}
              role={role}
              selectedStudentId={selectedStudentId}
            />
          ) : activeSection === "resources" ? (
            <ResourcesWorkspace
              data={data}
              locale={locale}
              role={role}
              selectedStudentId={selectedStudentId}
            />
          ) : (
            <WorkspaceEmptyState data={data} role={role} sectionLabel={sectionLabel} />
          )}
        </div>
      </main>
    </div>
  )
}
