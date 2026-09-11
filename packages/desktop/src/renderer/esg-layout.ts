export type ESGLayout = "side-by-side" | "stacked" | "floating"

const key = "openesg.prototype.conversation-layout.v1"
type LayoutStorage = () => Pick<Storage, "getItem" | "setItem">

export function readESGLayout(storage: LayoutStorage): ESGLayout {
  try {
    const value = storage().getItem(key)
    return value === "stacked" || value === "floating" ? value : "side-by-side"
  } catch {
    // Layout preferences must never prevent the native workspace from opening.
    return "side-by-side"
  }
}

export function saveESGLayout(storage: LayoutStorage, layout: ESGLayout) {
  try {
    storage().setItem(key, layout)
    return true
  } catch {
    return false
  }
}
