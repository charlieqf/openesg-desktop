import { describe, expect, test } from "bun:test"
import { readdir } from "node:fs/promises"
import config from "./electron-builder.review.config"

const runtime = await Bun.file(new URL("./review-runtime.ts", import.meta.url)).text()
const entry = await Bun.file(new URL("./review-entry.ts", import.meta.url)).text()
const main = await Bun.file(new URL("../src/main/index.ts", import.meta.url)).text()
const build = await Bun.file(new URL("./electron.review.config.ts", import.meta.url)).text()
const updater = await Bun.file(new URL("../src/main/constants.ts", import.meta.url)).text()
const assets = new URL("../resources/esg/", import.meta.url)

describe("internal Windows review distribution", () => {
  test("uses a separate installer identity, version and no registered protocol", () => {
    expect(config.appId).toBe("com.openesg.review")
    expect(config.productName).toBe("OpenESG Review")
    expect(config.extraMetadata?.version).toBe("0.1.0")
    expect(config.protocols).toBeUndefined()
    expect(main).toContain('review ? "com.openesg.review"')
    expect(main).toContain('review ? "OpenESG Review"')
  })
  test("is per-user and preserves review data on uninstall", () => {
    expect(config.nsis?.perMachine).toBe(false)
    expect(config.nsis?.allowElevation).toBe(false)
    expect(config.nsis?.deleteAppDataOnUninstall).toBe(false)
    expect(config.nsis?.runAfterFinish).toBe(false)
  })
  test("cannot publish or enable the upstream updater", () => {
    expect(config.publish).toBeNull()
    expect(runtime).toContain('OPENCODE_DISABLE_AUTOUPDATE = "true"')
    expect(updater).toContain('process.env.OPENCODE_ESG_REVIEW !== "1"')
    expect(build).toContain('JSON.stringify("dev")')
  })
  test("boots ESG before the desktop entry without external launch environment", () => {
    expect(entry.indexOf('import "./review-runtime"')).toBeLessThan(entry.indexOf('import "../src/main/index"'))
    expect(runtime).toContain('join(app.getPath("appData"), "OpenESGReview")')
    expect(runtime).toContain('OPENCODE_SIDECAR_V2 = "0"')
    expect(runtime).toContain('key.startsWith("OPENCODE_")')
    expect(runtime).toContain('OPENCODE_DISABLE_PROJECT_CONFIG = "true"')
  })
  test("keeps packaged assets separate from the running development build", () => {
    expect(build).toContain('resolve("out-review")')
    expect(config.files).toContainEqual({ from: "out-review", to: "out", filter: ["**/*", "!**/*.map"] })
    expect(config.files).toContain("resources/esg/**/*.html")
    expect(config.files).toContain("resources/esg/assets/**/*")
    expect(JSON.stringify(config.files)).not.toContain(".esg-prototype-runtime")
    expect(config.extraMetadata?.main).toBe("out/main/index.js")
  })
  test("vendors the complete desktop prototype without web-host deployment files", async () => {
    const files = (await readdir(assets, { recursive: true })).map((file) => file.replaceAll("\\", "/"))
    const pages = files.filter((file) => file.endsWith(".html"))
    expect(pages).toHaveLength(15)
    expect(files).not.toContain("_headers")
    expect(files).toContain("assets/demo-data.js")
    expect(files).toContain("assets/desktop-bridge.js")
    expect(files).toContain("assets/demo-files/drafts/ENV-001.md")
    for (const page of pages) {
      const html = await Bun.file(new URL(page, assets)).text()
      expect(html.match(/assets\/desktop-bridge\.js\?v=panel-20260911/g)).toHaveLength(1)
    }
  })
})
