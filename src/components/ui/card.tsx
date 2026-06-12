import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/80 bg-white/90 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)] backdrop-blur",
        className,
      )}
      {...props}
    />
  )
}
