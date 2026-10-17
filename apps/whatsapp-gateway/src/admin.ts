import { createServer } from "node:http"
import QRCode from "qrcode"
export type WhatsAppAdmin = {
  state(): {
    connection: string
    qr: string | null
    pairingCode: string | null
    pendingPhone?: string
  }
  pair(phone: string): Promise<string>
  reset(): void
}
export function adminServer(whatsapp: WhatsAppAdmin) {
  let error = ""
  const escape = (s: string) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
  return createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store")
    res.setHeader("X-Content-Type-Options", "nosniff")
    res.setHeader("Referrer-Policy", "same-origin")
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'"
    )
    if (
      req.method === "POST" &&
      (req.url === "/pair" || req.url === "/reset")
    ) {
      let sameOrigin = false
      try {
        sameOrigin =
          !!req.headers.origin &&
          new URL(req.headers.origin).host === req.headers.host
      } catch {
        /* Reject malformed origins. */
      }
      if (!sameOrigin) {
        res.writeHead(403)
        res.end()
        return
      }
      if (req.url === "/reset") {
        whatsapp.reset()
        error = ""
      } else {
        try {
          let body = ""
          for await (const chunk of req) {
            body += chunk.toString()
            if (body.length > 256)
              throw new Error("Solicitud demasiado grande.")
          }
          const phone = new URLSearchParams(body).get("phone") || ""
          await whatsapp.pair(phone)
          error = ""
        } catch {
          error =
            "No pudimos generar el código. Usa el número con código de país (sin + ni espacios), actualiza el estado y espera un minuto antes de reintentar."
        }
      }
      res.writeHead(303, { Location: "/" })
      res.end()
      return
    }
    const { connection, qr, pairingCode, pendingPhone } = whatsapp.state()
    if (req.url === "/qr.png" && qr && req.method === "GET") {
      res.setHeader("Content-Type", "image/png")
      res.end(await QRCode.toBuffer(qr, { width: 360, margin: 3 }))
      return
    }
    if (req.method !== "GET" || req.url !== "/") {
      res.writeHead(404)
      res.end()
      return
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8")
    const code = pairingCode?.match(/.{1,4}/g)?.join("-")
    res.end(
      '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Amautai · WhatsApp</title><style>body{font:16px system-ui;max-width:560px;margin:40px auto;padding:20px}img{max-width:100%;height:auto}button,input{font:inherit;padding:12px}input{width:100%;box-sizing:border-box;margin:8px 0}form{margin:20px 0}strong{font:36px monospace;letter-spacing:3px}details{margin-top:24px}</style><h1>WhatsApp de Amautai</h1><p>Estado: ' +
        escape(connection) +
        '</p><p><a href="/">Actualizar estado</a></p>' +
        (error ? '<p role="alert">' + escape(error) + "</p>" : "") +
        (code
          ? "<h2>Código de vinculación</h2><p><strong>" +
            escape(code) +
            "</strong></p><p>En WhatsApp: Dispositivos vinculados → Vincular dispositivo → Vincular con número de teléfono. Ingresa este código.</p>"
          : "") +
        (connection !== "connected" && connection !== "logged_out"
          ? '<h2>Vincular con código</h2><form method="post" action="/pair"><label for="phone">Número emisor con código de país</label><input id="phone" name="phone" type="tel" inputmode="numeric" pattern="[1-9][0-9]{7,14}" minlength="8" maxlength="15" placeholder="51987654321" autocomplete="tel" value="' +
            escape(pendingPhone || "") +
            '" required><p>Solo números, sin + ni espacios.</p><button>Obtener código de 8 caracteres</button></form>'
          : "") +
        (qr && !code
          ? '<details><summary>Usar QR</summary><img src="/qr.png" alt="QR para vincular el número emisor"></details>'
          : "") +
        (connection === "logged_out"
          ? '<form method="post" action="/reset"><button>Generar una nueva vinculación</button></form>'
          : "") +
        "</html>"
    )
  })
}
