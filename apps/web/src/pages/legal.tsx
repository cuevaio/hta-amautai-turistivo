import { Link } from "react-router"
import { Separator } from "@workspace/ui/components/separator"
import { BrandLogo } from "@/shared/ui/brand-logo"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { ThemeToggle } from "@/shared/ui/theme-toggle"
import { useMessages } from "@/shared/i18n/use-messages"

const privacy = [
  [
    "Datos de cuenta",
    "Tratamos tu nombre, correo, identificador de cuenta y, si el proveedor lo facilita, imagen de perfil. WorkOS gestiona el acceso con contraseña o con Google y GitHub; Amautai no recibe tu contraseña de Google o GitHub.",
  ],
  [
    "Datos que introduces",
    "Guardamos el perfil docente y contexto del grupo que completes, proyectos, borradores de sesiones y preferencias de notificación. Si habilitas WhatsApp, también tratamos tu número, consentimiento e historial de mensajes. La infraestructura puede procesar dirección IP y datos técnicos para operar y proteger el servicio.",
  ],
  [
    "Para qué los usamos",
    "Usamos esos datos para identificarte, mantener tu sesión, guardar y mostrar tu trabajo, enviar comunicaciones de cuenta y notificaciones que configures, y resolver problemas de funcionamiento o seguridad. La versión actual no incorpora publicidad ni generación de juegos con IA.",
  ],
  [
    "Acceso con Google",
    "Solicitamos correo y perfil básico para autenticar tu cuenta. No solicitamos acceso a Gmail, Drive ni contactos. No usamos datos de Google para publicidad ni para entrenar modelos de IA. Puedes revisar o retirar el acceso desde tu cuenta de Google; retirarlo no elimina por sí solo los datos ya guardados en Amautai.",
  ],
  [
    "Servicios que intervienen",
    "Cloudflare aloja la aplicación y su base de datos; WorkOS gestiona la identidad. Google o GitHub intervienen si eliges esos accesos. El correo usa infraestructura basada en Stalwart; WhatsApp utiliza una pasarela de Amautai y la red de WhatsApp/Meta. Estos servicios pueden tratar datos fuera de tu país bajo sus propias condiciones.",
  ],
  [
    "Cookies y preferencias",
    "Usamos cookies necesarias para sesión y verificaciones de acceso. El navegador guarda idioma y apariencia en almacenamiento local. No incorporamos herramientas de publicidad o analítica de comportamiento en esta versión.",
  ],
  [
    "Conservación y solicitudes",
    "Conservamos los datos mientras la cuenta permanezca activa o sean necesarios para prestar, proteger y mantener el servicio. No hay un borrado automático general de cuentas, borradores o historial. Puedes solicitar acceso, corrección o eliminación escribiendo a amautai@turistivo.com. Los registros técnicos y las copias de seguridad pueden conservarse durante el tiempo necesario para la seguridad y recuperación del servicio.",
  ],
  [
    "Datos de estudiantes",
    "Esta versión está dirigida a docentes adultos. No introduzcas nombres, contactos, fotos ni otros datos que identifiquen a estudiantes. Los perfiles de estudiantes y los flujos para familias todavía no están disponibles.",
  ],
  [
    "Cambios de esta política",
    "Esta política rige desde el 18 de octubre de 2026. Publicaremos aquí los cambios relevantes y, cuando corresponda, los comunicaremos antes de aplicarlos.",
  ],
] as const

