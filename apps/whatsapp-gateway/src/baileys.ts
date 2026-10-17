import makeWASocket, {
  initAuthCreds,
  proto,
  DisconnectReason,
  Browsers,
  generateMessageIDV2,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataTypeMap,
  type WAMessageContent,
} from "@whiskeysockets/baileys"
import pino from "pino"
import type { Store } from "./store.ts"
export function connectWhatsApp(store: Store, makeSocket = makeWASocket) {
  let pairingCode: string | null = null
  let lastPairRequest = 0
  let lastPairPhone = ""
  let pairingInFlight = false
  let connection = "starting",
    qr: string | null = null,
    stopped = false,
    retries = 0,
    timer: ReturnType<typeof setTimeout> | undefined
  let socket: ReturnType<typeof makeWASocket> | undefined
  function start() {
    pairingCode = null
    if (stopped) return
    connection = "connecting"
    const creds = store.getAuth<AuthenticationCreds>("creds") || initAuthCreds()
    const keys: AuthenticationState["keys"] = {
      async get(type, ids) {
        const result: Record<string, SignalDataTypeMap[typeof type]> = {}
        for (const id of ids) {
          let value = store.getAuth<SignalDataTypeMap[typeof type]>(
            type + ":" + id
          )
          if (type === "app-state-sync-key" && value)
            value = proto.Message.AppStateSyncKeyData.fromObject(
              value as Record<string, unknown>
            ) as unknown as SignalDataTypeMap[typeof type]
          if (value) result[id] = value
        }
        return result
      },
      async set(data) {
        store.db.exec("BEGIN IMMEDIATE")
        try {
          for (const [type, values] of Object.entries(data))
            for (const [id, value] of Object.entries(values || {}))
              store.setAuth(type + ":" + id, value)
          store.db.exec("COMMIT")
        } catch (e) {
          store.db.exec("ROLLBACK")
          throw e
        }
      },
    }
    store.setAuth("creds", creds)
    const current = makeSocket({
      auth: { creds, keys },
      logger: pino({ level: "silent" }),
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: false,
      getMessage: async (key) => {
        const row = store.db
          .prepare("SELECT text FROM jobs WHERE providerId=?")
          .get(key.id || "") as { text: string } | undefined
        return row?.text
          ? ({ conversation: row.text } as WAMessageContent)
          : undefined
      },
    })
    socket = current
    current.ev.on("creds.update", () => {
      if (current === socket) store.setAuth("creds", creds)
    })
    current.ev.on("connection.update", (update) => {
      if (current !== socket || stopped) return
      if (update.qr) {
        qr = update.qr
        connection = "needs_pairing"
      }
      if (update.connection === "open") {
        connection = "connected"
        pairingCode = null
        qr = null
        retries = 0
      }
      if (update.connection === "close") {
        qr = null
        pairingCode = null
        const code = (
          update.lastDisconnect?.error as
            { output?: { statusCode?: number } } | undefined
        )?.output?.statusCode
        if (code === DisconnectReason.loggedOut) {
          connection = "logged_out"
          return
        }
        connection = "disconnected"
        clearTimeout(timer)
        timer = setTimeout(
          start,
          Math.min(60000, 1000 * 2 ** Math.min(retries++, 6))
        )
      }
    })
    current.ev.on("messages.update", (updates) => {
      for (const { key, update } of updates) {
        const status = update.status
        if (key.id && status != null) {
          if (status >= proto.WebMessageInfo.Status.READ)
            store.receipt(key.id, "read")
          else if (status >= proto.WebMessageInfo.Status.DELIVERY_ACK)
            store.receipt(key.id, "delivered")
          else if (status >= proto.WebMessageInfo.Status.SERVER_ACK)
            store.receipt(key.id, "sent")
          else if (status === proto.WebMessageInfo.Status.ERROR)
            store.receipt(key.id, "failed")
        }
      }
    })
  }
  let busy = false
  async function tick() {
    if (busy || connection !== "connected" || !socket) return
    busy = true
    const job = store.next()
    try {
      if (!job) return
      const jid = job.phone.slice(1) + "@s.whatsapp.net"
      const messageId = generateMessageIDV2(socket.user?.id)
      if (!store.sending(job.id, messageId, jid)) return
      try {
        await socket.sendMessage(jid, { text: job.text }, { messageId })
        store.status(job.id, "sent")
      } catch {
        store.status(job.id, "uncertain")
      }
    } finally {
      busy = false
    }
  }
  const interval = setInterval(
    () => void tick().catch(() => console.info("gateway_tick_failed")),
    3000
  )
  const prune = setInterval(() => store.prune(), 3600000)
  start()
  return {
    state: () => ({
      connection,
      qr,
      pairingCode: Date.now() - lastPairRequest < 120000 ? pairingCode : null,
      pendingPhone: !socket?.authState.creds.registered
        ? store.getAuth<AuthenticationCreds>("creds")?.me?.id.split("@")[0] ||
          ""
        : "",
    }),
    async pair(phone: string) {
      if (!/^[1-9][0-9]{7,14}$/.test(phone))
        throw new Error(
          "Escribe el número con código de país, sin + ni espacios."
        )
      if (!socket || !qr || socket.authState.creds.registered)
        throw new Error(
          "La conexión aún no está lista. Actualiza el estado o genera una nueva vinculación."
        )
      if (
        pairingCode &&
        lastPairPhone === phone &&
        Date.now() - lastPairRequest < 120000
      )
        return pairingCode
      if (pairingInFlight || Date.now() - lastPairRequest < 60000)
        throw new Error("Espera un minuto antes de solicitar otro código.")
      pairingInFlight = true
      lastPairRequest = Date.now()
      lastPairPhone = phone
      try {
        const code = await socket.requestPairingCode(phone)
        if (!/^[A-Z0-9]{8}$/i.test(code))
          throw new Error("No se pudo obtener un código válido.")
        pairingCode = code.toUpperCase()
        return pairingCode
      } finally {
        pairingInFlight = false
      }
    },
    reset() {
      clearTimeout(timer)
      const previous = socket
      socket = undefined
      previous?.end(new Error("admin_relink"))
      pairingCode = null
      store.clearAuth()
      start()
    },
    stop() {
      stopped = true
      clearTimeout(timer)
      clearInterval(interval)
      clearInterval(prune)
      socket?.end(new Error("shutdown"))
    },
  }
}
