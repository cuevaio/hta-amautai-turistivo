import { useEffect, useState } from "react"
import {
  projectInput as schema,
  type ProjectInput as Values,
  type Project,
} from "@amautai/contracts"
import { projectsApi } from "../api/projects-api"
const blank: Values = { name: "", description: "", status: "idea" }
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [editor, setEditor] = useState<Project | "new" | null>(null)
  const [values, setValues] = useState<Values>(blank)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState<Project | null>(null)
  const [detail, setDetail] = useState<Project | null>(null)
  async function load() {
    setLoading(true)
    setError("")
    try {
      const data = await projectsApi.list()
      setProjects(data.projects)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const controller = new AbortController()
    projectsApi
      .list(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setProjects(data.projects)
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])
  function edit(project: Project | "new") {
    setEditor(project)
    setValues(
      project === "new"
        ? blank
        : {
            name: project.name,
            description: project.description,
            status: project.status,
          }
    )
    setIssues({})
    setFormError("")
  }
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = schema.safeParse(values)
    if (!input.success) {
      setIssues(
        Object.fromEntries(
          input.error.issues.map((i) => [
            i.path.join("."),
            i.path[0] === "name"
              ? "Usa entre 3 y 100 caracteres."
              : "Máximo 1000 caracteres.",
          ])
        )
      )
      return
    }
    if (!editor || busy) return
    setBusy(true)
    setFormError("")
    try {
      await (editor === "new"
        ? projectsApi.create(input.data)
        : projectsApi.update(editor.id, input.data, editor.version))
      setEditor(null)
      setNotice(editor === "new" ? "Proyecto creado." : "Proyecto actualizado.")
      await load()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function remove() {
    if (!removing || busy) return
    setBusy(true)
    setFormError("")
    try {
      await projectsApi.remove(removing.id, removing.version)
      setRemoving(null)
      setNotice("Proyecto eliminado.")
      await load()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function read(project: Project) {
    try {
      const data = await projectsApi.get(project.id)
      setDetail(data.project)
    } catch (err) {
      setError((err as Error).message)
    }
  }
  return {
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
  }
}
