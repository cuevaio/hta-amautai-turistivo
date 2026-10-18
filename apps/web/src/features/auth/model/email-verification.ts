export function createEmailVerification(
  verify: (code: string) => Promise<unknown>
) {
  let accepted = false
  let pending = false
  return {
    isAccepted: () => accepted,
    async continue(code: string, readSession: () => Promise<boolean>) {
      if (pending) return "pending"
      pending = true
      try {
        if (!accepted) {
          if (!/^\d{6}$/.test(code.trim()))
            throw new Error("Escribe el código de 6 dígitos.")
          await verify(code.trim())
          accepted = true
        }
        // A failed session read must never consume the one-time code again.
        for (let attempt = 0; attempt < 2; attempt++) {
          if (await readSession()) return "complete"
        }
        return "session-unavailable"
      } finally {
        pending = false
      }
    },
  }
}
