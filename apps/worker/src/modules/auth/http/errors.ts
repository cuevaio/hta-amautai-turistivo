export function authFailure(error: unknown) {
  const detail = error as {
    status?: number
    code?: string
    pendingToken?: string
  }
  const rawCode = detail?.code || ""
  const code = /^[a-z][a-z0-9_]{0,80}$/.test(rawCode) ? rawCode : "unknown"
  const unavailable =
    (!detail?.status && code === "unknown") ||
    (!!detail?.status &&
      (detail.status >= 500 || detail.status === 401 || detail.status === 403))
  return {
    code,
    status: detail?.status,
    unavailable,
    limited: detail?.status === 429,
  }
}
export function logAuthFailure(operation: string, error: unknown) {
  const { code, status } = authFailure(error)
  console.info(
    "amautai_auth_failure",
    JSON.stringify({ operation, code, status })
  )
}
