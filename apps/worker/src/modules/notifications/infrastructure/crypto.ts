import type { VerificationCrypto } from "../application/ports.ts"
export function verificationCrypto(secret: string): VerificationCrypto {
  return {
    id: () => crypto.randomUUID(),
    code() {
      const n = new Uint32Array(1)
      do {
        crypto.getRandomValues(n)
      } while (n[0]! >= 4294000000)
      return String(n[0]! % 1000000).padStart(6, "0")
    },
    async hash(id, code) {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      )
      const data = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(id + ":" + code)
      )
      return Array.from(new Uint8Array(data), (v) =>
        v.toString(16).padStart(2, "0")
      ).join("")
    },
  }
}
