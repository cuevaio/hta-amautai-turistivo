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
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Separator } from "@workspace/ui/components/separator"

export function WorkspaceSettings({ account = false }: { account?: boolean }) {
  const { user, tenant } = useAuth()
  const { theme, setTheme } = useTheme()
  const { health, retry } = useWorkspaceHealth(account)
  return (
    <section className="flex max-w-2xl flex-col gap-6 py-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">
          {account ? "Mi cuenta" : "Configuración"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {account
            ? "Tus datos de acceso y seguridad."
            : "Tu espacio de trabajo y preferencias."}
        </p>
      </div>
      <FieldGroup>
        {account ? (
          <>
            <Field>
              <FieldLabel htmlFor="account-name">Nombre</FieldLabel>
              <Input
                id="account-name"
                readOnly
                value={[user?.firstName, user?.lastName]
                  .filter(Boolean)
                  .join(" ")}
              />
              <FieldDescription>Nombre asociado a tu cuenta.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-email">
                Correo electrónico
              </FieldLabel>
              <Input id="account-email" readOnly value={user?.email || ""} />
            </Field>
          </>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="workspace-name">Espacio</FieldLabel>
              <Input id="workspace-name" readOnly value={tenant?.name || ""} />
              <FieldDescription>
                {tenant?.kind === "organization"
                  ? "Espacio compartido con tu equipo."
                  : "Espacio personal asociado a tu cuenta."}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="theme">Apariencia</FieldLabel>
              <NativeSelect
                id="theme"
                value={theme}
                onChange={(event) =>
                  setTheme(event.target.value as "dark" | "light" | "system")
                }
              >
                <NativeSelectOption value="dark">Oscuro</NativeSelectOption>
                <NativeSelectOption value="light">Claro</NativeSelectOption>
                <NativeSelectOption value="system">
                  Según tu dispositivo
                </NativeSelectOption>
              </NativeSelect>
              <FieldDescription>Se guarda en este navegador.</FieldDescription>
            </Field>
          </>
        )}
      </FieldGroup>
      <Separator />
      {account ? (
        <div className="flex flex-col items-start gap-3">
          <h2 className="font-medium">Seguridad</h2>
          <p className="text-sm text-muted-foreground">
            Solicita un enlace por correo para elegir una nueva contraseña. Al
            cambiarla se cerrarán tus sesiones activas.
          </p>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link to="/forgot-password" />}
          >
            Recuperar contraseña
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <h2 className="font-medium">Conexión del espacio</h2>
          <p role="status" className="text-sm text-muted-foreground">
            {health === "checking"
              ? "Comprobando conexión…"
              : health === "ok"
                ? "Base de datos disponible."
                : "No pudimos conectar con la base de datos."}
          </p>
          {health === "error" && (
            <Button variant="outline" onClick={retry}>
              Reintentar
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
