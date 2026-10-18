import { useMessages } from "@/shared/i18n/use-messages"
import { BrandLogo } from "@/shared/ui/brand-logo"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { BootLoading } from "@/shared/ui/boot-loading"

export function PageLoading({
  layout = "auth",
  message = "Preparando tu acceso…",
}: {
  layout?: "auth" | "dashboard"
  message?: string
}) {
  const { m } = useMessages()
  if (layout === "auth") return <BootLoading message={message} />
  return (
    <div
      data-slot="page-loading"
      data-layout={layout}
      aria-busy="true"
      className="min-h-svh bg-background text-foreground"
    >
      <p role="status" aria-live="polite" className="sr-only">
        {m(message)}
      </p>
      <div className="flex min-h-svh gap-2 bg-sidebar p-2">
        <aside
          aria-hidden="true"
          className="hidden w-64 shrink-0 flex-col gap-8 p-4 md:flex"
        >
          <BrandLogo />
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-8 w-full" />
            ))}
          </div>
          <div className="mt-auto flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col rounded-xl bg-background shadow-sm">
          <div aria-hidden="true" className="flex h-16 items-center gap-3 px-4">
            <Skeleton className="size-6" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex flex-col gap-6 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-3">
                <p aria-hidden="true" className="text-sm text-muted-foreground">
                  {m(message)}
                </p>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 max-w-full" />
              </div>
              <Skeleton aria-hidden="true" className="h-10 w-36" />
            </div>
            <div
              aria-hidden="true"
              className="flex flex-col gap-4 rounded-xl border p-4"
            >
              <Skeleton className="h-8 w-full" />
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4 border-t pt-4"
                >
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="hidden h-4 w-24 sm:block" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
