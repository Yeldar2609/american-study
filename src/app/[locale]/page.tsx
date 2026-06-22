import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Cases } from "@/components/landing/cases"
import { ConsultationForm } from "@/components/landing/consultation-form"
import { ConsultationTopics } from "@/components/landing/consultation-topics"
import { Hero } from "@/components/landing/hero"
import { Testimonials } from "@/components/landing/testimonials"
import { ValueProps } from "@/components/landing/value-props"
import { SiteHeader } from "@/components/site-header"
import { readPublicEnv } from "@/lib/env"

// The landing is Russian-only, so its social metadata is always Russian. Build
// absolute URLs from NEXT_PUBLIC_APP_URL; fall back to the bare path when it is
// unset so crawlers still get a usable (relative) canonical/og url.
function landingUrl(path: string): string {
  const base = readPublicEnv().NEXT_PUBLIC_APP_URL
  return base ? new URL(path, base).toString() : path
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "ru", namespace: "meta" })
  const title = t("landingTitle")
  const description = t("landingDescription")
  const url = landingUrl("/ru")
  const imageUrl = landingUrl("/og-image.png")

  return {
    alternates: { canonical: url },
    description,
    openGraph: {
      description,
      images: [{ height: 630, url: imageUrl, width: 1200 }],
      locale: "ru_RU",
      title,
      type: "website",
      url,
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [imageUrl],
      title,
    },
  }
}

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
