"use client"

import { Globe, Lock } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { setCollectionPublicAction } from "@/lib/admin/collection-actions"

export function CollectionPublishToggle({
  collectionId,
  isPublic,
  locale,
}: {
  readonly collectionId: string
  readonly isPublic: boolean
  readonly locale: string
}) {
  const t = useTranslations("collections")

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-black ${
          isPublic ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
        }`}
      >
        {isPublic ? (
          <Globe aria-hidden="true" className="size-4" />
        ) : (
          <Lock aria-hidden="true" className="size-4" />
        )}
        {isPublic ? t("publicOn") : t("publicOff")}
      </span>
      <form action={setCollectionPublicAction}>
        <input name="collectionId" type="hidden" value={collectionId} />
        <input name="isPublic" type="hidden" value={isPublic ? "false" : "true"} />
        <input name="locale" type="hidden" value={locale} />
        <Button size="default" type="submit" variant="outline">
          {isPublic ? t("unpublish") : t("publish")}
        </Button>
      </form>
    </div>
  )
}
