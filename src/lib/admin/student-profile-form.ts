import { z } from "zod"

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null)
const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || URL.canParse(value), "url")
  .transform((value) => value || null)
const optionalScore = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+(\.\d+)?$/.test(value), "number")
    .transform((value) => (value === "" ? null : Number(value)))
    .refine((value) => value === null || (value >= minimum && value <= maximum), "range")
const optionalUuid = z.union([z.literal(""), z.uuid("uuid")]).transform((value) => value || null)
const independentFlag = z.string().transform((value) => value === "true")

const profileSchema = z.object({
  address: optionalText,
  aidNeedLevel: z.enum(["", "low", "medium", "high"]).transform((value) => value || null),
  currentGrade: optionalText,
  currentSchool: optionalText,
  currentSchoolId: optionalUuid,
  det: optionalScore(10, 160),
  isIndependentStudent: independentFlag,
  diagnosticSummary: optionalText,
  dob: optionalText,
  driveFolderUrl: optionalUrl,
  englishLevel: optionalText,
  interests: z.string().transform((value) => {
    const unique = new Map<string, string>()
    for (const item of value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)) {
      if (!unique.has(item.toLowerCase())) {
        unique.set(item.toLowerCase(), item)
      }
    }
    return [...unique.values()]
  }),
  parentEmail: z.union([z.literal(""), z.email("email")]).transform((value) => value || null),
  parentPhone: optionalText,
  passportIdDriveUrl: optionalUrl,
  phone: optionalText,
  prefSetting: z.enum(["", "urban", "suburban", "rural"]).transform((value) => value || null),
  prefSize: z.enum(["", "small", "medium", "large"]).transform((value) => value || null),
  prefStateOrRegion: optionalText,
  ssat: optionalScore(0, 2400),
  stage: z.enum(["diagnostic", "trial", "list_building", "finalized", "application", "submitted"]),
  studentEmail: z.email("email"),
  studentFullName: z.string().trim().min(1, "required").max(200, "tooLong"),
  studentId: z.uuid("uuid"),
  // Students are English-only (no language switcher). Always normalized to "en".
  studentLanguage: z.literal("en").default("en"),
  toefl: optionalScore(0, 120),
})

type ParsedProfile = z.infer<typeof profileSchema>

export type StudentProfileFormValue = Omit<ParsedProfile, "det" | "ssat" | "toefl"> & {
  readonly testScores: Readonly<Partial<Record<"det" | "ssat" | "toefl", number>>>
}

export type StudentProfileFormResult =
  | { readonly kind: "success"; readonly value: StudentProfileFormValue }
  | { readonly kind: "invalid"; readonly fieldErrors: Readonly<Record<string, readonly string[]>> }

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

export function parseStudentProfileForm(formData: FormData): StudentProfileFormResult {
  const values = {
    ...Object.fromEntries(
      [
        "address",
        "aidNeedLevel",
        "currentGrade",
        "currentSchool",
        "currentSchoolId",
        "det",
        "diagnosticSummary",
        "dob",
        "driveFolderUrl",
        "englishLevel",
        "interests",
        "isIndependentStudent",
        "parentEmail",
        "parentPhone",
        "passportIdDriveUrl",
        "phone",
        "prefSetting",
        "prefSize",
        "prefStateOrRegion",
        "ssat",
        "stage",
        "studentEmail",
        "studentFullName",
        "studentId",
        "toefl",
      ].map((key) => [key, formValue(formData, key)]),
    ),
    // Students are English-only; ignore any submitted student language.
    studentLanguage: "en",
  }
  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, kind: "invalid" }
  }

  const { det, ssat, toefl, ...profile } = parsed.data
  const testScores = Object.fromEntries(
    Object.entries({ det, ssat, toefl }).filter(
      (entry): entry is [string, number] => entry[1] !== null,
    ),
  )
  const currentSchool = profile.isIndependentStudent
    ? { currentSchool: null, currentSchoolId: null }
    : { currentSchool: profile.currentSchool, currentSchoolId: profile.currentSchoolId }
  return { kind: "success", value: { ...profile, ...currentSchool, testScores } }
}
