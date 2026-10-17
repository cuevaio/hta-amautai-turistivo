import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const slash = (value) => value.replaceAll("\\", "/")
const worker = "apps/worker/src/"
const web = "apps/web/src/"

function kind(file) {
  if (file.startsWith(worker)) {
    const rest = file.slice(worker.length)
    const match = rest.match(
      /^modules\/([^/]+)\/(domain|application|infrastructure|http)\//
    )
    if (match) return { side: "backend", feature: match[1], layer: match[2] }
    if (/^modules\/[^/]+\/index\.ts$/.test(rest))
      return { side: "backend", layer: "entry" }
    if (["app.ts", "index.ts"].includes(rest))
      return { side: "backend", layer: "composition" }
    if (rest.startsWith("shared/domain/"))
      return { side: "backend", layer: "domain" }
    if (rest.startsWith("shared/http/"))
      return { side: "backend", layer: "http" }
    if (rest === "shared/runtime.ts")
      return { side: "backend", layer: "runtime" }
    return { side: "backend", layer: "unknown" }
  }
  if (file.startsWith(web)) {
    const rest = file.slice(web.length)
    const match = rest.match(/^features\/([^/]+)\/(api|model|ui)\//)
    if (match) return { side: "frontend", feature: match[1], layer: match[2] }
    if (/^features\/[^/]+\/index\.ts$/.test(rest))
      return { side: "frontend", feature: rest.split("/")[1], layer: "entry" }
    if (rest === "main.tsx" || rest.startsWith("app/"))
      return { side: "frontend", layer: "composition" }
    if (rest.startsWith("pages/")) return { side: "frontend", layer: "page" }
    if (rest.startsWith("shared/"))
      return { side: "frontend", layer: "shared", area: rest.split("/")[1] }
    return { side: "frontend", layer: "unknown" }
  }
  if (file.startsWith("apps/whatsapp-gateway/src/"))
    return { side: "gateway", layer: "service" }
  if (file.startsWith("packages/ui/src/"))
    return { side: "ui", layer: "shared" }
  if (file.startsWith("packages/contracts/src/"))
    return { side: "contracts", layer: "shared" }
  return { side: "unknown", layer: "unknown" }
}

function resolveImport(from, specifier, files) {
  let base
  if (specifier.startsWith("."))
    base = slash(
      path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier))
    )
  else if (specifier.startsWith("@/")) base = web + specifier.slice(2)
  else if (specifier === "@amautai/contracts")
    base = "packages/contracts/src/index.ts"
  else if (specifier.startsWith("@workspace/ui/"))
    base = "packages/ui/src/" + specifier.slice("@workspace/ui/".length)
  else return null
  const candidates = [
    base,
    base + ".ts",
    base + ".tsx",
    base + ".mjs",
    base + "/index.ts",
    base + "/index.tsx",
  ]
  const target = candidates.find((candidate) => files.has(candidate))
  if (target) return target
  if (base.endsWith(".css")) return false
  return undefined
}

