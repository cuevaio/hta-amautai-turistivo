export type WelcomeInput = {
  tenantId: string
  userId: string
  phone: string
  role: "teacher" | "parent"
  locale: "es-PE" | "quy-PE" | "ay-PE"
  createdAt: number
}

// Initial translations, pending bilingual human review.
export function welcomeMessage(input: Pick<WelcomeInput, "role" | "locale">) {
  const messages = {
    "es-PE": {
      title: "¡Bienvenido a Amautai!",
      teacher: "Crea experiencias de aprendizaje para tus estudiantes.",
      parent: "Acompaña el aprendizaje de tus hijos con juegos educativos.",
      link: "Comienza aquí:",
      settings: "Puedes cambiar tus avisos de WhatsApp en Notificaciones.",
    },
    "quy-PE": {
      title: "¡Amautaiman allin hamusqa!",
      teacher: "Yachakuqnikikunapaq yachay ruraykunata ruway.",
      parent: "Yachachikuq pukllaykunawan wawaykikunapa yachayninta yanapay.",
      link: "Kaypi qallariy:",
      settings: "WhatsApp willakuykunata Willakuykunapi tikrayta atinki.",
    },
    "ay-PE": {
      title: "¡Amautairu suma jutäwi!",
      teacher: "Yatiqirinakamataki yatiqawi lurawinaka wakicham.",
      parent: "Yatichañ anatañanakampi wawanakamana yatiqawipa yanaptʼam.",
      link: "Akana qalltam:",
      settings: "WhatsApp yatiyawinaka Yatiyawinakana mayjtʼayasmawa.",
    },
  }[input.locale]
  return {
    title: messages.title,
    body: [
      messages.title,
      messages[input.role],
      messages.link + " https://amautai.turistivo.com/panel",
      messages.settings,
    ].join("\n\n"),
  }
}
