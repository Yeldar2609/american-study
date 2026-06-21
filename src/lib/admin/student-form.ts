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
const formUsername = z
  .string()
  .trim()
  .min(3, "username")
  .max(64, "username")
  .regex(/^[A-Za-z0-9._-]+$/, "username")

const studentFormSchema = z
  .object({
    address: optionalText,
    aidNeedLevel: z.enum(["", "low", "medium", "high"]).transform((value) => value || null),
    currentGrade: optionalText,
    currentSchool: optionalText,
    currentSchoolId: optionalUuid,
    isIndependentStudent: independentFlag,
    det: optionalScore(10, 160),
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
    packageState: z.enum(["trial", "paid"]),
    parentFullName: optionalText,
    parentLanguage: z.enum(["", "en", "ru", "kk"]).transform((value) => value || null),
    parentPassword: optionalText,
    parentPhone: optionalText,
    parentUsername: z.union([z.literal(""), formUsername]).transform((value) => value || null),
    passportIdDriveUrl: optionalUrl,
    phone: optionalText,
    prefSetting: z.enum(["", "urban", "suburban", "rural"]).transform((value) => value || null),
    prefSize: z.enum(["", "small", "medium", "large"]).transform((value) => value || null),
    prefStateOrRegion: optionalText,
    ssat: optionalScore(0, 2400),
    stage: z.enum([
      "diagnostic",
      "trial",
      "list_building",
      "finalized",
      "application",
      "submitted",
    ]),
    studentUsername: formUsername,
    studentFullName: z.string().trim().min(1, "required").max(200, "tooLong"),
    // Students are English-only (no language switcher). Always provisioned as "en".
    studentLanguage: z.literal("en").default("en"),
    studentPassword: z.string().min(12, "password"),
    toefl: optionalScore(0, 120),
  })
  .superRefine((value, context) => {
    if (value.parentUsername !== null) {
      if (value.parentFullName === null) {
        context.addIssue({ code: "custom", message: "required", path: ["parentFullName"] })
      }
      if (value.parentLanguage === null) {
        context.addIssue({ code: "custom", message: "required", path: ["parentLanguage"] })
      }
      if (value.parentPassword === null || value.parentPassword.length < 12) {
        context.addIssue({ code: "custom", message: "password", path: ["parentPassword"] })
      }
    }
  })

export type StudentFormValue = Omit<z.infer<typeof studentFormSchema>, "det" | "ssat" | "toefl"> & {
  readonly testScores: Readonly<Partial<Record<"det" | "ssat" | "toefl", number>>>
}

export type StudentFormResult =
  | { readonly kind: "success"; readonly value: StudentFormValue }
  | { readonly kind: "invalid"; readonly fieldErrors: Readonly<Record<string, readonly string[]>> }

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

export function parseStudentForm(formData: FormData): StudentFormResult {
  const parsed = studentFormSchema.safeParse({
    address: formValue(formData, "address"),
    aidNeedLevel: formValue(formData, "aidNeedLevel"),
    currentGrade: formValue(formData, "currentGrade"),
    currentSchool: formValue(formData, "currentSchool"),
    currentSchoolId: formValue(formData, "currentSchoolId"),
    det: formValue(formData, "det"),
    diagnosticSummary: formValue(formData, "diagnosticSummary"),
    dob: formValue(formData, "dob"),
    driveFolderUrl: formValue(formData, "driveFolderUrl"),
    englishLevel: formValue(formData, "englishLevel"),
    interests: formValue(formData, "interests"),
    isIndependentStudent: formValue(formData, "isIndependentStudent"),
    packageState: formValue(formData, "packageState"),
    parentFullName: formValue(formData, "parentFullName"),
    parentLanguage: formValue(formData, "parentLanguage"),
    parentPassword: formValue(formData, "parentPassword"),
    parentPhone: formValue(formData, "parentPhone"),
    parentUsername: formValue(formData, "parentUsername"),
    passportIdDriveUrl: formValue(formData, "passportIdDriveUrl"),
    phone: formValue(formData, "phone"),
    prefSetting: formValue(formData, "prefSetting"),
    prefSize: formValue(formData, "prefSize"),
    prefStateOrRegion: formValue(formData, "prefStateOrRegion"),
    ssat: formValue(formData, "ssat"),
    stage: formValue(formData, "stage"),
    studentUsername: formValue(formData, "studentUsername"),
    studentFullName: formValue(formData, "studentFullName"),
    studentLanguage: "en",
    studentPassword: formValue(formData, "studentPassword"),
    toefl: formValue(formData, "toefl"),
  })

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
