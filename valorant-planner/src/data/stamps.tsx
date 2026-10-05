import type { ReactNode } from 'react'
import type { StampKind } from '../types'

// すべて 24x24 の座標系・stroke ベースで描く。
export const STAMPS: { id: StampKind; name: string; draw: () => ReactNode }[] = [
  {
    id: 'smoke',
    name: 'スモーク',
    draw: () => (
      <>
        <circle cx="8" cy="14" r="5" />
        <circle cx="14" cy="10" r="5" />
        <circle cx="17" cy="15" r="4" />
        <path d="M4 19h16" />
      </>
    ),
  },
  {
    id: 'wall',
    name: '壁',
    draw: () => (
      <>
        <rect x="3" y="6" width="18" height="12" />
        <path d="M3 12h18M9 6v6M15 12v6" />
      </>
    ),
  },
  {
    id: 'dart',
    name: 'ダーツ',
    draw: () => (
      <>
        <path d="M4 20L18 6" />
        <path d="M18 6l-1-4 5 5-4-1z" />
        <path d="M4 20l1-5M4 20l5-1" />
      </>
    ),
  },
  {
    id: 'pin',
    name: 'ピン',
    draw: () => (
      <>
        <path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
  },
  {
    id: 'warning',
    name: '警告',
    draw: () => (
      <>
        <path d="M12 3L22 20H2z" />
        <path d="M12 9v5M12 17v.5" />
      </>
    ),
  },
  {
    id: 'flag',
    name: '旗',
    draw: () => (
      <>
        <path d="M5 22V3" />
        <path d="M5 4h13l-3 4 3 4H5" />
      </>
    ),
  },
  {
    id: 'anchor',
    name: 'アンカー',
    draw: () => (
      <>
        <circle cx="12" cy="5" r="2.5" />
        <path d="M12 7.5V21M7 11h10M4 15a8 8 0 008 6 8 8 0 008-6" />
      </>
    ),
  },
  {
    id: 'aim',
    name: '照準',
    draw: () => (
      <>
        <circle cx="12" cy="12" r="7" />
        <path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
      </>
    ),
  },
  {
    id: 'star',
    name: '星',
    draw: () => <path d="M12 2l3 7 7.5.6-5.7 4.9 1.8 7.5L12 18l-6.6 4 1.8-7.5L1.5 9.6 9 9z" />,
  },
]

export function StampGlyph({ kind, color, size }: { kind: StampKind; color: string; size: number }) {
  const s = STAMPS.find((x) => x.id === kind)!
  return (
    <g
      transform={`translate(${-size / 2} ${-size / 2}) scale(${size / 24})`}
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {s.draw()}
    </g>
  )
}
