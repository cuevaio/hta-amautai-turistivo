import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { BrandLogo } from "@/shared/ui/brand-logo"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { ThemeToggle } from "@/shared/ui/theme-toggle"
import { useMessages } from "@/shared/i18n/use-messages"

export function LandingPage() {
  const { m } = useMessages()
  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:rounded-lg focus:bg-background focus:p-3 focus:ring-2 focus:ring-ring"
      >
        {m("Ir al contenido")}
      </a>
      <header className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-5 sm:flex sm:flex-wrap sm:justify-between sm:gap-x-6 sm:px-8 lg:px-12">
        <Link
          to="/"
          className="flex min-h-11 items-center"
          aria-label={m("Amautai")}
        >
          <BrandLogo />
        </Link>
        <nav
          aria-label={m("Navegación principal")}
          className="hidden items-center gap-6 text-sm lg:flex"
        >
          <a
            href="#una-sesion"
            className="flex min-h-11 items-center rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            {m("Ver una sesión de ejemplo")}
          </a>
          <a
            href="#nuestro-enfoque"
            className="flex min-h-11 items-center rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            {m("Nuestro enfoque")}
          </a>
        </nav>
        <div className="col-start-2 row-start-1 justify-self-end sm:ml-auto">
          <ThemeToggle />
        </div>
        <div className="col-start-1 row-start-2">
          <LanguageSelector compact touchTarget />
        </div>
        <Button
          nativeButton={false}
          variant="outline"
          className="col-start-2 row-start-2 justify-self-end"
          render={<Link to="/login" />}
        >
          {m("Iniciar sesión")}
        </Button>
      </header>
      <main id="contenido">
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-5 pt-8 pb-12 sm:gap-10 sm:px-8 sm:pt-12 sm:pb-16 md:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-12 lg:pt-14 lg:pb-20">
          <div className="flex min-w-0 flex-col items-start gap-6 lg:gap-8">
            <p className="text-sm font-medium">
              {m("Para docentes de primaria")}
            </p>
            <h1 className="w-full max-w-2xl text-4xl leading-[1.08] font-semibold text-balance break-words sm:text-5xl lg:text-6xl xl:text-7xl">
              {m("Las matemáticas empiezan en su mundo.")}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              {m(
                "Prepara sesiones de Matemática a partir del contexto de tu grupo. Guarda tus borradores y retómalos cuando lo necesites."
              )}
            </p>
            <div className="flex w-full flex-col items-start gap-3 sm:w-auto">
              <Button
                nativeButton={false}
                render={<Link to="/signup" />}
              >
                {m("Preparar mi primera sesión")}
              </Button>
              <a
                href="#una-sesion"
                className="flex min-h-11 items-center rounded-sm text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
              >
                {m("Ver una sesión de ejemplo")}
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              {m("Disponible para Matemática de 2.º de Primaria.")}
            </p>
          </div>
          <figure className="min-w-0">
            <img
              src="/images/login-concepts/math-adventure.webp"
              alt=""
              width={1024}
              height={1536}
              fetchPriority="high"
              className="aspect-[5/4] w-full rounded-xl object-cover object-[50%_55%] sm:aspect-[4/3] md:aspect-[3/4]"
            />
            <figcaption className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{m("Su entorno también enseña.")}</span>
              <span>{m("Amautai · Aprender juntos")}</span>
            </figcaption>
          </figure>
        </section>
        <section id="una-sesion" className="scroll-mt-6 border-y border-border">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end lg:mb-12">
              <h2 className="max-w-lg text-3xl leading-tight font-semibold text-balance sm:text-4xl">
                {m("Así puede empezar una sesión.")}
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {m(
                  "Un ejemplo de planificación. Tú eliges el propósito y adaptas la sesión a tus estudiantes."
                )}
              </p>
            </div>
            <article
              aria-labelledby="ejemplo-titulo"
              className="grid min-w-0 rounded-xl border border-border bg-background md:grid-cols-[0.8fr_1.2fr]"
            >
              <div className="flex min-w-0 flex-col gap-6 border-b border-border p-6 sm:p-8 md:border-r md:border-b-0 lg:p-10">
                <p className="text-sm text-muted-foreground">
                  {m("El punto de partida")}
                </p>
                <h3
                  id="ejemplo-titulo"
                  className="text-3xl leading-tight font-semibold text-balance sm:text-4xl"
                >
                  {m("¿Cómo cuidamos el agua?")}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {m("Matemática de 2.º de Primaria")}
                </p>
                <Separator />
                <p className="text-base leading-relaxed">
                  {m(
                    "El grupo observa cómo usa el agua en casa y conversa sobre maneras de cuidarla."
                  )}
                </p>
              </div>
              <dl className="flex min-w-0 flex-col divide-y divide-border px-6 sm:px-8 lg:px-10">
                <div className="grid gap-3 py-6 sm:py-8">
                  <dt className="text-sm text-muted-foreground">
                    {m("Propósito de aprendizaje")}
                  </dt>
                  <dd className="text-lg leading-relaxed sm:text-xl">
                    {m(
                      "Comparar cantidades de agua en situaciones cotidianas."
                    )}
                  </dd>
                </div>
                <div className="grid gap-3 py-6 sm:py-8">
                  <dt className="text-sm text-muted-foreground">
                    {m("Tu criterio docente")}
                  </dt>
                  <dd className="text-sm leading-relaxed">
                    {m(
                      "Reúne el propósito, la competencia matemática y una situación significativa para tu aula."
                    )}
                  </dd>
                </div>
                <div className="grid gap-3 py-6 sm:py-8">
                  <dt className="text-sm text-muted-foreground">
                    {m("Un borrador al que puedes volver")}
                  </dt>
                  <dd className="text-sm leading-relaxed">
                    {m(
                      "Conserva tus borradores y vuelve a ellos cuando quieras seguir preparando tu clase."
                    )}
                  </dd>
                </div>
              </dl>
            </article>
          </div>
        </section>
        <section
          id="nuestro-enfoque"
          className="mx-auto grid max-w-7xl scroll-mt-6 gap-8 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-12 lg:gap-20 lg:px-12 lg:py-20"
        >
          <h2 className="max-w-sm text-3xl leading-tight font-semibold text-balance sm:text-4xl">
            {m("Su entorno también enseña.")}
          </h2>
          <div className="flex min-w-0 flex-col items-start gap-6">
            <p className="max-w-xl text-xl leading-relaxed sm:text-2xl">
              {m(
                "Una feria, un río o una cosecha pueden ser el comienzo de una gran pregunta matemática."
              )}
            </p>
            <p className="max-w-xl leading-relaxed text-muted-foreground">
              {m(
                "Hoy puedes planificar y guardar tus sesiones. Los juegos con IA adaptados al contexto y al idioma del grupo son nuestra próxima etapa."
              )}
            </p>
            <Button
              nativeButton={false}
              render={<Link to="/signup" />}
            >
              {m("Crear mi cuenta docente")}
            </Button>
          </div>
        </section>
      </main>
      <footer className="border-t border-border">
        <nav
          aria-label={m("Contenido del documento")}
          className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-3 px-5 pt-6 text-sm sm:px-8 lg:px-12"
        >
          <Link to="/evidence" className="underline underline-offset-4">
            {m("Resultados de las encuestas")}
          </Link>
          <Link to="/privacy" className="underline underline-offset-4">
            {m("Política de privacidad")}
          </Link>
          <Link to="/terms" className="underline underline-offset-4">
            {m("Términos de uso")}
          </Link>
        </nav>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-6 sm:px-8 lg:px-12">
          <Link
            to="/"
            className="flex min-h-11 items-center"
            aria-label={m("Amautai")}
          >
            <BrandLogo />
          </Link>
          <p className="text-sm text-muted-foreground">
            {m("Aprender empieza aquí")}
          </p>
          <Button
            nativeButton={false}
            variant="link"
            render={<Link to="/login" />}
          >
            {m("Iniciar sesión")}
          </Button>
        </div>
      </footer>
    </div>
  )
}
