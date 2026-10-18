import { test } from "node:test"
import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { readFileSync } from "node:fs"
import { URL } from "node:url"
import { createApp } from "../src/app.ts"
function setup(identity = { user: { id: "alice", email: "alice@example.test" }, sessionId: "session" }) {
  const sqlite = new DatabaseSync(":memory:")
  sqlite.exec(readFileSync(new URL("../migrations/0001_projects.sql", import.meta.url), "utf8"))
  const DB = { prepare(sql) {
    let values = []
    return { bind(...args) { values = args; return this }, async run() { const result = sqlite.prepare(sql).run(...values); return { meta: { changes: Number(result.changes) } } }, async first() { return sqlite.prepare(sql).get(...values) ?? null }, async all() { return { results: sqlite.prepare(sql).all(...values) } } }
  } }
  let current = identity
  const app = createApp(async () => current)
  const env = { DB, APP_ORIGINS: "https://amautai.test", WORKOS_CLIENT_ID: "client_test" }
  async function request(path, method = "GET", body, origin = "https://amautai.test") {
    return app.request("https://amautai.test" + path, { method, headers: { Origin: origin, "X-Amautai-Request": "1", "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, env)
  }
  return { request, sqlite, user(value) { current = value } }
}
const project = { name: "Amautai test", description: "End to end persistence", status: "idea" }
test("CRUD persists, reads, updates, rejects stale writes and soft deletes", async () => {
  const s = setup()
  assert.equal((await s.request("/api/health")).status, 200)
  const created = await s.request("/api/projects", "POST", project)
  assert.equal(created.status, 201)
  const item = (await created.json()).project
  assert.equal((await (await s.request("/api/projects/" + item.id)).json()).project.name, project.name)
  assert.equal((await (await s.request("/api/projects")).json()).projects.length, 1)
  const updated = await s.request("/api/projects/" + item.id, "PUT", { ...project, status: "building", version: 1 })
  assert.equal(updated.status, 200)
  assert.equal((await updated.json()).project.version, 2)
  assert.equal((await s.request("/api/projects/" + item.id, "PUT", { ...project, version: 1 })).status, 409)
  assert.equal((await s.request("/api/projects/" + item.id, "DELETE", { version: 1 })).status, 409)
  assert.equal((await s.request("/api/projects/" + item.id, "DELETE", { version: 2 })).status, 200)
  assert.equal((await s.request("/api/projects/" + item.id)).status, 404)
  assert.equal((await (await s.request("/api/projects")).json()).projects.length, 0)
  assert.ok(s.sqlite.prepare("SELECT deleted_at FROM projects WHERE id=?").get(item.id).deleted_at)
})
test("tenants cannot list, read, update or delete other tenant projects", async () => {
  const s = setup()
  const id = (await (await s.request("/api/projects", "POST", project)).json()).project.id
  s.user({ user: { id: "bob", email: "bob@example.test" }, sessionId: "session_b" })
  assert.equal((await (await s.request("/api/projects")).json()).projects.length, 0)
  assert.equal((await s.request("/api/projects/" + id)).status, 404)
  assert.equal((await s.request("/api/projects/" + id, "PUT", { ...project, version: 1 })).status, 404)
  assert.equal((await s.request("/api/projects/" + id, "DELETE", { version: 1 })).status, 404)
})
test("verified organization membership shares a workspace; other orgs are isolated", async () => {
  const s = setup({ user: { id: "alice" }, organizationId: "org_a", sessionId: "s" })
  await s.request("/api/projects", "POST", project)
  s.user({ user: { id: "bob" }, organizationId: "org_a", sessionId: "s2" })
  assert.equal((await (await s.request("/api/projects")).json()).projects.length, 1)
  s.user({ user: { id: "bob" }, organizationId: "org_b", sessionId: "s3" })
  assert.equal((await (await s.request("/api/projects")).json()).projects.length, 0)
})
test("Zod rejects invalid inputs and tenant spoofing; prepared statements store SQL-like text", async () => {
  const s = setup()
  for (const body of [{ ...project, name: "ab" }, { ...project, status: "invalid" }, { ...project, tenant_id: "user:bob" }, { ...project, description: "a".repeat(1001) }]) assert.equal((await s.request("/api/projects", "POST", body)).status, 400)
  const name = "Robert'); DROP TABLE projects;--"
  assert.equal((await s.request("/api/projects", "POST", { ...project, name })).status, 201)
  assert.equal((await (await s.request("/api/projects")).json()).projects[0].name, name)
})
test("anonymous, forged cookies, cross-origin mutations and invalid OAuth destinations are rejected", async () => {
  const s = setup(null)
  assert.equal((await s.request("/api/projects")).status, 401)
  assert.equal((await s.request("/api/projects", "POST", project, "https://evil.test")).status, 403)
  assert.equal((await s.request("/api/auth/oauth/github?origin=https://evil.test")).status, 400)
  assert.equal((await s.request("/callback?code=forged&state=forged")).headers.get("location"), "/iniciar-sesion?error=oauth_expired")
})
