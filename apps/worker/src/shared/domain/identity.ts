export type SafeUser = {
  id: string
  email: string
  emailVerified: boolean
  firstName: string | null
  lastName: string | null
  profilePictureUrl: string | null
}
export type Identity = {
  user: SafeUser
  organizationId?: string
  sessionId: string
}
export type Tenant = {
  id: string
  kind: "personal" | "organization"
  name: string
}
