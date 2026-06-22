import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const collectionRowSchema = z.object({
  description: z.string().nullable(),
  id: z.string(),
  is_public: z.boolean(),
  name: z.string(),
  sort_order: z.number().int(),
})

const memberRowSchema = z.object({
  school_id: z.string(),
})

const memberSchoolSchema = z.object({
  city: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  state: z.string().nullable(),
})

export type Collection = {
  readonly description: string | null
  readonly id: string
  readonly isPublic: boolean
  readonly memberCount: number
  readonly name: string
}

export type CollectionMember = {
  readonly city: string | null
  readonly id: string
  readonly name: string
  readonly state: string | null
}

export type CollectionDetail = {
  readonly description: string | null
  readonly id: string
  readonly isPublic: boolean
  readonly members: readonly CollectionMember[]
  readonly name: string
}

export type CollectionsResult =
  | { readonly kind: "ready"; readonly collections: readonly Collection[] }
  | { readonly kind: "configuration" }
  | { readonly kind: "error" }

export type CollectionDetailResult =
  | { readonly kind: "ready"; readonly collection: CollectionDetail }
  | { readonly kind: "configuration" }
  | { readonly kind: "notFound" }
  | { readonly kind: "error" }

const uuidSchema = z.string().uuid()

export async function listCollections(): Promise<CollectionsResult> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const { data: collectionData, error: collectionError } = await supabase
    .from("school_collections")
    .select("id,name,description,is_public,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (collectionError !== null) {
    return { kind: "error" }
  }

  const parsedCollections = z.array(collectionRowSchema).safeParse(collectionData)
  if (!parsedCollections.success) {
    return { kind: "error" }
  }

  const { data: memberData, error: memberError } = await supabase
    .from("school_collection_members")
    .select("collection_id")
  if (memberError !== null) {
    return { kind: "error" }
  }

  const parsedMembers = z.array(z.object({ collection_id: z.string() })).safeParse(memberData)
  if (!parsedMembers.success) {
    return { kind: "error" }
  }

  const countByCollection = new Map<string, number>()
  for (const member of parsedMembers.data) {
    countByCollection.set(
      member.collection_id,
      (countByCollection.get(member.collection_id) ?? 0) + 1,
    )
  }

  return {
    collections: parsedCollections.data.map((collection) => ({
      description: collection.description,
      id: collection.id,
      isPublic: collection.is_public,
      memberCount: countByCollection.get(collection.id) ?? 0,
      name: collection.name,
    })),
    kind: "ready",
  }
}

export async function getCollectionDetail(collectionId: string): Promise<CollectionDetailResult> {
  if (!uuidSchema.safeParse(collectionId).success) {
    return { kind: "notFound" }
  }

  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const { data: collectionData, error: collectionError } = await supabase
    .from("school_collections")
    .select("id,name,description,is_public,sort_order")
    .eq("id", collectionId)
    .maybeSingle()
  if (collectionError !== null) {
    return { kind: "error" }
  }

  const parsedCollection = collectionRowSchema.safeParse(collectionData)
  if (!parsedCollection.success) {
    return collectionData === null ? { kind: "notFound" } : { kind: "error" }
  }

  const { data: memberData, error: memberError } = await supabase
    .from("school_collection_members")
    .select("school_id")
    .eq("collection_id", collectionId)
  if (memberError !== null) {
    return { kind: "error" }
  }

  const parsedMembers = z.array(memberRowSchema).safeParse(memberData)
  if (!parsedMembers.success) {
    return { kind: "error" }
  }

  const schoolIds = parsedMembers.data.map((member) => member.school_id)
  let members: readonly CollectionMember[] = []
  if (schoolIds.length > 0) {
    const { data: schoolData, error: schoolError } = await supabase
      .from("schools")
      .select("id,name,state,city")
      .in("id", schoolIds)
    if (schoolError !== null) {
      return { kind: "error" }
    }

    const parsedSchools = z.array(memberSchoolSchema).safeParse(schoolData)
    if (!parsedSchools.success) {
      return { kind: "error" }
    }

    members = parsedSchools.data
      .map((school) => ({
        city: school.city,
        id: school.id,
        name: school.name,
        state: school.state,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  return {
    collection: {
      description: parsedCollection.data.description,
      id: parsedCollection.data.id,
      isPublic: parsedCollection.data.is_public,
      members,
      name: parsedCollection.data.name,
    },
    kind: "ready",
  }
}
