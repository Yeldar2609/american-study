import { NextResponse } from "next/server"
import { hasSupabaseConfig } from "@/lib/env"

// Lightweight liveness/readiness probe for Firebase App Hosting and uptime
// checks. Reports whether Supabase is configured without making a DB round-trip,
// so it stays fast and never fails on transient DB latency.
export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json({
    status: "ok",
    supabaseConfigured: hasSupabaseConfig(),
    timestamp: new Date().toISOString(),
  })
}
