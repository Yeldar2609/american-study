import { Card } from "@/components/ui/card"

export function AdminAnalyticsLoading() {
  return (
    <section aria-busy="true" aria-live="polite" className="mt-8">
      <div className="h-4 w-32 animate-pulse rounded bg-blue-100 motion-reduce:animate-none" />
      <div className="mt-3 h-10 w-72 max-w-full animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
      <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Card
            className="h-28 animate-pulse bg-slate-100 motion-reduce:animate-none"
            key={index}
          />
        ))}
      </div>
    </section>
  )
}
