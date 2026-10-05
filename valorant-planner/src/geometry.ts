import type { Item } from './types'

export interface BBox {
  x: number
  y: number
  w: number
  h: number
}

export const MAP_SIZE = 1000

const isWide = (ch: string) => /[^\x00-\x7f｡-ﾟ]/.test(ch)

export function textSize(text: string, size: number) {
  let w = 0
  for (const ch of text) w += isWide(ch) ? size : size * 0.6
  return { w: Math.max(w, size * 0.6), h: size * 1.2 }
}

export function bbox(item: Item): BBox {
  switch (item.type) {
    case 'pen': {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (let i = 0; i < item.points.length; i += 2) {
        minX = Math.min(minX, item.points[i]); maxX = Math.max(maxX, item.points[i])
        minY = Math.min(minY, item.points[i + 1]); maxY = Math.max(maxY, item.points[i + 1])
      }
      const p = item.width / 2
      return { x: minX - p, y: minY - p, w: maxX - minX + item.width, h: maxY - minY + item.width }
    }
    case 'arrow': {
      const p = item.width / 2
      const x = Math.min(item.x1, item.x2), y = Math.min(item.y1, item.y2)
      return { x: x - p, y: y - p, w: Math.abs(item.x2 - item.x1) + item.width, h: Math.abs(item.y2 - item.y1) + item.width }
    }
    case 'text': {
      const { w, h } = textSize(item.text, item.size)
      return { x: item.x, y: item.y, w, h }
    }
    case 'image':
      return { x: item.x, y: item.y, w: item.w, h: item.h }
    case 'stamp':
    case 'agent':
      return { x: item.x - item.size / 2, y: item.y - item.size / 2, w: item.size, h: item.size }
  }
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1
  const len2 = dx * dx + dy * dy
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

export function hit(item: Item, x: number, y: number, radius = 0): boolean {
  if (item.type === 'pen') {
    const r = item.width / 2 + radius + 4
    const pts = item.points
    if (pts.length === 2) return Math.hypot(x - pts[0], y - pts[1]) <= r
    for (let i = 0; i + 3 < pts.length; i += 2) {
      if (distToSegment(x, y, pts[i], pts[i + 1], pts[i + 2], pts[i + 3]) <= r) return true
    }
    return false
  }
  if (item.type === 'arrow') {
    return distToSegment(x, y, item.x1, item.y1, item.x2, item.y2) <= item.width / 2 + radius + 6
  }
  const b = bbox(item)
  const m = radius
  return x >= b.x - m && x <= b.x + b.w + m && y >= b.y - m && y <= b.y + b.h + m
}

export function topHit(items: Item[], x: number, y: number): Item | undefined {
  for (let i = items.length - 1; i >= 0; i--) if (hit(items[i], x, y)) return items[i]
  return undefined
}

export function moveItem(item: Item, dx: number, dy: number): Item {
  switch (item.type) {
    case 'pen':
      return { ...item, points: item.points.map((v, i) => v + (i % 2 === 0 ? dx : dy)) }
    case 'arrow':
      return { ...item, x1: item.x1 + dx, y1: item.y1 + dy, x2: item.x2 + dx, y2: item.y2 + dy }
    default:
      return { ...item, x: item.x + dx, y: item.y + dy }
  }
}

export function scaleItem(item: Item, f: number): Item {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  switch (item.type) {
    case 'pen':
    case 'arrow':
      return { ...item, width: clamp(item.width * f, 1, 40) }
    case 'text':
      return { ...item, size: clamp(item.size * f, 10, 200) }
    case 'stamp':
    case 'agent':
      return { ...item, size: clamp(item.size * f, 16, 240) }
    case 'image': {
      const cx = item.x + item.w / 2, cy = item.y + item.h / 2
      const w = clamp(item.w * f, 20, 1600), h = (item.h / item.w) * w
      return { ...item, w, h, x: cx - w / 2, y: cy - h / 2 }
    }
  }
}
