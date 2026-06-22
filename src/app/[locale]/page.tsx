import { redirect } from "next/navigation"
import { Cases } from "@/components/landing/cases"
import { ConsultationForm } from "@/components/landing/consultation-form"
import { ConsultationTopics } from "@/components/landing/consultation-topics"
import { Hero } from "@/components/landing/hero"
import { Testimonials } from "@/components/landing/testimonials"
import { ValueProps } from "@/components/landing/value-props"
import { SiteHeader } from "@/components/site-header"

// The public landing is Russian-only (it mirrors american-study.com). Any other
// locale (e.g. an en/kk browser routed here by the middleware) is normalized to
// Russian; the multilingual surfaces (login + the authenticated app) are unaffected.
export default async function LandingPage({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>
}) {
  const { locale } = await params
  if (locale !== "ru") {
    redirect("/ru")
  }

  return (
    <>
      <SiteHeader />
      <Hero />
      <ConsultationTopics />
      <ValueProps />
      <ConsultationForm />
      <Testimonials />
      <Cases />
      <ConsultationForm id="consultation-footer" />
    </>
  )
}
