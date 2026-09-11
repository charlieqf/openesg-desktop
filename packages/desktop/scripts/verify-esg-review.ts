import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { createRequire } from "node:module"
import { join, resolve, sep } from "node:path"

const require = createRequire(import.meta.url)
const builder = createRequire(require.resolve("electron-builder/package.json"))
const lib = createRequire(builder.resolve("app-builder-lib/package.json"))
const asar = lib("@electron/asar") as {
  listPackage(path: string): string[]
  extractFile(path: string, file: string): Buffer
}
const root = resolve(import.meta.dir, "..")
const output = resolve(root, "dist/review/win-unpacked")
const archive = join(output, "resources/app.asar")
const files = asar.listPackage(archive).map((file) => file.replaceAll("\\", "/").replace(/^\//, ""))
const read = (file: string) => asar.extractFile(archive, file.replaceAll("/", sep))
const metadata = JSON.parse(read("package.json").toString())
assert.equal(metadata.name, "openesg-review")
assert.equal(metadata.version, "0.1.0")
assert.equal(metadata.main, "out/main/index.js")

const forbidden = files.filter((file) =>
  /(^|\/)(auth\.json|\.env(?:\..+)?|\.git|\.esg-prototype-runtime)(\/|$)/i.test(file) ||
  /\.(sqlite|db|log)$/i.test(file) ||
  (file.startsWith("out/") && file.endsWith(".map")) ||
  !["out", "resources", "node_modules", "package.json"].includes(file.split("/")[0]),
)
assert.equal(forbidden.length, 0, `Archive includes unapproved files: ${forbidden.slice(0, 12).join(", ")}`)
assert.ok(!existsSync(join(output, "resources/app-update.yml")), "Unexpected update feed")

for (const file of ["out/main/index.js", "out/main/sidecar.js", "out/preload/index.js", "out/renderer/index.html"]) {
  assert.ok(read(file).length > 0, `Missing runtime: ${file}`)
}
assert.ok(files.some((file) => file.includes("@lydell/node-pty-win32-x64") && file.endsWith(".node")))
assert.ok(files.some((file) => file.includes("@parcel/watcher-win32-x64") && file.endsWith(".node")))
assert.ok(files.filter((file) => file.startsWith("out/main/chunks/") && file.endsWith(".wasm")).length >= 4)

const hash = (buffer: Buffer) => createHash("sha256").update(buffer).digest("hex")
function verifyAssets(directory: string) {
  let count = 0
  for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
    const relative = `${directory}/${entry.name}`
    if (entry.isDirectory()) {
      count += verifyAssets(relative)
      continue
    }
    assert.equal(hash(read(relative)), hash(readFileSync(join(root, relative))), `Changed asset: ${relative}`)
    count++
  }
  return count
}
const assets = verifyAssets("resources/esg")
const pages = files.filter((file) => /^resources\/esg\/[^/]+\.html$/.test(file)).length
assert.equal(pages, 15)
const main = read("out/main/index.js").toString()
assert.ok(main.includes('"OpenESGReview"'))
assert.ok(main.indexOf('OPENCODE_ESG_REVIEW = "1"') < main.indexOf("const esgRoot"))
assert.ok(existsSync(join(output, "OpenCode-LICENSE.txt")))
assert.ok(existsSync(join(output, "OpenESG-Review-README.md")))
console.log(JSON.stringify({ result: "pass", version: metadata.version, pages, assets, archiveEntries: files.length, excluded: ["credentials", "runtime databases", "logs", "application source maps", "updater feed"] }, null, 2))
