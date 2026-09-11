import { app } from "electron"
import { join } from "node:path"

// This entry is bundled only for the internal review installer. It runs before
// the desktop entry imports evaluate their opt-in flags.
for (const key of Object.keys(process.env)) {
  if (key.startsWith("OPENCODE_") || key.startsWith("OTEL_")) delete process.env[key]
}
process.env.OPENCODE_ESG_REVIEW = "1"
process.env.OPENCODE_ESG_PROTOTYPE_ROOT = join(app.getPath("appData"), "OpenESGReview")
process.env.OPENCODE_SIDECAR_V2 = "0"
process.env.OPENCODE_DISABLE_AUTOUPDATE = "true"
process.env.OPENCODE_DISABLE_MODELS_FETCH = "true"
process.env.OPENCODE_DISABLE_PROJECT_CONFIG = "true"
