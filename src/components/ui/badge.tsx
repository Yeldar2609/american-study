import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-blue-700",
        className,
      )}
      {...props}
    />
  )
}
