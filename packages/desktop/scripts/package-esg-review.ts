import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "..")
const env: NodeJS.ProcessEnv = { ...process.env, OPENCODE_CHANNEL: "dev", CSC_IDENTITY_AUTO_DISCOVERY: "false" }
for (const key of Object.keys(env)) {
  if (key.startsWith("SENTRY_") || key.startsWith("VITE_SENTRY_") || key.startsWith("CSC_") || key === "WIN_CSC_LINK" || key === "WIN_CSC_KEY_PASSWORD") {
    delete env[key]
  }
}
env.CSC_IDENTITY_AUTO_DISCOVERY = "false"

for (const path of ["resources/esg/index.html", "resources/esg/assets/desktop-bridge.js", "resources/icons/icon.ico"]) {
  if (!existsSync(resolve(root, path))) throw new Error(`Missing prepared review asset: ${path}`)
}

function run(args: string[], cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, env, stdio: "inherit", windowsHide: true })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(["script/build-node.ts"], resolve(root, "../opencode"))
run(["--bun", "node_modules/electron-vite/bin/electron-vite.js", "build", "--config", "prototype/electron.review.config.ts", "--logLevel", "error"])
run(["--bun", "node_modules/electron-builder/out/cli/cli.js", "--win", "--x64", "--config", "prototype/electron-builder.review.config.ts", "--publish", "never", ...process.argv.slice(2)])
