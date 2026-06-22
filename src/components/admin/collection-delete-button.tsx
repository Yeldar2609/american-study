"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { deleteCollectionAction } from "@/lib/admin/collection-actions"

export function CollectionDeleteButton({
  collectionId,
  locale,
}: {
  readonly collectionId: string
  readonly locale: string
}) {
  const t = useTranslations("collections")

  return (
    <form
      action={deleteCollectionAction}
      onSubmit={(event) => {
        if (!window.confirm(t("deleteConfirm"))) {
          event.preventDefault()
        }
      }}
    >
      <input name="collectionId" type="hidden" value={collectionId} />
      <input name="locale" type="hidden" value={locale} />
      <Button size="default" type="submit" variant="danger">
        {t("delete")}
      </Button>
    </form>
  )
}
