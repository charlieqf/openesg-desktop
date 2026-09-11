import { defineConfig } from "electron-vite"
import config from "../electron.vite.config"

// Rebuild only review UI assets without touching or restarting the native runtime.
export default defineConfig({ renderer: config.renderer })
