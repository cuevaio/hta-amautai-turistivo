import { adminServer } from "./admin.ts"
import { mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { createStore } from "./store.ts"
import { connectWhatsApp } from "./baileys.ts"
import { apiServer } from "./http.ts"
const dir =
  process.env.DATA_DIR || fileURLToPath(new URL("../.data/", import.meta.url))
mkdirSync(dir, { recursive: true, mode: 0o700 })
const store = createStore(
  join(dir, "gateway.sqlite"),
  process.env.AUTH_ENCRYPTION_KEY || ""
)
const whatsapp = connectWhatsApp(store)
const api = apiServer(store, process.env.GATEWAY_TOKEN || "", whatsapp.state)
api.listen(3000, "0.0.0.0", () => console.info("gateway_api_ready"))
// Administration is exposed only on VPS loopback through SSH.
const admin = adminServer(whatsapp)
admin.listen(3001, "0.0.0.0", () => console.info("gateway_admin_ready"))
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    whatsapp.stop()
    api.close()
    admin.close()
    setTimeout(() => process.exit(0), 1000)
  })
