import { cp, mkdir, readdir } from "node:fs/promises"
import { resolve, join } from "node:path"

// An explicit source is required. No network deployment or customer documents.
const source = process.argv[2]
if (!source) throw new Error("ESG_SOURCE_REQUIRED")
const target = resolve(import.meta.dir, "../resources/esg")
await mkdir(target, { recursive: true })
await cp(resolve(source), target, { recursive: true, force: false, errorOnExist: true })
await cp(resolve(import.meta.dir, "../prototype/bridge.js"), join(target, "assets/desktop-bridge.js"))
const files = (await readdir(target)).filter((file) => file.endsWith(".html"))
await Promise.all(files.map(async (name) => {
  const file = Bun.file(join(target, name))
  const html = await file.text()
  await Bun.write(file, html.replace("</head>", '<script defer src="assets/desktop-bridge.js?v=panel-20260911"></script>\n</head>'))
}))
console.log(`ESG assets prepared: ${files.length} local pages`)
