import { Link } from "react-router"
import { BrandLogo } from "@/shared/ui/brand-logo"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { ThemeToggle } from "@/shared/ui/theme-toggle"
import { useMessages } from "@/shared/i18n/use-messages"
import { surveyResults, type SurveyChart, type SurveyResults } from "../model/validation-data"

function percentage(count: number, total: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
    (count / total) * 100
  )
}

function Chart({ chart, total }: { chart: SurveyChart; total: number }) {
  const { m, locale } = useMessages()
  return (
    <figure className="min-w-0 border-t border-border pt-5">
      <figcaption className="mb-4 text-base font-medium">{m(chart.title)}</figcaption>
      <ul className="flex flex-col gap-3">
        {chart.options.map(({ label, count }) => {
          const share = percentage(count, total, locale)
          return (
            <li key={label} className="grid min-w-0 gap-1.5">
              <div className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 break-words text-muted-foreground">{label}</span>
                <span className="shrink-0 tabular-nums">
                  {count} · {share}%
                </span>
              </div>
              <div
                aria-hidden="true"
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </figure>
  )
}

function SummaryStat({
  label,
  count,
  total,
}: {
  label: string
  count: number
  total: number
}) {
  const { m, locale } = useMessages()
  const share = percentage(count, total, locale)
  return (
    <article className="rounded-xl border border-border p-5 sm:p-6">
      <p className="text-sm text-muted-foreground">{m(label)}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums">
        {count} <span className="text-lg font-normal text-muted-foreground">/ {total}</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{share} %</p>
    </article>
  )
}

function AudienceSection({ data }: { data: SurveyResults }) {
  const { m } = useMessages()
  const audience = data.audience === "teachers" ? "Docentes" : "Familias"
  const formLabel =
    data.audience === "teachers"
      ? "Ver encuesta para docentes"
      : "Ver encuesta para familias"

  return (
    <section
      aria-labelledby={`audiencia-${data.audience}`}
      className="scroll-mt-6 rounded-xl border border-border p-5 sm:p-7"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2
          id={`audiencia-${data.audience}`}
          className="text-2xl leading-tight font-semibold"
        >
          {m(audience)}
        </h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">
            {data.responses}
          </span>{" "}
          {m("respuestas")}
        </p>
      </div>
      <div className="grid gap-x-8 gap-y-7 lg:grid-cols-2">
        {data.charts.map((chart) => (
          <Chart
            key={chart.title}
            chart={chart}
            total={data.responses}
          />
        ))}
      </div>
      <a
        href={data.formUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-7 inline-flex min-h-11 items-center rounded-sm text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {m(formLabel)}
      </a>
    </section>
  )
}

export function EvidencePage() {
  const { m } = useMessages()
  return (
    <div className="min-h-svh bg-background text-foreground">
      <title>{[m("Resultados de validación del problema"), "Amautai"].join(" · ")}</title>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/" aria-label={m("Amautai")}>
          <BrandLogo />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <LanguageSelector compact />
          <ThemeToggle className="size-9" />
        </div>
      </header>
      <main id="contenido" className="mx-auto max-w-6xl px-5 pt-7 pb-14 sm:px-8 sm:pt-10 lg:px-12 lg:pb-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-muted-foreground">
            {m("Experiencias recientes de docentes y familias")}
          </p>
          <h1 className="mt-3 text-4xl leading-[1.08] font-semibold text-balance sm:text-5xl">
            {m("Resultados de validación del problema")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {m(
              "Reunimos respuestas sobre experiencias recientes con las matemáticas en primaria."
            )}
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span>{m("Las opciones se conservan tal como aparecen en los formularios originales.")}</span>
            <span>{m("Datos consultados el 18 de octubre de 2026.")}</span>
          </div>
        </div>

        <section aria-label={m("Principales respuestas")} className="mt-9 grid gap-4 md:grid-cols-2">
          <SummaryStat
            label="Docentes que observaron necesidad de apoyo frecuente o constante"
            count={18}
            total={28}
          />
          <SummaryStat
            label="Familias que reportaron necesidad de apoyo a veces o más"
            count={33}
            total={56}
          />
        </section>

        <div className="mt-8 flex flex-col gap-6">
          {surveyResults.map((data) => (
            <AudienceSection key={data.audience} data={data} />
          ))}
        </div>

        <aside className="mt-8 rounded-xl border border-border bg-muted/40 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">{m("Protección de datos")}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            {m(
              "Publicamos solo conteos agregados. No mostramos nombres, teléfonos ni respuestas de texto libre."
            )}
          </p>
        </aside>

        <section className="mt-10 max-w-4xl">
          <h2 className="text-xl font-semibold">{m("Cómo leer estos resultados")}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {m(
              "Las encuestas preguntan por experiencias recientes de las últimas cuatro semanas. La muestra es de conveniencia y no representa a toda la población peruana."
            )}
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {m(
              "Los resultados describen lo que reportaron estas personas; no prueban mejoras de aprendizaje, eficacia del producto ni adopción de Amautai."
            )}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {m(
              "Los datos se consultaron el 18 de octubre de 2026 y esta página no se sincroniza automáticamente con las hojas de respuestas."
            )}
          </p>
        </section>
        <footer className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-6 text-sm">
          <Link to="/" className="underline underline-offset-4">
            {m("Volver a Amautai")}
          </Link>
          <Link to="/privacy" className="underline underline-offset-4">
            {m("Política de privacidad")}
          </Link>
        </footer>
      </main>
    </div>
  )
}
