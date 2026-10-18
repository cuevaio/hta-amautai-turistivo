import { Link } from "react-router"
import type { CargoRegion } from "@amautai/contracts"
import { Button } from "@workspace/ui/components/button"
import { useMessages } from "@/shared/i18n/use-messages"
import { GameCanvas } from "./game-canvas"
import { useFamilyGame } from "../model/use-family-game"

export function FamilyGamePage() {
  const { m, locale } = useMessages()
  const game = useFamilyGame()
  const number = new Intl.NumberFormat(locale)
  const region: CargoRegion = "coast"

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:justify-center sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {m("Juego para familias")}
          </p>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {m("Alimenta a tu comunidad")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {m("Una partida corta de multiplicación para 2.º de Primaria.")}
          </p>
        </div>
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link to="/" />}
        >
          {m("Inicio de Amautai")}
        </Button>
      </header>

      {!game.state.started ? (
        <section className="flex flex-col gap-5 rounded-xl border bg-card p-5 text-card-foreground sm:p-8">
          <p>{m("Toca la pantalla para guiar al ave. Recoge tres grupos con la cantidad correcta.")}</p>
          <p className="text-sm text-muted-foreground">
            {m("El puntaje de esta partida no se guarda.")}
          </p>
          <div>
            <Button className="w-full sm:w-auto" onClick={game.start}>
              {m("Empezar a jugar")}
            </Button>
          </div>
        </section>
      ) : game.finished ? (
        <section className="flex flex-col items-center gap-4 rounded-xl border bg-card p-6 text-center text-card-foreground sm:p-10">
          <h2 className="text-2xl font-semibold">{m("¡Terminaste la partida!")}</h2>
          <p className="text-xl font-medium">
            {m("Puntaje final: {{score}}", {
              score: number.format(game.state.score),
            })}
          </p>
          <Button className="w-full sm:w-auto" onClick={game.restart}>
            {m("Volver a empezar")}
          </Button>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <p className="text-sm font-medium">
            {m("Reto {{level}} de 3", { level: game.state.solved + 1 })}
          </p>
          <GameCanvas
            region={region}
            value={game.challenge.unitsPerGroup}
            energy={game.state.caught * game.challenge.unitsPerGroup}
            target={game.challenge.groupCount * game.challenge.unitsPerGroup}
            paused={false}
            saving={false}
            feedbackVersion={game.state.feedbackVersion}
            launch={game.state.solved}
            onCollect={game.collect}
            score={game.state.score}
            caught={game.state.caught}
            groupCount={game.challenge.groupCount}
            mistakes={game.state.mistakes}
            level={game.state.solved + 1}
            feedback={game.state.feedback}
          />
        </section>
      )}
    </main>
  )
}
