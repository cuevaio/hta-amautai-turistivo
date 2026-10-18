import { Link } from "react-router"
import { useMessages } from "@/shared/i18n/use-messages"
import { Button } from "@workspace/ui/components/button"
import { useCargoRun } from "../model/use-cargo-run"
import { GameCanvas } from "./game-canvas"
export function CargoPlayer({
  roomId,
  participantId,
}: {
  roomId: string
  participantId: string
}) {
  const { m, locale } = useMessages()
  const game = useCargoRun(roomId, participantId)
  const { run } = game
  const number = new Intl.NumberFormat(locale)
  const back = (
    <Button
      nativeButton={false}
      variant="outline"
      render={<Link to={"/dashboard/rooms/" + roomId} />}
    >
      {m("Volver a la sala")}
    </Button>
  )
  if (game.loadError)
    return (
      <div className="space-y-4">
        <p role="alert">{m(game.loadError)}</p>
        <Button onClick={game.retry}>{m("Reintentar")}</Button>
        {back}
      </div>
    )
  if (!run) return <p role="status">{m("Cargando la prueba…")}</p>
  const lost = run.participant.mistakes >= 3
  return (
    <section className="mx-auto w-full max-w-5xl min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">
            {m("Alimenta a tu comunidad")}
          </h1>
          <p className="break-words">{run.participant.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!lost && (
            <Button
              variant="outline"
              disabled={game.busy}
              onClick={game.togglePause}
            >
              {m(run.participant.paused ? "Continuar prueba" : "Pausar prueba")}
            </Button>
          )}
          {back}
        </div>
      </header>
      {lost ? (
        <div className="space-y-5 rounded-xl border p-8 text-center">
          <h2 className="text-3xl font-semibold">{m("Fin de la partida")}</h2>
          <p>{m("Agotaste tus tres oportunidades.")}</p>
          <p className="text-4xl font-bold">
            {m("{{score}} puntos", {
              score: number.format(run.participant.score),
            })}
          </p>
          <p>{m("Tu puntaje queda guardado hasta que vuelvas a intentar.")}</p>
          <Button disabled={game.busy} onClick={game.restart}>
            {m("Volver a intentar")}
          </Button>
        </div>
      ) : (
        <GameCanvas
          region={run.room.region}
          value={run.challenge.unitsPerGroup}
          energy={run.participant.caught * run.challenge.unitsPerGroup}
          target={run.challenge.groupCount * run.challenge.unitsPerGroup}
          paused={run.participant.paused || game.busy || !!game.error}
          launch={run.participant.solved}
          onCollect={game.collect}
          score={run.participant.score}
          caught={run.participant.caught}
          groupCount={run.challenge.groupCount}
          mistakes={run.participant.mistakes}
          level={run.participant.solved + 1}
          feedback={game.feedback}
        />
      )}
      {game.error && (
        <div role="alert" className="space-y-2">
          <p>{m(game.error)}</p>
          <Button onClick={game.retry}>{m("Recargar progreso")}</Button>
        </div>
      )}
    </section>
  )
}
