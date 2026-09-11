import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import type { Configuration } from "electron-builder"

const require = createRequire(import.meta.url)

const config: Configuration = {
  appId: "com.openesg.review",
  productName: "OpenESG Review",
  artifactName: "OpenESG-Review-${version}-Setup-${arch}.${ext}",
  directories: { output: "dist/review", buildResources: "resources" },
  extraMetadata: { name: "openesg-review", version: "0.1.0", main: "out/main/index.js" },
  electronDist: join(dirname(require.resolve("electron/package.json")), "dist"),
  asar: true,
  npmRebuild: false,
  files: [
    { from: "out-review", to: "out", filter: ["**/*", "!**/*.map"] },
    "resources/esg/**/*.html",
    "resources/esg/assets/**/*",
    "package.json",
  ],
  extraResources: [{ from: "resources/icons", to: "icons" }],
  extraFiles: [
    { from: "../../LICENSE", to: "OpenCode-LICENSE.txt" },
    { from: "prototype/REVIEW-README.md", to: "OpenESG-Review-README.md" },
  ],
  publish: null,
  win: { icon: "resources/icons/icon.ico", target: [{ target: "nsis", arch: ["x64"] }] },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowElevation: false,
    allowToChangeInstallationDirectory: true,
    runAfterFinish: false,
    shortcutName: "OpenESG Review",
    uninstallDisplayName: "OpenESG Review",
    deleteAppDataOnUninstall: false,
  },
}

export default config
