import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"
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
      <header className="bg-background/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:gap-8 lg:px-12">
          <Link
            to="/"
            className="flex min-h-11 w-fit items-center"
            aria-label={m("Amautai")}
          >
            <BrandLogo />
          </Link>
          <nav
            aria-label={m("Navegación principal")}
            className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border/70 pt-2 text-sm lg:ml-4 lg:flex-1 lg:gap-x-7 lg:border-0 lg:pt-0"
          >
            <a
              href="#como-funciona"
              className="flex min-h-11 items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {m("Cómo funciona")}
            </a>
            <a
              href="#docentes"
              className="flex min-h-11 items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {m("Para docentes")}
            </a>
            <a
              href="#familias"
              className="flex min-h-11 items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {m("Para familias")}
            </a>
            <Link
              to="/lista-de-espera"
              className="flex min-h-11 items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {m("Lista de espera")}
            </Link>
          </nav>
          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-2 sm:justify-end lg:shrink-0 lg:border-0 lg:pt-0">
            <div className="flex items-center gap-2">
              <ThemeToggle className="size-9" />
              <LanguageSelector compact />
            </div>
            <Button
              nativeButton={false}
              variant="link"
              render={<Link to="/iniciar-sesion" />}
            >
              {m("Iniciar sesión")}
            </Button>
            <Button nativeButton={false} render={<Link to="/crear-cuenta" />}>
              {m("Crear cuenta")}
            </Button>
          </div>
        </div>
      </header>
      <main id="contenido">
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-5 pt-8 pb-12 sm:gap-10 sm:px-8 sm:pt-12 sm:pb-16 md:grid-cols-[1.1fr_0.9fr] lg:min-h-[calc(100svh-5rem)] lg:gap-16 lg:px-12 lg:py-8">
          <div className="flex min-w-0 flex-col items-start gap-6 lg:gap-8">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                {m("Para familias y docentes")}
              </span>
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
                {m("Matemáticas de primaria")}
              </span>
            </div>
            <h1 className="w-full max-w-2xl text-4xl leading-[1.08] font-semibold text-balance break-words sm:text-5xl lg:text-6xl xl:text-7xl">
              {m("Los niños aprenden mejor jugando.")}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              {m(
                "Matemáticas de primaria con sesiones contextualizadas y un juego de multiplicación para segundo grado."
              )}
            </p>
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <Button nativeButton={false} render={<Link to="/crear-cuenta" />}>
                {m("Empezar ahora")}
              </Button>
              <Button
                nativeButton={false}
                variant="secondary"
                render={<a href="#como-funciona" />}
              >
                {m("Conoce cómo funciona")}
              </Button>
            </div>
          </div>
          <figure className="min-w-0 lg:w-full lg:max-w-[54svh] lg:justify-self-end">
            <img
              src="/images/login-concepts/math-adventure-pixel-art.webp"
              alt=""
              width={1024}
              height={1536}
              fetchPriority="high"
              className="aspect-[5/4] w-full rounded-xl object-cover object-[50%_55%] sm:aspect-[4/3] md:aspect-[3/4]"
            />
          </figure>
        </section>
        <section
          id="docentes"
          className="scroll-mt-6 border-y border-border bg-muted/30"
        >
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <div className="mb-8 max-w-2xl lg:mb-12">
              <p className="mb-3 text-sm font-medium text-primary">
                {m("Dos formas de acompañar")}
              </p>
              <h2 className="text-3xl leading-tight font-semibold text-balance sm:text-4xl">
                {m("Un camino para cada quien")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {m(
                  "Al iniciar sesión eliges tu perfil y queda guardado en tu cuenta."
                )}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
              <article
                aria-labelledby="docentes-titulo"
                className="relative flex min-w-0 flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-primary">
                    {m("Para el aula")}
                  </p>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {m("Disponible")}
                  </span>
                </div>
                <h3 id="docentes-titulo" className="text-2xl font-semibold">
                  {m("Soy docente")}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {m(
                    "Prepara sesiones de Matemática para tu grupo y guarda tus borradores para retomarlos cuando quieras."
                  )}
                </p>
                <p className="mt-auto border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                  {m(
                    "La planificación disponible empieza con Matemática de 2.º de primaria."
                  )}
                </p>
              </article>
              <article
                id="familias"
                aria-labelledby="familias-titulo"
                className="relative flex min-w-0 scroll-mt-6 flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-primary">
                    {m("Desde casa")}
                  </p>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {m("Disponible")}
                  </span>
                </div>
                <h3 id="familias-titulo" className="text-2xl font-semibold">
                  {m("Soy padre o madre")}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {m(
                    "Acompaña el aprendizaje en casa con un perfil que guarda el grado y, de manera opcional, el lugar o comunidad y el idioma."
                  )}
                </p>
                <p className="mt-auto border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                  {m(
                    "También puedes probar el juego de multiplicación disponible para segundo grado."
                  )}
                </p>
              </article>
            </div>
          </div>
        </section>
        <section
          id="como-funciona"
          className="scroll-mt-6 border-b border-border"
        >
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <p className="mb-3 text-sm font-medium text-primary">
              {m("Una preparación clara, paso a paso")}
            </p>
            <h2 className="mb-8 max-w-2xl text-3xl leading-tight font-semibold text-balance sm:text-4xl lg:mb-12">
              {m("Cómo funciona para docentes")}
            </h2>
            <ol className="grid gap-4 md:grid-cols-3 lg:gap-6">
              {[
                {
                  number: "01",
                  title: "Configura el contexto de tu grupo",
                  body: "Cuéntale a Amautai sobre el grado, la comunidad y lo que viven tus estudiantes día a día.",
                },
                {
                  number: "02",
                  title: "Prepara una sesión de matemáticas",
                  body: "Arma un borrador con un propósito matemático y situaciones que tus estudiantes reconocen.",
                },
                {
                  number: "03",
                  title: "Guarda y retoma tu borrador",
                  body: "Conserva tus sesiones y vuelve a editarlas cuando quieras seguir preparando tu clase.",
                },
              ].map((step) => (
                <li
                  key={step.number}
                  className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
                >
                  <p className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {step.number}
                  </p>
                  <h3 className="text-xl leading-snug font-semibold">
                    {m(step.title)}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {m(step.body)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section
          id="contexto"
          className="mx-auto grid max-w-7xl scroll-mt-6 gap-8 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-12 lg:gap-20 lg:px-12 lg:py-20"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-primary">
              {m("Aprendizaje con raíces")}
            </p>
            <h2 className="max-w-sm text-3xl leading-tight font-semibold text-balance sm:text-4xl">
              {m("El contexto también enseña.")}
            </h2>
          </div>
          <div className="flex min-w-0 flex-col items-start gap-6 rounded-2xl bg-muted/50 p-6 sm:p-8">
            <p className="max-w-xl text-xl leading-relaxed font-medium sm:text-2xl">
              {m(
                "Una niña de Ayacucho y un niño de Lima no cuentan las mismas cosas camino a la escuela."
              )}
            </p>
            <p className="max-w-xl leading-relaxed text-muted-foreground">
              {m(
                "Por eso en Amautai el contexto, el idioma y la realidad de cada comunidad importan desde el primer paso. Seguimos trabajando para que más lenguas peruanas tengan su lugar."
              )}
            </p>
          </div>
        </section>
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:gap-16 lg:px-12 lg:py-20">
            <div>
              <p className="mb-3 text-sm font-medium text-primary">
                {m("Próximamente")}
              </p>
              <h2 className="text-3xl leading-tight font-semibold text-balance sm:text-4xl">
                {m("Recordatorios para que ninguna tarea se quede atrás")}
              </h2>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <p className="text-lg leading-relaxed font-medium">
                {m("Avisos automáticos por WhatsApp sobre tus tareas")}
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {m(
                  "Estamos preparando recordatorios por WhatsApp para ayudarte a seguir las tareas y sus fechas. Podrás elegir tus preferencias; los envíos se activarán cuando estén disponibles las tareas y la mensajería."
                )}
              </p>
            </div>
          </div>
        </section>
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:gap-16 lg:px-12 lg:py-20">
            <div>
              <p className="mb-3 text-sm font-medium text-primary">
                {m("Una experiencia que habla contigo")}
              </p>
              <h2 className="text-3xl leading-tight font-semibold text-balance sm:text-4xl">
                {m("Aprende en el idioma que se siente como casa")}
              </h2>
            </div>
            <div className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm sm:p-8">
              <p className="max-w-2xl leading-relaxed text-primary-foreground/90">
                {m(
                  "La interfaz de Amautai está disponible en español, quechua chanka y aimara. Elige tu idioma desde el selector para recorrer la plataforma a tu manera."
                )}
              </p>
              <ul
                aria-label={m("Idiomas disponibles")}
                className="mt-6 flex flex-wrap gap-3"
              >
                {["Español", "Quechua chanka", "Aimara"].map((language) => (
                  <li
                    key={language}
                    className="rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-2 text-sm font-medium"
                  >
                    {m(language)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <section className="border-y border-border">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-5 py-12 sm:px-8 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-20">
            <h2 className="max-w-2xl text-3xl leading-tight font-semibold text-balance sm:text-4xl">
              {m("Empieza a preparar tu próxima sesión")}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button nativeButton={false} render={<Link to="/crear-cuenta" />}>
                {m("Crear cuenta")}
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-muted/30">
        <nav
          aria-label={m("Contenido del documento")}
          className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-3 px-5 pt-8 text-sm sm:px-8 lg:px-12"
        >
          <Link to="/lista-de-espera" className="underline underline-offset-4">
            {m("Lista de espera")}
          </Link>
          <Link to="/privacidad" className="underline underline-offset-4">
            {m("Política de privacidad")}
          </Link>
          <Link to="/terminos" className="underline underline-offset-4">
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
            {m("Matemáticas conectadas con cada comunidad")}
          </p>
        </div>
      </footer>
    </div>
  )
}
