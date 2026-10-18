import { api } from "@/shared/api/client"
import type {
  AccountProfile,
  AccountProfileInput,
  FamilyProfile,
  FamilyProfileInput,
} from "@amautai/contracts"

export const profileApi = {
  get: (signal?: AbortSignal) =>
    api<{ profile: AccountProfile | null }>("/api/profile", { signal }),
  save: (input: AccountProfileInput) =>
    api<{ profile: AccountProfile }>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  getFamily: (signal?: AbortSignal) =>
    api<{ profile: FamilyProfile | null }>("/api/profile/family", { signal }),
  saveFamily: (input: FamilyProfileInput) =>
    api<{ profile: FamilyProfile }>("/api/profile/family", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
}
