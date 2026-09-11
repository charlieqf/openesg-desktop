export type FloatingRect = { x: number; y: number; width: number; height: number }

/** Keep the complete panel reachable, including after the host window shrinks. */
export function fitFloatingRect(rect: FloatingRect, bounds: { width: number; height: number }): FloatingRect {
  const margin = Math.min(12, Math.max(0, bounds.width / 4), Math.max(0, bounds.height / 4))
  const top = Math.min(60, Math.max(0, bounds.height / 4))
  const availableWidth = Math.max(1, bounds.width - margin * 2)
  const availableHeight = Math.max(1, bounds.height - top - margin)
  const width = Math.min(availableWidth, Math.max(Math.min(360, availableWidth), rect.width))
  const height = Math.min(availableHeight, Math.max(Math.min(300, availableHeight), rect.height))
  return {
    x: Math.max(margin, Math.min(rect.x, bounds.width - margin - width)),
    y: Math.max(top, Math.min(rect.y, bounds.height - margin - height)),
    width,
    height,
  }
}
