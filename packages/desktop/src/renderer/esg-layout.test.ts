import { describe, expect, test } from "bun:test"
import { readESGLayout, saveESGLayout } from "./esg-layout"

describe("ESG conversation layout preference", () => {
  const memory = () => {
    const entries = new Map<string, string>()
    return () => ({
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => { entries.set(key, value) },
    })
  }
  test("defaults to the agent on the right", () => {
    expect(readESGLayout(memory())).toBe("side-by-side")
  })
  test("remembers stacked and then side-by-side using the same preference", () => {
    const storage = memory()
    expect(saveESGLayout(storage, "stacked")).toBe(true)
    expect(readESGLayout(storage)).toBe("stacked")
    expect(saveESGLayout(storage, "side-by-side")).toBe(true)
    expect(readESGLayout(storage)).toBe("side-by-side")
  })
  test("ignores invalid stored values", () => {
    expect(readESGLayout(() => ({ getItem: () => "invalid", setItem: () => {} }))).toBe("side-by-side")
  })
  test("persists floating mode and can dock it again", () => {
    const storage = memory()
    expect(saveESGLayout(storage, "floating")).toBe(true)
    expect(readESGLayout(storage)).toBe("floating")
    expect(saveESGLayout(storage, "stacked")).toBe(true)
    expect(readESGLayout(storage)).toBe("stacked")
  })
  test("storage access failure does not block opening or changing the layout", () => {
    const unavailable = () => { throw new Error("storage unavailable") }
    expect(readESGLayout(unavailable)).toBe("side-by-side")
    expect(saveESGLayout(unavailable, "stacked")).toBe(false)
  })
  test("write failure is reported so the UI can avoid claiming persistence", () => {
    const storage = () => ({ getItem: () => null, setItem: () => { throw new Error("quota exceeded") } })
    expect(saveESGLayout(storage, "stacked")).toBe(false)
  })
})
