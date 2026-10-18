import { Link } from "react-router"
import { BrandLogo } from "@/shared/ui/brand-logo"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { ThemeToggle } from "@/shared/ui/theme-toggle"
import { useMessages } from "@/shared/i18n/use-messages"
import {
  familyRegistrantNames,
  teacherRegistrantNames,
} from "../model/registrants"

function NameColumn({
  title,
  names,
}: {
  title: string
  names: readonly string[]
}) {
  const { m } = useMessages()
  const headingId = `registrants-${title.toLowerCase().replaceAll(" ", "-")}`

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/30 px-5 py-4 sm:px-6">
        <h2
          id={headingId}
          className="text-lg leading-snug font-semibold sm:text-xl"
        >
          {m(title)}
        </h2>
        <span
          aria-label={`${names.length} ${m("Personas registradas")}`}
          className="inline-flex min-w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary tabular-nums"
        >
          {names.length}
        </span>
      </div>
      <ol className="list-decimal divide-y divide-border/80 px-5 pl-11 marker:font-medium marker:text-primary sm:px-6 sm:pl-12">
        {names.map((name, index) => (
          <li
            key={`${index}-${name}`}
            className="py-3 text-sm leading-relaxed break-words sm:text-base"
          >
            {name}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function EvidencePage() {
  const { m } = useMessages()
  return (
    <div className="min-h-svh bg-background text-foreground">
      <title>
        {[
          m(
            "Personas que se mostraron interesadas sobre Amautai antes del Pitch de Hack the Andes"
          ),
          "Amautai",
        ].join(" · ")}
      </title>
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <Link to="/" aria-label={m("Amautai")}>
            <BrandLogo />
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <LanguageSelector compact />
            <ThemeToggle className="size-9" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 pt-8 pb-14 sm:px-8 sm:pt-12 lg:px-12 lg:pb-20">
        <div className="mb-8 max-w-5xl sm:mb-10">
          <p className="mb-4 w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            {m("Hack the Andes")}
          </p>
          <h1 className="text-3xl leading-[1.12] font-semibold text-balance sm:text-4xl">
            {m(
              "Personas que se mostraron interesadas sobre Amautai antes del Pitch de Hack the Andes"
            )}
          </h1>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
          <NameColumn title="Padres de Familia" names={familyRegistrantNames} />
          <NameColumn
            title="Docentes de primaria"
            names={teacherRegistrantNames}
          />
        </div>
      </main>
    </div>
  )
}