const terms = [
  [
    "Qué ofrece Amautai",
    "Amautai permite a docentes adultos preparar y guardar borradores de sesiones de Matemática de 2.º de Primaria, además de gestionar proyectos y notificaciones. Los juegos con IA, perfiles de estudiantes, tareas y resultados de aprendizaje son funciones futuras, no prestaciones disponibles.",
  ],
  [
    "Tu cuenta",
    "Proporciona información de cuenta correcta, protege tus credenciales y no compartas el acceso. Si detectas un uso no autorizado, comunícalo a amautai@turistivo.com.",
  ],
  [
    "Tu contenido",
    "Conservas los derechos sobre el contenido que introduces. Autorizas su tratamiento solo en lo necesario para guardarlo, mostrarlo y prestar las funciones que solicites. Debes contar con permiso para utilizar el material que incorpores y evitar datos que identifiquen a estudiantes.",
  ],
  [
    "Revisión docente",
    "Los borradores y ejemplos no sustituyen tu criterio profesional ni constituyen validación curricular. Revisa su exactitud, pertinencia cultural y adecuación a tu grupo antes de usarlos. Las traducciones a quechua y aimara son iniciales y requieren revisión de hablantes; no se garantizan resultados de aprendizaje.",
  ],
  [
    "Uso permitido",
    "No uses Amautai para actividades ilícitas, vulnerar derechos, enviar mensajes no solicitados, acceder a información ajena o atacar el servicio. El acceso podrá restringirse ante abuso o riesgos de seguridad. Puedes solicitar una revisión escribiendo a amautai@turistivo.com.",
  ],
  [
    "Disponibilidad y notificaciones",
    "El servicio está en desarrollo y puede presentar interrupciones o cambios. No se ofrece disponibilidad garantizada ni entrega inmediata de mensajes. Puedes modificar tus preferencias de notificación; las comunicaciones necesarias de verificación o recuperación de cuenta se gestionan por separado.",
  ],
  [
    "Costos y cierre de cuenta",
    "La versión actual no incluye cobros ni suscripciones de pago. Cualquier oferta comercial futura deberá informar sus condiciones antes de contratar. Puedes solicitar el cierre de tu cuenta y la eliminación de datos escribiendo a amautai@turistivo.com; no hay un botón de eliminación automática en esta versión.",
  ],
  [
    "Responsable y contacto",
    "Amautai es operado por Diego Urday como persona natural. Para consultas sobre estas condiciones, reportar usos no autorizados, presentar reclamos o solicitar el cierre de una cuenta, escribe a amautai@turistivo.com.",
  ],
] as const

export function LegalPage({ document }: { document: "privacy" | "terms" }) {
  const { m } = useMessages()
  const isPrivacy = document === "privacy"
  const title = isPrivacy ? "Política de privacidad" : "Términos de uso"
  const sections = isPrivacy ? privacy : terms
  return (
    <div className="min-h-svh bg-background text-foreground">
      <title>{[m(title), "Amautai"].join(" · ")}</title>
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <Link to="/" aria-label={m("Amautai")}>
          <BrandLogo />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <LanguageSelector compact />
          <ThemeToggle className="size-9" />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 pt-8 pb-16 break-words">
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          {m(title)}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {m(
            "Vigente desde el 18 de octubre de 2026."
          )}
        </p>
        <aside
          className="my-8 rounded-lg border border-border p-5"
          aria-label={m("Responsable y contacto")}
        >
          <h2 className="font-medium">{m("Responsable y contacto")}</h2>
          <p className="mt-3 text-sm leading-relaxed">
            {m(
              "Amautai es operado por Diego Urday como persona natural."
            )}
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            {m(
              "Contacto: amautai@turistivo.com."
            )}
          </p>
        </aside>
        <nav aria-label={m("Contenido del documento")} className="mb-10">
          <ol className="flex flex-col gap-2 text-sm">
            {sections.map(([heading], index) => (
              <li key={heading}>
                <a
                  href={`#seccion-${index + 1}`}
                  className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {m(heading)}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex flex-col gap-8">
          {sections.map(([heading, body], index) => (
            <section
              key={heading}
              id={`seccion-${index + 1}`}
              className="scroll-mt-6"
            >
              <h2 className="text-xl font-semibold">{m(heading)}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {m(body)}
              </p>
            </section>
          ))}
        </div>
        <Separator className="my-10" />
        <footer className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link to="/" className="underline underline-offset-4">
            {m("Volver al inicio")}
          </Link>
          <Link
            to={isPrivacy ? "/terminos" : "/privacidad"}
            className="underline underline-offset-4"
          >
            {m(isPrivacy ? "Términos de uso" : "Política de privacidad")}
          </Link>
        </footer>
      </main>
    </div>
  )
}
