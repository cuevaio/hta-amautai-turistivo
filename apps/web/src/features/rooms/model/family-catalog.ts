import type { FamilyGameKind } from "@amautai/contracts"
export const familyCatalog: readonly {
  kind: FamilyGameKind
  name: string
  topic: string
  description: string
}[] = [
  {
    kind: "market",
    name: "La ruta del mercado",
    topic: "Sumas y restas",
    description: "Recoge y entrega la cantidad que pide el mercado.",
  },
  {
    kind: "nursery",
    name: "El vivero de las decenas",
    topic: "Unidades y decenas",
    description: "Agrupa plantas en decenas y unidades.",
  },
  {
    kind: "builder",
    name: "Constructores del Perú",
    topic: "Figuras y orientación",
    description: "Construye una casa encajando figuras.",
  },
  {
    kind: "fair",
    name: "La feria del equilibrio",
    topic: "Igualdades y equivalencias",
    description: "Añade o retira paquetes para equilibrar la balanza.",
  },
  {
    kind: "cargo",
    name: "Alimenta a tu comunidad",
    topic: "Multiplicación",
    description: "Recoge alimentos en grupos iguales con tu ave.",
  },
]
export const familyRegions = {
  coast: "Costa",
  highlands: "Sierra",
  jungle: "Selva",
} as const
export const familyPlayPath = (id: string, participantId: string) =>
  "/panel/familia/jugar/" +
  encodeURIComponent(id) +
  "/" +
  encodeURIComponent(participantId)

export const familyHomePath = (childId?: string | null) =>
  "/panel" + (childId ? "?hijo=" + encodeURIComponent(childId) : "")
