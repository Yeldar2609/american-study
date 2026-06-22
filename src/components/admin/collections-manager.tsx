import { ArrowLeft, Globe, Layers } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { CollectionDeleteButton } from "@/components/admin/collection-delete-button"
import { CollectionPublishToggle } from "@/components/admin/collection-publish-toggle"
import { CollectionSchoolPicker } from "@/components/admin/collection-school-picker"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Link } from "@/i18n/navigation"
import {
  createCollectionAction,
  removeSchoolFromCollectionAction,
} from "@/lib/admin/collection-actions"
import { getCollectionDetail, listCollections } from "@/lib/admin/collection-queries"
import { getAdminSchools } from "@/lib/admin/school-rank-queries"

function formatLocation(city: string | null, state: string | null): string {
  const parts = [city, state].filter((part): part is string => part !== null && part !== "")
  return parts.length === 0 ? "—" : parts.join(", ")
}

export async function CollectionsManager({
  locale,
  selectedCollectionId,
}: {
  readonly locale: string
  readonly selectedCollectionId?: string | undefined
}) {
  const t = await getTranslations("collections")

  if (selectedCollectionId !== undefined) {
    return <CollectionDetailView collectionId={selectedCollectionId} locale={locale} t={t} />
  }

  const result = await listCollections()

  return (
    <section className="mt-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-950">{t("title")}</h1>
        <p className="max-w-2xl leading-7 text-slate-600">{t("intro")}</p>
      </div>

      <Card className="rounded-3xl p-6">
        <h2 className="text-xl font-black text-slate-950">{t("createTitle")}</h2>
        <form action={createCollectionAction} className="mt-4 grid gap-3">
          <input name="locale" type="hidden" value={locale} />
          <Input
            aria-label={t("name")}
            maxLength={120}
            name="name"
            placeholder={t("name")}
            required
            type="text"
          />
          <Input
            aria-label={t("description")}
            name="description"
            placeholder={t("description")}
            type="text"
          />
          <div>
            <Button type="submit" variant="primary">
              {t("create")}
            </Button>
          </div>
        </form>
      </Card>

      {result.kind === "ready" && result.collections.length > 0 ? (
        <div className="grid gap-4">
          {result.collections.map((collection) => (
            <Link
              className="block rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/60"
              href={`/app/admin?section=collections&collection=${collection.id}`}
              key={collection.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                      <Layers aria-hidden="true" className="size-5" />
                    </span>
                    <h3 className="font-black text-slate-950">{collection.name}</h3>
                  </div>
                  {collection.description !== null && (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {collection.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">
                    {t("memberCount", { count: collection.memberCount })}
                  </p>
                  {collection.isPublic && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                      <Globe aria-hidden="true" className="size-3.5" />
                      {t("publicOn")}
                    </span>
                  )}
                  <span className="inline-flex min-h-9 items-center rounded-xl bg-blue-50 px-4 text-sm font-black text-blue-700">
                    {t("manage")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
          <p className="mx-auto max-w-xl leading-7 text-slate-600">
            {result.kind === "ready" ? t("empty") : t("loadError")}
          </p>
        </Card>
      )}
    </section>
  )
}

async function CollectionDetailView({
  collectionId,
  locale,
  t,
}: {
  readonly collectionId: string
  readonly locale: string
  readonly t: Awaited<ReturnType<typeof getTranslations<"collections">>>
}) {
  const [detailResult, schoolsResult] = await Promise.all([
    getCollectionDetail(collectionId),
    getAdminSchools(),
  ])

  if (detailResult.kind !== "ready") {
    return (
      <section className="mt-8 space-y-6">
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-800"
          href="/app/admin?section=collections"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("back")}
        </Link>
        <Card className="border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
          <p className="mx-auto max-w-xl leading-7 text-slate-600">
            {detailResult.kind === "notFound" ? t("empty") : t("loadError")}
          </p>
        </Card>
      </section>
    )
  }

  const { collection } = detailResult
  const memberIds = collection.members.map((member) => member.id)

  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            className="inline-flex min-h-9 items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-800"
            href="/app/admin?section=collections"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("back")}
          </Link>
          <h1 className="text-3xl font-black text-slate-950">{collection.name}</h1>
          {collection.description !== null && (
            <p className="max-w-2xl leading-7 text-slate-600">{collection.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CollectionPublishToggle
            collectionId={collection.id}
            isPublic={collection.isPublic}
            locale={locale}
          />
          <CollectionDeleteButton collectionId={collection.id} locale={locale} />
        </div>
      </div>

      <Card className="rounded-3xl p-6">
        <h2 className="text-xl font-black text-slate-950">{t("members")}</h2>
        {collection.members.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm font-bold text-slate-500">
            {t("noMembers")}
          </p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {collection.members.map((member) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                key={member.id}
              >
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{member.name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {formatLocation(member.city, member.state)}
                  </p>
                </div>
                <form action={removeSchoolFromCollectionAction}>
                  <input name="collectionId" type="hidden" value={collection.id} />
                  <input name="locale" type="hidden" value={locale} />
                  <input name="schoolId" type="hidden" value={member.id} />
                  <Button size="default" type="submit" variant="outline">
                    {t("remove")}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="rounded-3xl p-6">
        <h2 className="text-xl font-black text-slate-950">{t("addSchools")}</h2>
        {schoolsResult.kind === "ready" ? (
          <div className="mt-4">
            <CollectionSchoolPicker
              collectionId={collection.id}
              locale={locale}
              memberIds={memberIds}
              schools={schoolsResult.schools}
            />
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-6 text-center text-sm font-bold text-slate-500">
            {t("loadError")}
          </p>
        )}
      </Card>
    </section>
  )
}
