import { describe, expect, it } from "vitest"
import { parseStudentForm } from "@/lib/admin/student-form"

function validFormData(): FormData {
  const formData = new FormData()
  formData.set("studentEmail", "student@example.com")
  formData.set("studentFullName", "Aruzhan Sarsen")
  formData.set("studentLanguage", "en")
  formData.set("studentPassword", "Temporary123!")
  formData.set("packageState", "trial")
  formData.set("stage", "diagnostic")
  formData.set("aidNeedLevel", "medium")
  formData.set("prefSize", "small")
  formData.set("prefSetting", "suburban")
  formData.set("passportIdDriveUrl", "https://drive.example.com/passport")
  formData.set("driveFolderUrl", "https://drive.example.com/folder")
  formData.set("toefl", "104")
  formData.set("ssat", "82")
  formData.set("det", "135")
  formData.set("interests", "Robotics, Debate, robotics")
  return formData
}

describe("parseStudentForm", () => {
  it("returns normalized profile data when the form is valid", () => {
    // Given
    const formData = validFormData()

    // When
    const result = parseStudentForm(formData)

    // Then
    expect(result.kind).toBe("success")
    if (result.kind === "success") {
      expect(result.value.interests).toEqual(["Robotics", "Debate"])
      expect(result.value.passportIdDriveUrl).toBe("https://drive.example.com/passport")
      expect(result.value.testScores).toEqual({ det: 135, ssat: 82, toefl: 104 })
    }
  })

  it("returns field errors when an email or URL is malformed", () => {
    // Given
    const formData = validFormData()
    formData.set("studentEmail", "not-an-email")
    formData.set("driveFolderUrl", "drive/folder")

    // When
    const result = parseStudentForm(formData)

    // Then
    expect(result).toEqual({
      kind: "invalid",
      fieldErrors: expect.objectContaining({
        driveFolderUrl: ["url"],
        studentEmail: ["email"],
      }),
    })
  })

  it("returns field errors when test scores exceed accepted ranges", () => {
    // Given
    const formData = validFormData()
    formData.set("toefl", "121")
    formData.set("ssat", "2401")
    formData.set("det", "9")

    // When
    const result = parseStudentForm(formData)

    // Then
    expect(result).toEqual({
      kind: "invalid",
      fieldErrors: expect.objectContaining({
        det: ["range"],
        ssat: ["range"],
        toefl: ["range"],
      }),
    })
  })
})
