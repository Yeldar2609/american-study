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

const studentFormSchema = z
  .object({
    address: optionalText,
    aidNeedLevel: z.enum(["", "low", "medium", "high"]).transform((value) => value || null),
    currentGrade: optionalText,
    currentSchool: optionalText,
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
    parentEmail: z.union([z.literal(""), z.email("email")]).transform((value) => value || null),
    parentFullName: optionalText,
    parentLanguage: z.enum(["", "en", "ru"]).transform((value) => value || null),
    parentPassword: optionalText,
    parentPhone: optionalText,
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
    studentEmail: z.email("email"),
    studentFullName: z.string().trim().min(1, "required").max(200, "tooLong"),
    studentLanguage: z.enum(["en", "ru"]),
    studentPassword: z.string().min(12, "password"),
    toefl: optionalScore(0, 120),
  })
  .superRefine((value, context) => {
    if (value.parentEmail !== null) {
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
    det: formValue(formData, "det"),
    diagnosticSummary: formValue(formData, "diagnosticSummary"),
    dob: formValue(formData, "dob"),
    driveFolderUrl: formValue(formData, "driveFolderUrl"),
    englishLevel: formValue(formData, "englishLevel"),
    interests: formValue(formData, "interests"),
    packageState: formValue(formData, "packageState"),
    parentEmail: formValue(formData, "parentEmail"),
    parentFullName: formValue(formData, "parentFullName"),
    parentLanguage: formValue(formData, "parentLanguage"),
    parentPassword: formValue(formData, "parentPassword"),
    parentPhone: formValue(formData, "parentPhone"),
    passportIdDriveUrl: formValue(formData, "passportIdDriveUrl"),
    phone: formValue(formData, "phone"),
    prefSetting: formValue(formData, "prefSetting"),
    prefSize: formValue(formData, "prefSize"),
    prefStateOrRegion: formValue(formData, "prefStateOrRegion"),
    ssat: formValue(formData, "ssat"),
    stage: formValue(formData, "stage"),
    studentEmail: formValue(formData, "studentEmail"),
    studentFullName: formValue(formData, "studentFullName"),
    studentLanguage: formValue(formData, "studentLanguage"),
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
  return { kind: "success", value: { ...profile, testScores } }
}
