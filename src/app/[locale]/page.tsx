import { Cases } from "@/components/landing/cases"
import { ConsultationForm } from "@/components/landing/consultation-form"
import { ConsultationTopics } from "@/components/landing/consultation-topics"
import { Hero } from "@/components/landing/hero"
import { Testimonials } from "@/components/landing/testimonials"
import { ValueProps } from "@/components/landing/value-props"
import { SiteHeader } from "@/components/site-header"

export default function LandingPage() {
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
