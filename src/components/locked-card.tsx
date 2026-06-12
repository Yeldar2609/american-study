import { LockKeyhole } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { UserRole } from "@/lib/auth/access"

type LockedCardProps = {
  readonly title: string
  readonly description: string
  readonly preview: boolean
  readonly role: UserRole
}

export async function LockedCard({ title, description, preview, role }: LockedCardProps) {
  const t = await getTranslations("locked")

  return (
    <Card className="relative overflow-hidden p-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-white/30 to-blue-50/80 backdrop-blur-[2px]"
      />
      <div className="relative">
        <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-blue-100 text-blue-700">
          <LockKeyhole aria-hidden="true" className="size-5" />
        </span>
        <h3 className="text-xl font-black text-slate-950">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
        <Link
          className={`${buttonVariants({ variant: "primary" })} mt-5`}
          href={preview ? "/login" : `/app/${role}?unlock=1`}
        >
          {t("cta")}
        </Link>
      </div>
    </Card>
  )
}
