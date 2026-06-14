type AuthResult = Promise<{ readonly error: unknown | null }>

export type AuthAdminPort = {
  readonly deleteUser: (userId: string) => AuthResult
  readonly updateUserById: (
    userId: string,
    attributes: {
      readonly email: string
      readonly email_confirm: true
      readonly user_metadata: {
        readonly full_name: string
        readonly language: string
      }
    },
  ) => AuthResult
}

export async function deleteAuthUsers(
  admin: AuthAdminPort,
  userIds: readonly string[],
): Promise<boolean> {
  const results = []
  for (const userId of userIds) {
    results.push(await admin.deleteUser(userId))
  }
  return results.every((result) => result.error === null)
}

export async function restoreAuthUser(
  admin: AuthAdminPort,
  userId: string,
  user: { readonly email: string; readonly fullName: string; readonly language: string },
): Promise<boolean> {
  const { error } = await admin.updateUserById(userId, {
    email: user.email,
    email_confirm: true,
    user_metadata: { full_name: user.fullName, language: user.language },
  })
  return error === null
}
