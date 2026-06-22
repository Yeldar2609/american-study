import { ConsultationCta } from "@/components/landing/consultation-cta"
import { ConsultationTopics } from "@/components/landing/consultation-topics"
import { Hero } from "@/components/landing/hero"
import { ValueProps } from "@/components/landing/value-props"
import { SiteHeader } from "@/components/site-header"
import { resolveCalendarBookingLink } from "@/lib/settings/calendar-link"

export default async function LandingPage() {
  const bookingLink = await resolveCalendarBookingLink()

  return (
    <>
      <SiteHeader />
      <Hero bookingLink={bookingLink} />
      <ConsultationTopics />
      <ValueProps />
      <ConsultationCta bookingLink={bookingLink} />
    </>
  )
}
