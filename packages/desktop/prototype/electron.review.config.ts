import { copyFile, mkdir, readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { defineConfig } from "electron-vite"
import appPlugin from "@opencode-ai/app/vite"
import config from "../electron.vite.config"

const output = resolve("out-review")

export default defineConfig({
  main: {
    ...config.main,
    define: { "import.meta.env.OPENCODE_CHANNEL": JSON.stringify("dev") },
    build: {
      ...config.main?.build,
      outDir: resolve(output, "main"),
      sourcemap: false,
      rollupOptions: {
        ...config.main?.build?.rollupOptions,
        input: { index: "prototype/review-entry.ts", sidecar: "src/main/sidecar.ts" },
      },
    },
    plugins: [
      ...(config.main?.plugins ?? []).filter((plugin) =>
        !plugin || !("name" in plugin) || plugin.name !== "opencode:copy-server-assets",
      ),
      {
        name: "openesg:copy-review-server-assets",
        async writeBundle() {
          const target = resolve(output, "main/chunks")
          await mkdir(target, { recursive: true })
          for (const file of await readdir("../opencode/dist/node")) {
            if (file.endsWith(".wasm")) await copyFile(`../opencode/dist/node/${file}`, resolve(target, file))
          }
        },
      },
    ],
  },
  preload: {
    ...config.preload,
    build: { ...config.preload?.build, outDir: resolve(output, "preload"), sourcemap: false },
  },
  renderer: {
    ...config.renderer,
    define: { "import.meta.env.VITE_SENTRY_DSN": JSON.stringify("") },
    // No source-map uploads or release-publishing plugins in review builds.
    plugins: [appPlugin],
    build: { ...config.renderer?.build, outDir: resolve(output, "renderer"), sourcemap: false },
  },
})
