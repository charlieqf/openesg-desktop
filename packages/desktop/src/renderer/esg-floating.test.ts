import { describe, expect, test } from "bun:test"
import { fitFloatingRect } from "./esg-floating"

describe("ESG floating panel bounds", () => {
  test("opens near the right edge without covering the layout toolbar", () => {
    expect(fitFloatingRect({ x: 10000, y: 72, width: 500, height: 580 }, { width: 1400, height: 1100 }))
      .toEqual({ x: 888, y: 72, width: 500, height: 580 })
  })
  test("keeps a dragged panel inside the host", () => {
    expect(fitFloatingRect({ x: -300, y: -500, width: 500, height: 580 }, { width: 1400, height: 1100 }))
      .toEqual({ x: 12, y: 60, width: 500, height: 580 })
  })
  test("enforces usable minimum dimensions", () => {
    expect(fitFloatingRect({ x: 200, y: 100, width: 10, height: 10 }, { width: 1400, height: 1100 }))
      .toEqual({ x: 200, y: 100, width: 360, height: 300 })
  })
  test("shrinks and repositions oversized panels when the host gets smaller", () => {
    expect(fitFloatingRect({ x: 900, y: 700, width: 900, height: 800 }, { width: 600, height: 500 }))
      .toEqual({ x: 12, y: 60, width: 576, height: 428 })
  })
  test("small hosts take precedence over minimum dimensions", () => {
    const bounds = { width: 300, height: 250 }
    const rect = fitFloatingRect({ x: 900, y: 700, width: 500, height: 580 }, bounds)
    expect(rect).toEqual({ x: 12, y: 60, width: 276, height: 178 })
    expect(fitFloatingRect(rect, bounds)).toEqual(rect)
  })
})
