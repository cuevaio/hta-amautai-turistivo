// Versioned transcription of CNEB competence/capacity labels (PDF pages 135-149).
// Availability is a product constraint, not a restriction imposed by the CNEB.
export const curriculumCatalog = {
  version: "cneb-2016-v1",
  grades: [1, 2, 3, 4, 5, 6].map((grade) => ({
    grade,
    cycle: grade <= 2 ? "III" : grade <= 4 ? "IV" : "V",
    enabled: grade === 2,
  })),
  competencies: [
    {
      id: "quantity",
      label: "Resuelve problemas de cantidad",
      pdfPage: 135,
      capacities: [
        {
          id: "quantity-translate",
          label: "Traduce cantidades a expresiones numéricas",
        },
        {
          id: "quantity-communicate",
          label: "Comunica su comprensión sobre los números y las operaciones",
        },
        {
          id: "quantity-strategies",
          label: "Usa estrategias y procedimientos de estimación y cálculo",
        },
        {
          id: "quantity-argue",
          label:
            "Argumenta afirmaciones sobre las relaciones numéricas y las operaciones",
        },
      ],
    },
    {
      id: "patterns",
      label: "Resuelve problemas de regularidad, equivalencia y cambio",
      pdfPage: 138,
      capacities: [
        {
          id: "patterns-translate",
          label: "Traduce datos y condiciones a expresiones algebraicas",
        },
        {
          id: "patterns-communicate",
          label: "Comunica su comprensión sobre las relaciones algebraicas",
        },
        {
          id: "patterns-strategies",
          label:
            "Usa estrategias y procedimientos para encontrar reglas generales",
        },
        {
          id: "patterns-argue",
          label:
            "Argumenta afirmaciones sobre relaciones de cambio y equivalencia",
        },
      ],
    },
    {
      id: "data",
      label: "Resuelve problemas de gestión de datos e incertidumbre",
      pdfPage: 143,
      capacities: [
        {
          id: "data-represent",
          label:
            "Representa datos con gráficos y medidas estadísticas o probabilísticas",
        },
        {
          id: "data-communicate",
          label:
            "Comunica la comprensión de los conceptos estadísticos y probabilísticos",
        },
        {
          id: "data-strategies",
          label:
            "Usa estrategias y procedimientos para recopilar y procesar datos",
        },
        {
          id: "data-support",
          label:
            "Sustenta conclusiones o decisiones con base en información obtenida",
        },
      ],
    },
    {
      id: "geometry",
      label: "Resuelve problemas de forma, movimiento y localización",
      pdfPage: 146,
      capacities: [
        {
          id: "geometry-model",
          label: "Modela objetos con formas geométricas y sus transformaciones",
        },
        {
          id: "geometry-communicate",
          label:
            "Comunica su comprensión sobre las formas y relaciones geométricas",
        },
        {
          id: "geometry-strategies",
          label:
            "Usa estrategias y procedimientos para orientarse en el espacio",
        },
        {
          id: "geometry-argue",
          label: "Argumenta afirmaciones sobre relaciones geométricas",
        },
      ],
    },
  ],
  approaches: [
    { id: "rights", label: "Enfoque de derechos" },
    {
      id: "inclusion",
      label: "Enfoque inclusivo o de atención a la diversidad",
    },
    { id: "intercultural", label: "Enfoque intercultural" },
    { id: "gender", label: "Enfoque igualdad de género" },
    { id: "environment", label: "Enfoque ambiental" },
    { id: "common-good", label: "Enfoque orientación al bien común" },
    { id: "excellence", label: "Enfoque búsqueda de la excelencia" },
  ],
  sources: [
    {
      title: "Currículo Nacional de la Educación Básica",
      url: "https://www.minedu.gob.pe/curriculo/pdf/curriculo-nacional-de-la-educacion-basica.pdf",
    },
    {
      title:
        "Cartilla de planificación curricular para Primaria (documento de trabajo, 2017)",
      url: "https://www.minedu.gob.pe/curriculo/pdf/cartilla-planificacion-curricular.pdf",
    },
  ],
}
