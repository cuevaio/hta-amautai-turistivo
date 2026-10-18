import { useMessages } from "@/shared/i18n/use-messages"
import { Button } from "@workspace/ui/components/button"
import { Link, useNavigate } from "react-router"
import { useProfile } from "../model/profile-provider"

export function ParentProfileHome() {
  const { m } = useMessages()
  const { familyProfile } = useProfile()
  const navigate = useNavigate()
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{m("Perfil de padre o madre")}</h1>
        <p className="text-muted-foreground">{m("Tu perfil de padre o madre está guardado.")}</p>
      </div>
      {familyProfile && (
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">{m("Grado de primaria")}</dt>
            <dd>{m("Grado {{grade}}", { grade: familyProfile.grade })}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{m("Ciudad")}</dt>
            <dd>{familyProfile.location || m("Sin indicar")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{m("Idioma principal")}</dt>
            <dd>{familyProfile.language || m("Sin indicar")}</dd>
          </div>
        </dl>
      )}
      <p className="text-muted-foreground">{m("Tu cuenta familiar está lista para jugar.")}</p>
      <div className="flex flex-wrap gap-2">
        <Button nativeButton={false} render={<Link to="/panel/familia/jugar" />}>
          {m("Abrir juego")}
        </Button>
        <Button variant="outline" onClick={() => navigate("/registro/familia")}>
          {m("Editar")}
        </Button>
      </div>
    </section>
  )
}
