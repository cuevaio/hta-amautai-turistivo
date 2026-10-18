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
  const headingId = `registrants-${title}`

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 rounded-xl border border-border p-5 sm:p-6"
    >
      <h2 id={headingId} className="text-xl font-semibold">
        {m(title)}
      </h2>
      <ol className="mt-4 list-decimal divide-y divide-border pl-6 marker:text-muted-foreground">
        {names.map((name, index) => (
          <li key={`${index}-${name}`} className="break-words py-2.5 text-sm">
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
      <title>{[m("Personas registradas"), "Amautai"].join(" · ")}</title>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/" aria-label={m("Amautai")}>
          <BrandLogo />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <LanguageSelector compact />
          <ThemeToggle className="size-9" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pt-7 pb-14 sm:px-8 sm:pt-10 lg:px-12 lg:pb-20">
        <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">
          {m("Personas registradas")}
        </h1>
        <div className="mt-7 grid items-start gap-5 md:grid-cols-2">
          <NameColumn title="Familias" names={familyRegistrantNames} />
          <NameColumn title="Docentes" names={teacherRegistrantNames} />
        </div>
      </main>
    </div>
  )
}
