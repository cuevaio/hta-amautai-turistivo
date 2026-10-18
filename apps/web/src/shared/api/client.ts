export class ApiError extends Error {
  status?: number
  code?: string
  constructor(message: string, code?: string, status?: number) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.status = status
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set("X-Amautai-Request", "1")
  if (options.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json")
  const timeout = AbortSignal.timeout(15000)
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers,
    signal,
  })
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/api/auth/"))
      window.location.replace("/iniciar-sesion")
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    const authMessages: Record<string, string> = {
      invalid_education_input:
        "Revisa los datos. Esta versión solo admite Matemática de 2.º de Primaria y su catálogo curricular.",
      education_not_found: "No encontramos este borrador o no tienes acceso.",
      education_profile_required:
        "Completa tu perfil docente antes de crear una sesión.",
      education_version_conflict:
        "Este borrador cambió en otra pestaña. Tus cambios se conservaron; revisa la versión guardada.",
      email_not_configured: "El envío de email aún no está habilitado.",
      email_disabled: "Los avisos por email están desactivados.",
      email_verification_required:
        "La verificación de tu correo se completa al iniciar sesión.",
      email_verification_in_login:
        "La verificación ahora se completa al iniciar sesión. Actualiza esta página.",
      email_rate_limited:
        "Alcanzaste el límite diario de 20 avisos para tu cuenta o número.",
      email_request_conflict:
        "La solicitud ya existe con otros datos. Actualiza el historial.",
      email_not_pending:
        "El email ya se está procesando o cambió. Actualiza el historial.",
      invalid_email_input: "Revisa los datos del email.",
      whatsapp_unavailable:
        "El emisor de WhatsApp no está conectado. Inténtalo cuando esté disponible.",
      whatsapp_not_registered:
        "Registra tu número y activa los avisos para continuar.",
      invalid_whatsapp_code:
        "El código no es válido, venció o agotó sus 5 intentos. Solicita uno nuevo.",
      notification_rate_limited:
        "Alcanzaste el límite diario de 20 avisos para tu cuenta o número.",
      invalid_notification_input:
        "Revisa el número y los datos del recordatorio.",
      invalid_schedule: "Elige una fecha dentro de los próximos 30 días.",
      notification_not_pending:
        "El aviso ya se está procesando o cambió. Actualiza el historial.",
      logout_unavailable:
        "No pudimos cerrar tu sesión. Reintenta en unos momentos.",
      auth_unavailable:
        "No pudimos conectar con el servicio de acceso. Inténtalo de nuevo en unos momentos.",
      auth_rate_limited:
        "Hubo demasiados intentos. Espera unos minutos antes de volver a entrar.",
      organization_selection_required:
        "Tu cuenta necesita seleccionar un equipo para continuar.",
      invalid_recovery_email: "Escribe un correo electrónico válido.",
      invalid_reset_password:
        "La nueva contraseña debe tener al menos 12 caracteres.",
      reset_expired:
        "El enlace venció. Solicita uno nuevo para recuperar tu contraseña.",
      reset_failed:
        "No pudimos cambiar la contraseña. Elige una contraseña segura o solicita otro enlace si el actual venció.",
      recovery_rate_limited:
        "Espera unos minutos antes de intentarlo de nuevo.",
      invalid_signup:
        "Revisa tus datos. La contraseña debe tener al menos 12 caracteres.",
      password_policy:
        "Elige una contraseña más segura, larga y que no hayas utilizado antes.",
      signup_failed:
        "No pudimos crear la cuenta. Si ya tienes una, inicia sesión; si no, revisa tus datos e inténtalo de nuevo.",
      verification_expired:
        "La verificación venció. Inicia sesión de nuevo para recibir otro código.",
      invalid_verification_code: "Escribe el código de 6 dígitos.",
      verification_failed:
        "El código no es válido o venció. Revisa tu correo e inténtalo de nuevo.",
    }
    if (body.error && authMessages[body.error])
      throw new ApiError(authMessages[body.error], body.error, response.status)
    if (response.status >= 500)
      throw new ApiError(
        "El servidor de la app no está disponible. Inténtalo de nuevo en unos momentos.",
        body.error || "server_unavailable",
        response.status
      )
    throw new ApiError(
      response.status === 409
        ? "Este proyecto cambió. Recarga antes de editarlo."
        : response.status === 401
          ? "No pudimos iniciar sesión. Revisa tus datos o usa Google o GitHub."
          : "No pudimos completar la solicitud. Inténtalo de nuevo.",
      body.error,
      response.status
    )
  }
  return response.json() as Promise<T>
}
