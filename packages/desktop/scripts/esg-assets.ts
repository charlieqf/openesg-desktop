import { cp, mkdir, readdir, rm } from "node:fs/promises"
import { resolve, join } from "node:path"

// An explicit source is required. No network deployment or customer documents.
const source = process.argv[2]
if (!source) throw new Error("ESG_SOURCE_REQUIRED")
const target = resolve(import.meta.dir, "../resources/esg")
const packageRoot = resolve(import.meta.dir, "..")
const sourcePath = resolve(source)
if (!target.startsWith(`${packageRoot}\\`) && !target.startsWith(`${packageRoot}/`)) throw new Error("ESG_TARGET_OUTSIDE_PACKAGE")
if (sourcePath === target) throw new Error("ESG_SOURCE_IS_TARGET")
await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })
await cp(sourcePath, target, { recursive: true, force: true })
await rm(join(target, "_headers"), { force: true })
await cp(resolve(import.meta.dir, "../prototype/bridge.js"), join(target, "assets/desktop-bridge.js"))
const files = (await readdir(target)).filter((file) => file.endsWith(".html"))
await Promise.all(files.map(async (name) => {
  const file = Bun.file(join(target, name))
  const html = await file.text()
  await Bun.write(file, html.replace("</head>", '<script defer src="assets/desktop-bridge.js?v=panel-20260911"></script>\n</head>'))
}))
console.log(`ESG assets prepared: ${files.length} local pages`)
