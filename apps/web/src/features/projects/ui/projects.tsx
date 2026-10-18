import { useProjects } from "../model/use-projects"
import type { ProjectInput as Values } from "@amautai/contracts"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { PlusIcon, FolderIcon } from "lucide-react"
import { useAuth } from "@/features/auth"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@workspace/ui/components/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@workspace/ui/components/alert-dialog"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableCaption,
} from "@workspace/ui/components/table"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"

const labels = { idea: "Idea", building: "En desarrollo", ready: "Listo" }
export function Projects() {
  const { tenant } = useAuth()
  const {
    projects,
    loading,
    error,
    notice,
    editor,
    values,
    setValues,
    issues,
    formError,
    busy,
    removing,
    setRemoving,
    detail,
    setDetail,
    load,
    edit,
    save,
    remove,
    read,
    setEditor,
    setFormError,
  } = useProjects()
  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{tenant?.name}</p>
          <h1 className="text-2xl font-semibold">Proyectos</h1>
          <p className="text-sm text-muted-foreground">
            De la primera idea a algo que puedas mostrar.
          </p>
        </div>
        <Button onClick={() => edit("new")}>
          <PlusIcon data-icon="inline-start" />
          Nuevo proyecto
        </Button>
      </div>
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      {error ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert">{error}</p>
          <Button variant="outline" onClick={() => void load()}>
            Reintentar
          </Button>
        </div>
      ) : loading ? (
        <div
          role="status"
          aria-label="Cargando proyectos"
          className="flex flex-col gap-3"
        >
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : projects.length === 0 ? (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderIcon />
            </EmptyMedia>
            <EmptyTitle>Tu primera idea empieza aquí</EmptyTitle>
            <EmptyDescription>
              Crea un proyecto y organiza lo que vas a construir.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => edit("new")}>
            Crear mi primer proyecto
          </Button>
        </Empty>
      ) : (
        <Table>
          <TableCaption>Hasta 100 proyectos de tu espacio.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Proyecto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Actualizado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Button variant="link" onClick={() => void read(project)}>
                    {project.name}
                  </Button>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      project.status === "ready" ? "default" : "secondary"
                    }
                  >
                    {labels[project.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(project.updated_at).toLocaleDateString("es-PE")}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={"Editar " + project.name}
                      onClick={() => edit(project)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={"Eliminar " + project.name}
                      onClick={() => {
                        setRemoving(project)
                        setFormError("")
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setEditor(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editor === "new" ? "Nuevo proyecto" : "Editar proyecto"}
            </DialogTitle>
            <DialogDescription>
              Define tu idea y su estado actual.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="flex flex-col gap-6">
            <FieldGroup>
              <Field data-invalid={!!issues.name}>
                <FieldLabel htmlFor="project-name">Nombre</FieldLabel>
                <Input
                  id="project-name"
                  value={values.name}
                  onChange={(e) =>
                    setValues({ ...values, name: e.target.value })
                  }
                  required
                  minLength={3}
                  maxLength={100}
                  disabled={busy}
                  aria-invalid={!!issues.name}
                  aria-describedby={issues.name ? "name-error" : undefined}
                />
                {issues.name && (
                  <FieldDescription id="name-error">
                    {issues.name}
                  </FieldDescription>
                )}
              </Field>
              <Field data-invalid={!!issues.description}>
                <FieldLabel htmlFor="project-description">
                  Descripción
                </FieldLabel>
                <Textarea
                  id="project-description"
                  value={values.description}
                  onChange={(e) =>
                    setValues({ ...values, description: e.target.value })
                  }
                  maxLength={1000}
                  disabled={busy}
                  aria-invalid={!!issues.description}
                />
                {issues.description && (
                  <FieldDescription>{issues.description}</FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="project-status">Estado</FieldLabel>
                <NativeSelect
                  id="project-status"
                  value={values.status}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      status: e.target.value as Values["status"],
                    })
                  }
                  disabled={busy}
                >
                  {Object.entries(labels).map(([value, label]) => (
                    <NativeSelectOption key={value} value={value}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </FieldGroup>
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setEditor(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Guardando…" : "Guardar proyecto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
            <DialogDescription>
              {detail ? labels[detail.status] : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm break-words whitespace-pre-wrap">
            {detail?.description || "Sin descripción."}
          </p>
          <p className="text-xs text-muted-foreground">
            Creado:{" "}
            {detail && new Date(detail.created_at).toLocaleString("es-PE")}
          </p>
          <DialogFooter>
            <Button onClick={() => setDetail(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setRemoving(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              «{removing?.name}» dejará de aparecer en tu espacio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {formError && <p role="alert">{formError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? "Eliminando…" : "Eliminar proyecto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
