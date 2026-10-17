import { DatabaseSync } from "node:sqlite"
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { BufferJSON } from "@whiskeysockets/baileys"
export type Job = {
  id: string
  phone: string
  text: string
  expiresAt: number
  status: string
  providerId: string | null
  jid: string | null
}
export function createStore(path: string, encryptionKey: string) {
  if (!/^[a-f0-9]{64}$/i.test(encryptionKey))
    throw new Error("Invalid authentication encryption key")
  const key = Buffer.from(encryptionKey, "hex"),
    db = new DatabaseSync(path)
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS auth(k TEXT PRIMARY KEY,v TEXT NOT NULL); CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,phone TEXT NOT NULL,text TEXT NOT NULL,expiresAt INTEGER NOT NULL,status TEXT NOT NULL,providerId TEXT,jid TEXT,createdAt INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS jobs_provider ON jobs(providerId);"
  )
  // A crash after socket submission has an ambiguous outcome. Do not resend it.
  db.exec("UPDATE jobs SET status='uncertain' WHERE status='sending'")
  function seal(value: unknown) {
    const iv = randomBytes(12),
      cipher = createCipheriv("aes-256-gcm", key, iv)
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(value, BufferJSON.replacer), "utf8"),
      cipher.final(),
    ])
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
      "base64"
    )
  }
  function open<T>(value: string): T {
    const data = Buffer.from(value, "base64"),
      decipher = createDecipheriv("aes-256-gcm", key, data.subarray(0, 12))
    decipher.setAuthTag(data.subarray(12, 28))
    return JSON.parse(
      Buffer.concat([
        decipher.update(data.subarray(28)),
        decipher.final(),
      ]).toString(),
      BufferJSON.reviver
    ) as T
  }
  return {
    db,
    getAuth<T>(id: string): T | null {
      const row = db.prepare("SELECT v FROM auth WHERE k=?").get(id) as
        { v: string } | undefined
      return row ? open<T>(row.v) : null
    },
    setAuth(id: string, value: unknown) {
      if (value == null) db.prepare("DELETE FROM auth WHERE k=?").run(id)
      else
        db.prepare("INSERT OR REPLACE INTO auth(k,v) VALUES(?,?)").run(
          id,
          seal(value)
        )
    },
    clearAuth() {
      db.exec("DELETE FROM auth")
    },
    find(id: string) {
      return db.prepare("SELECT * FROM jobs WHERE id=?").get(id) as
        Job | undefined
    },
    insert(input: {
      id: string
      phone: string
      text: string
      expiresAt: number
    }) {
      db.prepare(
        "INSERT OR IGNORE INTO jobs(id,phone,text,expiresAt,status,createdAt) VALUES(?,?,?,?,'accepted',?)"
      ).run(input.id, input.phone, input.text, input.expiresAt, Date.now())
      return this.find(input.id)!
    },
    next() {
      db.prepare(
        "UPDATE jobs SET status='expired',text='' WHERE status='accepted' AND expiresAt<=?"
      ).run(Date.now())
      return db
        .prepare(
          "SELECT * FROM jobs WHERE status='accepted' AND expiresAt>? ORDER BY createdAt LIMIT 1"
        )
        .get(Date.now()) as Job | undefined
    },
    sending(id: string, providerId: string, jid: string) {
      return !!db
        .prepare(
          "UPDATE jobs SET status='sending',providerId=?,jid=? WHERE id=? AND status='accepted' AND expiresAt>?"
        )
        .run(providerId, jid, id, Date.now()).changes
    },
    status(id: string, status: string) {
      db.prepare(
        "UPDATE jobs SET status=? WHERE id=? AND status NOT IN ('read','delivered')"
      ).run(status, id)
    },
    receipt(providerId: string, status: string) {
      db.prepare(
        "UPDATE jobs SET status=? WHERE providerId=? AND status IN ('sending','uncertain','sent','delivered') AND (status!='delivered' OR ?='read')"
      ).run(status, providerId, status)
    },
    prune() {
      db.prepare("UPDATE jobs SET text='' WHERE expiresAt<?").run(
        Date.now() - 86400000
      )
      // IDs remain as deduplication tombstones; never permit an old ID to send again.
    },
  }
}
export type Store = ReturnType<typeof createStore>
