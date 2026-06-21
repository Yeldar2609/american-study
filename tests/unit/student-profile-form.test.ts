import { describe, expect, it } from "vitest"
import { parseStudentProfileForm } from "@/lib/admin/student-profile-form"

function validProfileFormData(): FormData {
  const formData = new FormData()
  formData.set("studentId", "4c7c4794-4a75-45cb-81d5-d14948e663b7")
  formData.set("studentFullName", "Aruzhan Sarsen")
  formData.set("studentLanguage", "ru")
  formData.set("stage", "list_building")
  formData.set("aidNeedLevel", "high")
  formData.set("prefSize", "medium")
  formData.set("prefSetting", "urban")
  formData.set("passportIdDriveUrl", "https://drive.example.com/passport")
  formData.set("driveFolderUrl", "https://drive.example.com/folder")
  formData.set("toefl", "105")
  formData.set("ssat", "88")
  formData.set("det", "140")
  formData.set("interests", "Robotics, Debate, robotics")
  return formData
}

describe("parseStudentProfileForm", () => {
  it("normalizes a complete editable profile", () => {
    const result = parseStudentProfileForm(validProfileFormData())

    expect(result).toEqual(expect.objectContaining({ kind: "success" }))
    if (result.kind === "success") {
      expect(result.value.interests).toEqual(["Robotics", "Debate"])
      // Students are English-only: a submitted "ru" is ignored and normalized to "en".
      expect(result.value.studentLanguage).toBe("en")
      expect(result.value.stage).toBe("list_building")
      expect(result.value.testScores).toEqual({ det: 140, ssat: 88, toefl: 105 })
    }
  })

  it("rejects an invalid student id, URL, and score", () => {
    const formData = validProfileFormData()
    formData.set("studentId", "not-a-uuid")
    formData.set("driveFolderUrl", "drive/folder")
    formData.set("toefl", "121")

    const result = parseStudentProfileForm(formData)

    expect(result).toEqual({
      kind: "invalid",
      fieldErrors: expect.objectContaining({
        driveFolderUrl: ["url"],
        studentId: ["uuid"],
        toefl: ["range"],
      }),
    })
  })
})
