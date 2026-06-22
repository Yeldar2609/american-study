"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

const localeSchema = z.enum(["en", "ru", "kk"])

const createSchema = z.object({
  description: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value)),
  locale: localeSchema,
  name: z.string().trim().min(1).max(120),
})

const deleteSchema = z.object({
  collectionId: z.string().uuid(),
  locale: localeSchema,
})

const memberSchema = z.object({
  collectionId: z.string().uuid(),
  locale: localeSchema,
  schoolId: z.string().uuid(),
})

const publicSchema = z.object({
  collectionId: z.string().uuid(),
  isPublic: z.enum(["true", "false"]).transform((value) => value === "true"),
  locale: localeSchema,
})

export async function createCollectionAction(formData: FormData): Promise<void> {
  const parsed = createSchema.safeParse({
    description: formData.get("description") ?? "",
    locale: formData.get("locale"),
    name: formData.get("name"),
  })
  if (!parsed.success) {
    return
  }

  await requireRole(parsed.data.locale, "admin")

  const supabase = await createClient()
  if (supabase === null) {
    return
  }

  await supabase
    .from("school_collections")
    .insert({ description: parsed.data.description, name: parsed.data.name })

  revalidatePath(`/${parsed.data.locale}/app/admin`)
}

export async function deleteCollectionAction(formData: FormData): Promise<void> {
  const parsed = deleteSchema.safeParse({
    collectionId: formData.get("collectionId"),
    locale: formData.get("locale"),
  })
  if (!parsed.success) {
    return
  }

  await requireRole(parsed.data.locale, "admin")

  const supabase = await createClient()
  if (supabase === null) {
    return
  }

  await supabase.from("school_collections").delete().eq("id", parsed.data.collectionId)

  revalidatePath(`/${parsed.data.locale}/app/admin`)
}

export async function setCollectionPublicAction(formData: FormData): Promise<void> {
  const parsed = publicSchema.safeParse({
    collectionId: formData.get("collectionId"),
    isPublic: formData.get("isPublic"),
    locale: formData.get("locale"),
  })
  if (!parsed.success) {
    return
  }

  await requireRole(parsed.data.locale, "admin")

  const supabase = await createClient()
  if (supabase === null) {
    return
  }

  await supabase
    .from("school_collections")
    .update({ is_public: parsed.data.isPublic })
    .eq("id", parsed.data.collectionId)

  revalidatePath(`/${parsed.data.locale}/app/admin`)
}

export async function addSchoolToCollectionAction(formData: FormData): Promise<void> {
  const parsed = memberSchema.safeParse({
    collectionId: formData.get("collectionId"),
    locale: formData.get("locale"),
    schoolId: formData.get("schoolId"),
  })
  if (!parsed.success) {
    return
  }

  await requireRole(parsed.data.locale, "admin")

  const supabase = await createClient()
  if (supabase === null) {
    return
  }

  await supabase
    .from("school_collection_members")
    .upsert(
      { collection_id: parsed.data.collectionId, school_id: parsed.data.schoolId },
      { ignoreDuplicates: true, onConflict: "collection_id,school_id" },
    )

  revalidatePath(`/${parsed.data.locale}/app/admin`)
}

export async function removeSchoolFromCollectionAction(formData: FormData): Promise<void> {
  const parsed = memberSchema.safeParse({
    collectionId: formData.get("collectionId"),
    locale: formData.get("locale"),
    schoolId: formData.get("schoolId"),
  })
  if (!parsed.success) {
    return
  }

  await requireRole(parsed.data.locale, "admin")

  const supabase = await createClient()
  if (supabase === null) {
    return
  }

  await supabase
    .from("school_collection_members")
    .delete()
    .eq("collection_id", parsed.data.collectionId)
    .eq("school_id", parsed.data.schoolId)

  revalidatePath(`/${parsed.data.locale}/app/admin`)
}
