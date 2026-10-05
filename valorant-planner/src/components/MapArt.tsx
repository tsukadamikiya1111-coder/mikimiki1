import { mapById } from '../data/maps'
import type { Rect } from '../data/maps'
import type { Side } from '../types'

// 静的書き出し(renderToStaticMarkup)でも使うため、色はすべてリテラルで指定する。
const WALL = '#8aa0b3'
const FLOOR = '#142029'
const FONT = "'Segoe UI', 'Hiragino Sans', 'Yu Gothic', Meiryo, sans-serif"

const rectProps = ([x, y, w, h]: Rect) => ({ x, y, width: w, height: h })

export function MapArt({ mapId, side }: { mapId: string; side: Side }) {
  const m = mapById(mapId)
  return (
    <g fontFamily={FONT}>
      <rect width={1000} height={1000} fill="#0b131a" />
      <g stroke="#17232d" strokeWidth={1}>
        {Array.from({ length: 19 }, (_, i) => (
          <g key={i}>
            <line x1={(i + 1) * 50} y1={0} x2={(i + 1) * 50} y2={1000} />
            <line x1={0} y1={(i + 1) * 50} x2={1000} y2={(i + 1) * 50} />
          </g>
        ))}
      </g>
      {/* 外周の線画: 太い線で全フロアを描き、床色で内側を塗って輪郭だけ残す */}
      <g fill={WALL} stroke={WALL} strokeWidth={10} strokeLinejoin="round">
        {m.floors.map((r, i) => <rect key={i} {...rectProps(r)} />)}
      </g>
      <g fill={FLOOR}>
        {m.floors.map((r, i) => <rect key={i} {...rectProps(r)} />)}
      </g>
      {m.blocks.map((r, i) => (
        <rect key={i} {...rectProps(r)} fill="#2b3d4b" stroke={WALL} strokeWidth={3} />
      ))}
      {m.sites.map((s) => {
        const [x, y, w, h] = s.rect
        return (
          <g key={s.label}>
            <rect {...rectProps(s.rect)} rx={10} fill="rgba(255,70,85,0.08)" stroke="#ff4655" strokeWidth={2} strokeDasharray="10 8" />
            <rect x={x + w / 2 - 26} y={y + h / 2 - 26} width={52} height={52} rx={8} fill="#ff4655" />
            <text x={x + w / 2} y={y + h / 2 + 1} textAnchor="middle" dominantBaseline="central" fontSize={34} fontWeight={800} fill="#fff">
              {s.label}
            </text>
          </g>
        )
      })}
      {m.labels.map((l, i) => (
        <text key={i} x={l.x} y={l.y} textAnchor="middle" fontSize={16} fontWeight={600} letterSpacing={2} fill="#53697b">
          {l.text}
        </text>
      ))}
      <text x={m.atk[0]} y={m.atk[1]} textAnchor="middle" fontSize={17} fontWeight={700} letterSpacing={2} fill={side === 'attack' ? '#ff4655' : '#53697b'}>
        ATTACK SPAWN
      </text>
      <text x={m.def[0]} y={m.def[1]} textAnchor="middle" fontSize={17} fontWeight={700} letterSpacing={2} fill={side === 'defense' ? '#4fc3f7' : '#53697b'}>
        DEFENSE SPAWN
      </text>
      <text x={990} y={992} textAnchor="end" fontSize={14} fill="#3a4c5a">
        {m.name} / 概略図
      </text>
    </g>
  )
}
