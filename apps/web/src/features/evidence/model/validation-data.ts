export interface SurveyOption {
  label: string
  count: number
}

export interface SurveyChart {
  title: string
  options: readonly SurveyOption[]
}

export interface SurveyResults {
  audience: "teachers" | "families"
  responses: number
  formUrl: string
  charts: readonly SurveyChart[]
}

// Aggregated directly from the response-linked Google Sheets on October 18, 2026.
// Individual answers and required contact fields are deliberately excluded.
export const surveyResults: readonly SurveyResults[] = [
  {
    audience: "teachers",
    responses: 28,
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLScCEOnoUi7v-eVGhhQGighLfkUTN3nrFdftYsZTte4GRvvknA/viewform",
    charts: [
      {
        title: "Grado de primaria",
        options: [
          { label: "Primero de primaria", count: 7 },
          { label: "Segundo de primaria", count: 4 },
          { label: "Tercero de primaria", count: 3 },
          { label: "Cuarto de primaria", count: 5 },
          { label: "Quinto de primaria", count: 3 },
          { label: "Sexto de primaria", count: 6 },
        ],
      },
      {
        title: "Frecuencia de apoyo",
        options: [
          { label: "Nunca", count: 0 },
          { label: "Rara vez", count: 3 },
          { label: "A veces", count: 7 },
          { label: "Frecuentemente", count: 11 },
          { label: "Siempre", count: 7 },
          { label: "No lo pude observar", count: 0 },
        ],
      },
      {
        title: "Dificultad principal",
        options: [
          { label: "Comprender qué pedía el problema", count: 11 },
          { label: "Comprender cantidades, números o conteo", count: 3 },
          { label: "Elegir o realizar una operación", count: 3 },
          { label: "Comprender figuras o medidas", count: 4 },
          { label: "Interpretar tablas o gráficos", count: 3 },
          { label: "Otra dificultad", count: 1 },
          { label: "No observé dificultades", count: 3 },
        ],
      },
      {
        title: "Primera acción",
        options: [
          {
            label: "Volví a explicar o practicar con el estudiante",
            count: 17,
          },
          { label: "Cambié la actividad o el material", count: 2 },
          { label: "Busqué un video, aplicación o juego", count: 3 },
          { label: "Pedí apoyo a otra persona", count: 0 },
          { label: "No hice nada adicional", count: 1 },
          { label: "Otra acción", count: 0 },
          { label: "No hubo dificultad", count: 5 },
        ],
      },
      {
        title: "Tiempo dedicado",
        options: [
          { label: "Menos de 10 minutos", count: 9 },
          { label: "Entre 10 y 30 minutos", count: 11 },
          { label: "Entre 31 y 60 minutos", count: 3 },
          { label: "Más de 60 minutos", count: 2 },
          { label: "No dediqué tiempo adicional", count: 0 },
          { label: "No hubo dificultad", count: 3 },
          { label: "No lo recuerdo", count: 0 },
        ],
      },
    ],
  },
  {
    audience: "families",
    responses: 56,
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLScM9I69A8q4SC6l3aEp1bb7LUJuXN_vr3pM4tVtuyeh2B4zqA/viewform",
    charts: [
      {
        title: "Grado de primaria",
        options: [
          { label: "Primero de primaria", count: 11 },
          { label: "Segundo de primaria", count: 12 },
          { label: "Tercero de primaria", count: 3 },
          { label: "Cuarto de primaria", count: 1 },
          { label: "Quinto de primaria", count: 20 },
          { label: "Sexto de primaria", count: 9 },
        ],
      },
      {
        title: "Frecuencia de apoyo",
        options: [
          { label: "Nunca", count: 3 },
          { label: "Rara vez", count: 20 },
          { label: "A veces", count: 27 },
          { label: "Frecuentemente", count: 4 },
          { label: "Siempre", count: 2 },
          { label: "No lo pude observar", count: 0 },
        ],
      },
      {
        title: "Dificultad principal",
        options: [
          { label: "Comprender qué pedía el problema", count: 14 },
          { label: "Comprender cantidades, números o conteo", count: 3 },
          { label: "Elegir o realizar una operación", count: 3 },
          { label: "Comprender figuras o medidas", count: 9 },
          { label: "Interpretar tablas o gráficos", count: 4 },
          { label: "Otra dificultad", count: 11 },
          { label: "No observé dificultades", count: 12 },
        ],
      },
      {
        title: "Primera acción",
        options: [
          { label: "Le expliqué o practiqué con él o ella", count: 26 },
          { label: "Busqué un video, aplicación o juego", count: 5 },
          { label: "Pedí apoyo al docente o a un familiar", count: 5 },
          { label: "Contraté clases o apoyo particular", count: 6 },
          { label: "No hice nada adicional", count: 2 },
          { label: "Otra acción", count: 2 },
          { label: "No hubo dificultad", count: 10 },
        ],
      },
      {
        title: "Tiempo dedicado",
        options: [
          { label: "Menos de 10 minutos", count: 12 },
          { label: "Entre 10 y 30 minutos", count: 23 },
          { label: "Entre 31 y 60 minutos", count: 4 },
          { label: "Más de 60 minutos", count: 5 },
          { label: "No dediqué tiempo adicional", count: 0 },
          { label: "No hubo dificultad", count: 9 },
          { label: "No lo recuerdo", count: 3 },
        ],
      },
    ],
  },
] as const
