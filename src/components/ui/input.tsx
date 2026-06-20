import type { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-200",
        className,
      )}
      {...props}
    />
  )
}
