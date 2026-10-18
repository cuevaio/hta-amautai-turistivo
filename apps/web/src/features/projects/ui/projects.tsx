import { useMessages } from "@/shared/i18n/use-messages"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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
  const { m, errorMessage, formatDate } = useMessages()

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
          <h1 className="text-2xl font-semibold">{m("Proyectos")}</h1>
          <p className="text-sm text-muted-foreground">
            {m("De la primera idea a algo que puedas mostrar.")}
          </p>
        </div>
        <Button onClick={() => edit("new")}>
          <PlusIcon data-icon="inline-start" />
          {m("Nuevo proyecto")}
        </Button>
      </div>
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {m(notice)}
        </p>
      )}
      {error ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert">{errorMessage(error)}</p>
          <Button variant="outline" onClick={() => void load()}>
            {m("Reintentar")}
          </Button>
        </div>
      ) : loading ? (
        <div
          role="status"
          aria-label={m("Cargando proyectos")}
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
            <EmptyTitle>{m("Tu primera idea empieza aquí")}</EmptyTitle>
            <EmptyDescription>
              {m("Crea un proyecto y organiza lo que vas a construir.")}
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => edit("new")}>
            {m("Crear mi primer proyecto")}
          </Button>
        </Empty>
      ) : (
        <Table>
          <TableCaption>{m("Hasta 100 proyectos de tu espacio.")}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{m("Proyecto")}</TableHead>
              <TableHead>{m("Estado")}</TableHead>
              <TableHead>{m("Actualizado")}</TableHead>
              <TableHead className="text-right">{m("Acciones")}</TableHead>
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
                    {m(labels[project.status])}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDate(project.updated_at, { dateStyle: "short" })}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={m("Editar {{name}}", { name: project.name })}
                      onClick={() => edit(project)}
                    >
                      {m("Editar")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={m("Eliminar {{name}}", {
                        name: project.name,
                      })}
                      onClick={() => {
                        setRemoving(project)
                        setFormError("")
                      }}
                    >
                      {m("Eliminar")}
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
        <DialogContent closeLabel={m("Cerrar")}>
          <DialogHeader>
            <DialogTitle>
              {editor === "new" ? m("Nuevo proyecto") : m("Editar proyecto")}
            </DialogTitle>
            <DialogDescription>
              {m("Define tu idea y su estado actual.")}
            </DialogDescription>
          </DialogHeader>
          <form noValidate onSubmit={save} className="flex flex-col gap-6">
            <FieldGroup>
              <Field data-invalid={!!issues.name}>
                <FieldLabel htmlFor="project-name">{m("Nombre")}</FieldLabel>
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
                    {m(issues.name)}
                  </FieldDescription>
                )}
              </Field>
              <Field data-invalid={!!issues.description}>
                <FieldLabel htmlFor="project-description">
                  {m("Descripción")}
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
                  <FieldDescription>{m(issues.description)}</FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="project-status">{m("Estado")}</FieldLabel>
                <Select
                  items={Object.entries(labels).map(([value, label]) => ({
                    value,
                    label: m(label),
                  }))}
                  value={values.status}
                  onValueChange={(status) => {
                    if (status !== null)
                      setValues({
                        ...values,
                        status: status as Values["status"],
                      })
                  }}
                  disabled={busy}
                >
                  <SelectTrigger id="project-status" className="w-full min-w-0">
                    <SelectValue className="min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {Object.entries(labels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {m(label)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage(formError)}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setEditor(null)}
              >
                {m("Cancelar")}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? m("Guardando…") : m("Guardar proyecto")}
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
        <DialogContent closeLabel={m("Cerrar")}>
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
            <DialogDescription>
              {detail ? m(labels[detail.status]) : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm break-words whitespace-pre-wrap">
            {detail?.description || m("Sin descripción.")}
          </p>
          <p className="text-xs text-muted-foreground">
            {m("Creado:")}{" "}
            {detail &&
              formatDate(detail.created_at, {
                dateStyle: "short",
                timeStyle: "short",
              })}
          </p>
          <DialogFooter>
            <Button onClick={() => setDetail(null)}>{m("Cerrar")}</Button>
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
            <AlertDialogTitle>{m("¿Eliminar este proyecto?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {m("{{name}} dejará de aparecer en tu espacio.", {
                name: removing?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {formError && <p role="alert">{errorMessage(formError)}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {m("Cancelar")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? m("Eliminando…") : m("Eliminar proyecto")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
