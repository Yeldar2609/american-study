import { NextResponse } from "next/server"
import { readPublicEnv } from "@/lib/env"
import pkg from "../../../../package.json"

// Build/version disclosure for ops + post-deploy verification. `commit` is
// populated when the deploy pipeline sets NEXT_PUBLIC_COMMIT_SHA.
export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json({
    name: pkg.name,
    version: pkg.version,
    commit: readPublicEnv().NEXT_PUBLIC_COMMIT_SHA ?? null,
  })
}
