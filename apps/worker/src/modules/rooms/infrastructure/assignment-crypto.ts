import type { AssignmentCrypto } from "../application/assignment-service.ts"
export function assignmentCrypto(): AssignmentCrypto {
  return {
    token: () =>
      Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
        n.toString(16).padStart(2, "0")
      ).join(""),
    async hash(token) {
      const data = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(token)
      )
      return Array.from(new Uint8Array(data), (n) =>
        n.toString(16).padStart(2, "0")
      ).join("")
    },
  }
}
