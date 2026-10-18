import { useMessages } from "@/shared/i18n/use-messages"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { useWorkspaceHealth } from "../model/use-workspace-health"
import { Link } from "react-router"
import { useAuth } from "@/features/auth"
import { useTheme } from "@/shared/model/theme-provider"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"

export function WorkspaceSettings({ account = false }: { account?: boolean }) {
  const { m } = useMessages()

  const { user, tenant } = useAuth()
  const { theme, setTheme } = useTheme()
  const { health, retry } = useWorkspaceHealth(account)
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">
          {account ? m("Mi cuenta") : m("Configuración")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {account
            ? m("Tus datos de acceso y seguridad.")
            : m("Tu espacio de trabajo y preferencias.")}
        </p>
      </div>
      <FieldGroup>
        {account ? (
          <>
            <Field>
              <FieldLabel htmlFor="account-name">{m("Nombre")}</FieldLabel>
              <Input
                id="account-name"
                readOnly
                value={[user?.firstName, user?.lastName]
                  .filter(Boolean)
                  .join(" ")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-email">
                {m("Correo electrónico")}
              </FieldLabel>
              <Input id="account-email" readOnly value={user?.email || ""} />
            </Field>
          </>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="workspace-name">{m("Espacio")}</FieldLabel>
              <Input id="workspace-name" readOnly value={tenant?.name || ""} />
              <FieldDescription>
                {tenant?.kind === "organization"
                  ? m("Espacio compartido con tu equipo.")
                  : m("Espacio personal asociado a tu cuenta.")}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="theme">{m("Apariencia")}</FieldLabel>
              <Select
                items={[
                  { value: "dark", label: m("Oscuro") },
                  { value: "light", label: m("Claro") },
                  { value: "system", label: m("Según tu dispositivo") },
                ]}
                value={theme}
                onValueChange={(value) => {
                  if (value !== null)
                    setTheme(value as "dark" | "light" | "system")
                }}
              >
                <SelectTrigger id="theme" className="w-full min-w-0">
                  <SelectValue className="min-w-0 truncate" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    <SelectItem value="dark">{m("Oscuro")}</SelectItem>
                    <SelectItem value="light">{m("Claro")}</SelectItem>
                    <SelectItem value="system">
                      {m("Según tu dispositivo")}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                {m("Se guarda en este navegador.")}
              </FieldDescription>
            </Field>
            <LanguageSelector />
          </>
        )}
      </FieldGroup>
      <Separator />
      {account ? (
        <div className="flex flex-col items-start gap-3">
          <h2 className="font-medium">{m("Seguridad")}</h2>
          <p className="text-sm text-muted-foreground">
            {m(
              "Solicita un enlace por correo para elegir una nueva contraseña. Al cambiarla se cerrarán tus sesiones activas."
            )}
          </p>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link to="/recuperar-contrasena" />}
          >
            {m("Recuperar contraseña")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <h2 className="font-medium">{m("Conexión del espacio")}</h2>
          <p role="status" className="text-sm text-muted-foreground">
            {health === "checking"
              ? m("Comprobando conexión…")
              : health === "ok"
                ? m("Base de datos disponible.")
                : m("No pudimos conectar con la base de datos.")}
          </p>
          {health === "error" && (
            <Button variant="outline" onClick={retry}>
              {m("Reintentar")}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
