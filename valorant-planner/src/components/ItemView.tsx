import { agentById, roleColor } from '../data/agents'
import { StampGlyph } from '../data/stamps'
import { bbox, textSize } from '../geometry'
import type { Item } from '../types'

const FONT = "'Segoe UI', 'Hiragino Sans', 'Yu Gothic', Meiryo, sans-serif"

export function ItemView({ item }: { item: Item }) {
  switch (item.type) {
    case 'pen': {
      const p = item.points
      const d = p.length === 2 ? `M${p[0]} ${p[1]}l0.01 0` : 'M' + p.map((v, i) => (i % 2 === 0 ? `${i ? ' L' : ''}${v}` : ` ${v}`)).join('')
      return <path d={d} fill="none" stroke={item.color} strokeWidth={item.width} strokeLinecap="round" strokeLinejoin="round" />
    }
    case 'arrow': {
      const { x1, y1, x2, y2, width: w, color } = item
      const len = Math.hypot(x2 - x1, y2 - y1)
      if (len < 1) return null
      const ux = (x2 - x1) / len, uy = (y2 - y1) / len
      const head = Math.min(Math.max(16, w * 3.2), len)
      const bx = x2 - ux * head, by = y2 - uy * head
      const hw = head * 0.5
      return (
        <g>
          <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={w} strokeLinecap="round" />
          <polygon points={`${x2},${y2} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`} fill={color} />
        </g>
      )
    }
    case 'text': {
      const { h } = textSize(item.text, item.size)
      return (
        <text
          x={item.x}
          y={item.y + h * 0.82}
          fontSize={item.size}
          fontFamily={FONT}
          fontWeight={700}
          fill={item.color}
          stroke="#0b131a"
          strokeWidth={Math.max(2, item.size / 6)}
          paintOrder="stroke"
          strokeLinejoin="round"
          style={{ userSelect: 'none' }}
        >
          {item.text}
        </text>
      )
    }
    case 'image':
      return <image href={item.href} x={item.x} y={item.y} width={item.w} height={item.h} preserveAspectRatio="none" />
    case 'stamp':
      return (
        <g transform={`translate(${item.x} ${item.y})`}>
          <StampGlyph kind={item.stamp} color={item.color} size={item.size} />
        </g>
      )
    case 'agent': {
      const a = agentById(item.agentId)
      if (!a) return null
      const r = item.size / 2
      const enemy = item.team === 'enemy'
      const ring = enemy ? '#ff4655' : roleColor(a.role)
      return (
        <g transform={`translate(${item.x} ${item.y})`}>
          <circle r={r} fill={enemy ? '#3a1219' : '#0f1923'} stroke={ring} strokeWidth={4} strokeDasharray={enemy ? '6 4' : undefined} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={r * (a.code.length > 3 ? 0.62 : 0.7)} fontWeight={800} fontFamily={FONT} fill="#fff" style={{ userSelect: 'none' }}>
            {a.code}
          </text>
        </g>
      )
    }
  }
}

export function Items({ items }: { items: Item[] }) {
  return (
    <>
      {items.map((it) => (
        <ItemView key={it.id} item={it} />
      ))}
    </>
  )
}

export function SelectionBox({ item }: { item: Item }) {
  const b = bbox(item)
  return (
    <rect x={b.x - 4} y={b.y - 4} width={b.w + 8} height={b.h + 8} fill="none" stroke="#4fc3f7" strokeWidth={2} strokeDasharray="6 4" pointerEvents="none" />
  )
}
