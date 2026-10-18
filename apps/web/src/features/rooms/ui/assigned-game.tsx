import { useState } from "react"
import { useLocation } from "react-router"
import { useMessages } from "@/shared/i18n/use-messages"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { BrandLogo } from "@/shared/ui/brand-logo"
import { Button } from "@workspace/ui/components/button"
import { AssignedGameProvider } from "../model/game-api-context"
import { useAssignedGame } from "../model/use-assigned-game"
import { CargoPlayer } from "./cargo-player"
import { MarketPlayer } from "./market-player"
import { NurseryPlayer } from "./nursery-player"
import { FairPlayer } from "./fair-player"
import { BuilderPlayer } from "./builder-player"
export function AssignedGamePage() {
  const location = useLocation()
  const token = location.hash.slice(1)
  return (
    <AssignedGameProvider token={token}>
      <AssignedGame key={location.key} token={token} />
    </AssignedGameProvider>
  )
}
function AssignedGame({ token }: { token: string }) {
  const { m } = useMessages()
  const { game, error, retry } = useAssignedGame()
  const [playing, setPlaying] = useState(false)
  const props = game
    ? {
        roomId: game.room.id,
        participantId: game.participant.id,
        returnTo: "/actividad#" + token,
        returnLabel: "Mi actividad",
      }
    : null
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-8 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <BrandLogo className="w-36" />
        <LanguageSelector compact wide />
      </header>
      {error ? (
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">{m("Actividad asignada")}</h1>
          <p role="alert">{m(error)}</p>
          <Button onClick={retry}>{m("Reintentar")}</Button>
        </section>
      ) : !game || !props ? (
        <p role="status">{m("Cargando la actividad asignada…")}</p>
      ) : !playing ? (
        <section className="mx-auto flex w-full max-w-lg flex-col items-start gap-5 rounded-xl border p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">{m("Actividad asignada")}</h1>
          <p className="w-full text-lg font-medium break-words">
            {game.participant.name}
          </p>
          {game.room.name && (
            <p className="w-full break-words text-muted-foreground">
              {game.room.name}
            </p>
          )}
          <p>
            {m(
              "Tu docente te asignó este juego. Tu progreso se guarda para que pueda revisarlo."
            )}
          </p>
          <Button onClick={() => setPlaying(true)}>
            {m(
              game.participant.started
                ? "Continuar actividad"
                : "Comenzar actividad"
            )}
          </Button>
        </section>
      ) : game.room.kind === "builder" ? (
        <BuilderPlayer {...props} />
      ) : game.room.kind === "fair" ? (
        <FairPlayer {...props} />
      ) : game.room.kind === "nursery" ? (
        <NurseryPlayer {...props} />
      ) : game.room.kind === "market" ? (
        <MarketPlayer {...props} />
      ) : (
        <CargoPlayer {...props} />
      )}
    </main>
  )
}
