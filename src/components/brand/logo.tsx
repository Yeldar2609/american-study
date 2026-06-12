import { GraduationCap } from "lucide-react"
import { Link } from "@/i18n/navigation"

type LogoProps = {
  readonly label: string
}

export function Logo({ label }: LogoProps) {
  return (
    <Link
      className="inline-flex items-center gap-3 font-black tracking-tight text-slate-950"
      href="/"
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
        <GraduationCap aria-hidden="true" className="size-6" />
      </span>
      <span className="text-lg">{label}</span>
    </Link>
  )
}