export function checkArchitecture(files, manifests = []) {
  const errors = []
  const graph = new Map()
  const fail = (file, message) => errors.push(file + ": " + message)
  for (const [name, manifest] of manifests) {
    const deps = { ...manifest.dependencies, ...manifest.devDependencies }
    if (
      Object.keys(deps).some((dep) => dep === "axios" || dep === "node-fetch")
    )
      fail(name, "Native fetch policy forbids axios/node-fetch dependencies")
  }
  for (const [file, source] of files) {
    const from = kind(file)
    if (from.layer === "unknown")
      fail(
        file,
        "Unclassified source location; add an explicit architectural boundary"
      )
    graph.set(file, [])
    const ast = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    )
    function dependency(specifier) {
      if (/^(axios|node-fetch)(\/|$)/.test(specifier))
        fail(file, "Use native fetch through the transport/adapter")
      const target = resolveImport(file, specifier, files)
      if (target === undefined) {
        fail(file, "Unresolved local import " + specifier)
        return
      }
      if (target === false) return
      if (target === null) {
        if (
          from.side === "backend" &&
          ["domain", "application"].includes(from.layer)
        )
          fail(
            file,
            from.layer + " cannot import external package " + specifier
          )
        if (
          from.side === "backend" &&
          from.layer === "http" &&
          !/^(hono|zod|jose)(\/|$)/.test(specifier)
        )
          fail(file, "HTTP cannot import provider package " + specifier)
        if (from.side === "contracts" && specifier !== "zod")
          fail(file, "Contracts may only depend on Zod")
        if (
          from.side === "frontend" &&
          /^(node:|@workos|hono|@amautai\/worker|@cloudflare\/|wrangler)/.test(
            specifier
          )
        )
          fail(file, "Browser code cannot import server packages")
        return
      }
      graph.get(file).push(target)
      const to = kind(target)
      if (from.side === "gateway" && to.side !== "gateway")
        fail(file, "Gateway cannot import application internals")
      if (from.side === "backend") {
        if (!["backend", "contracts"].includes(to.side))
          fail(file, "Backend cannot depend on browser/UI code")
        if (
          from.feature &&
          to.feature &&
          from.feature !== to.feature &&
          to.layer !== "entry"
        )
          fail(file, "Cross-module import must use a public entrypoint")
        if (
          from.layer === "domain" &&
          !(to.side === "backend" && to.layer === "domain")
        )
          fail(file, "Domain dependency must stay inside domain")
        if (
          from.layer === "application" &&
          !(
            to.side === "backend" &&
            ["application", "domain"].includes(to.layer)
          )
        )
          fail(
            file,
            "Application cannot depend on transport, infrastructure, contracts, or bindings"
          )
        if (
          from.layer === "infrastructure" &&
          ["http", "composition", "entry"].includes(to.layer)
        )
          fail(file, "Infrastructure cannot depend on HTTP/composition")
        if (
          from.layer === "http" &&
          (["infrastructure", "composition", "entry"].includes(to.layer) ||
            (to.layer === "runtime" &&
              file !== worker + "shared/http/context.ts"))
        )
          fail(file, "HTTP must receive ports/services through composition")
        if (!from.feature && file.includes("/shared/") && to.feature)
          fail(file, "Shared code cannot depend on feature internals")
      }
      if (from.side === "frontend") {
        if (!["frontend", "ui", "contracts"].includes(to.side))
          fail(file, "Browser code cannot depend on Worker implementation")
        if (
          ["api", "model", "ui", "shared"].includes(from.layer) &&
          ["composition", "page"].includes(to.layer)
        )
          fail(file, "Feature/shared code cannot depend on app/pages")
        if (from.layer === "shared" && to.feature)
          fail(file, "Shared code cannot depend on a feature")
        if (to.feature && from.feature !== to.feature && to.layer !== "entry")
          fail(file, "Consumers must use the feature public index")
        if (from.feature === to.feature) {
          if (
            from.layer === "api" &&
            ["ui", "model", "entry"].includes(to.layer)
          )
            fail(file, "Feature API cannot depend on UI/model")
          if (from.layer === "model" && ["ui", "entry"].includes(to.layer))
            fail(file, "Model cannot depend on UI/its public barrel")
          if (from.layer === "ui" && to.layer === "api")
            fail(file, "UI must call a feature model hook, not its API")
        }
        if (
          ["ui", "page"].includes(from.layer) &&
          to.side === "frontend" &&
          to.layer === "shared" &&
          to.area === "api"
        )
          fail(file, "Presentation cannot import shared transport directly")
      }
      if (
        from.side === "ui" &&
        ["frontend", "backend", "contracts"].includes(to.side)
      )
        fail(file, "UI primitives cannot depend on app/contracts")
      if (from.side === "contracts" && to.side !== "contracts")
        fail(file, "Contracts cannot depend on application implementation")
    }
    function visit(node) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        dependency(node.moduleSpecifier.text)
      if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)
      )
        dependency(node.argument.literal.text)
      if (
        ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference) &&
        node.moduleReference.expression &&
        ts.isStringLiteral(node.moduleReference.expression)
      )
        dependency(node.moduleReference.expression.text)
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === "require"))
      ) {
        if (node.arguments[0] && ts.isStringLiteralLike(node.arguments[0]))
          dependency(node.arguments[0].text)
        else
          fail(file, "Nonliteral module loading cannot be dependency-checked")
      }
      if (ts.isIdentifier(node)) {
        const token = node.text
        if (
          ["backend", "frontend", "ui", "contracts"].includes(from.side) &&
          ["fetch", "XMLHttpRequest"].includes(token)
        ) {
          const handlerMember =
            file === worker + "index.ts" &&
            ((ts.isPropertyAssignment(node.parent) &&
              node.parent.name === node &&
              ts.isPropertyAccessExpression(node.parent.initializer) &&
              node.parent.initializer.name.text === "fetch") ||
              (ts.isPropertyAccessExpression(node.parent) &&
                node.parent.name === node &&
                ts.isPropertyAssignment(node.parent.parent) &&
                node.parent.parent.initializer === node.parent))
          const allowed =
            handlerMember ||
            (token === "fetch" &&
              (file === web + "shared/api/client.ts" ||
                (from.side === "backend" && from.layer === "infrastructure")))
          if (!allowed)
            fail(
              file,
              "Network access must use native fetch in the shared transport/backend adapter"
            )
        }
        if (
          from.side === "backend" &&
          ["domain", "application"].includes(from.layer) &&
          [
            "D1Database",
            "Request",
            "Response",
            "Headers",
            "Context",
            "Bindings",
            "WorkOS",
          ].includes(token)
        )
          fail(file, "Pure layer references runtime/framework symbol " + token)
      }
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "prepare" &&
        from.side === "backend" &&
        from.layer !== "infrastructure"
      )
        fail(file, "D1 queries belong in infrastructure repositories")
      if (
        ts.isElementAccessExpression(node) &&
        node.argumentExpression &&
        ts.isStringLiteralLike(node.argumentExpression)
      ) {
        const member = node.argumentExpression.text
        if (
          ["fetch", "XMLHttpRequest"].includes(member) &&
          !(
            member === "fetch" &&
            (file === web + "shared/api/client.ts" ||
              (from.side === "backend" && from.layer === "infrastructure"))
          )
        )
          fail(
            file,
            "Network access must use native fetch in the shared transport/backend adapter"
          )
        if (
          member === "prepare" &&
          from.side === "backend" &&
          from.layer !== "infrastructure"
        )
          fail(file, "D1 queries belong in infrastructure repositories")
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
  }
  const visited = new Set()
  const active = new Set()
  function cycle(file, chain) {
    if (active.has(file)) {
      fail(file, "Dependency cycle: " + [...chain, file].join(" -> "))
      return
    }
    if (visited.has(file)) return
    active.add(file)
    for (const next of graph.get(file) || []) cycle(next, [...chain, file])
    active.delete(file)
    visited.add(file)
  }
  for (const file of graph.keys()) cycle(file, [])
  return [...new Set(errors)]
}

function walk(directory, files) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(ts|tsx|mjs)$/.test(entry.name))
      files.set(slash(path.relative(root, full)), fs.readFileSync(full, "utf8"))
  }
}
export function inspectRepository() {
  const files = new Map()
  for (const directory of [
    worker,
    web,
    "apps/whatsapp-gateway/src/",
    "packages/ui/src/",
    "packages/contracts/src/",
  ])
    walk(path.join(root, directory), files)
  const manifests = [
    "package.json",
    "apps/web/package.json",
    "apps/worker/package.json",
    "apps/whatsapp-gateway/package.json",
    "packages/ui/package.json",
    "packages/contracts/package.json",
  ].map((file) => [
    file,
    JSON.parse(fs.readFileSync(path.join(root, file), "utf8")),
  ])
  return { files, errors: checkArchitecture(files, manifests) }
}
if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  const { files, errors } = inspectRepository()
  if (errors.length) {
    console.error(errors.join("\n"))
    process.exitCode = 1
  } else
    console.log(
      "Architecture checks passed (" +
        files.size +
        " source files; imports, cycles, boundaries, SQL and native fetch)."
    )
}
