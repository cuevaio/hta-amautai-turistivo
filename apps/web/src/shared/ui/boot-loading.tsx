import { useMessages } from "@/shared/i18n/use-messages"

export function BootLoading({ message }: { message: string }) {
  const { m } = useMessages()
  return (
    <div id="boot-screen" role="status" aria-live="polite" aria-busy="true">
      <img src="/favicon.svg" alt="" />
      <span className="boot-status">
        <span className="boot-spinner" aria-hidden="true" />
        <span>{m(message)}</span>
      </span>
    </div>
  )
}
