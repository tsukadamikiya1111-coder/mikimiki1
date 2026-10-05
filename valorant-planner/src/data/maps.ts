import bindUrl from '../assets/maps/map_bind.png'
import corrodeUrl from '../assets/maps/map_corrode.png'
import havenUrl from '../assets/maps/map_haven.png'
import pearlUrl from '../assets/maps/map_pearl.png'
import splitUrl from '../assets/maps/map_split.png'
import sunsetUrl from '../assets/maps/map_sunset.png'
import type { Rect, SketchMap } from './sketchMaps'
import { SKETCH_MAPS } from './sketchMaps'

export type { Rect, SketchMap }

/** 画像全体に対する比率 (0〜1) */
export interface Ratio {
  x: number
  y: number
  w: number
  h: number
}

export interface MapImage {
  src: string
  width: number
  height: number
}

export interface MapSite {
  label: string
  ratio: Ratio
}

export interface MapDef {
  id: string
  name: string
  /** 画像素材。無いマップは sketch の概略線画で描く */
  image?: MapImage
  sketch?: SketchMap
  /** サイトの範囲。画像マップは画像比率、概略マップはキャンバス(1000x1000)に対する比率 */
  sites: MapSite[]
}

export const CANVAS = 1000

// ---------------------------------------------------------------------------
// 画像マップ。新しいマップは、ここに 1 エントリ足し、画像を src/assets/maps/ に置くだけ。
// 同じ id の概略マップがあれば置き換えられ、なければ末尾に追加される。
// ---------------------------------------------------------------------------
const IMAGE_MAPS: MapDef[] = [
  {
    id: 'bind',
    name: 'バインド',
    image: { src: bindUrl, width: 950, height: 842 },
    sites: [
      { label: 'A', ratio: { x: 0.8063, y: 0.3729, w: 0.1432, h: 0.1188 } },
      { label: 'B', ratio: { x: 0.0905, y: 0.3515, w: 0.1453, h: 0.1021 } },
    ],
  },
  {
    id: 'pearl',
    name: 'パール',
    image: { src: pearlUrl, width: 912, height: 876 },
    sites: [
      { label: 'A', ratio: { x: 0.5526, y: 0.7534, w: 0.1162, h: 0.1027 } },
      { label: 'B', ratio: { x: 0.4934, y: 0.0776, w: 0.1184, h: 0.1233 } },
    ],
  },
  {
    id: 'haven',
    name: 'ヘイブン',
    image: { src: havenUrl, width: 960, height: 832 },
    sites: [
      { label: 'A', ratio: { x: 0.8208, y: 0.2139, w: 0.1375, h: 0.1394 } },
      { label: 'B', ratio: { x: 0.4333, y: 0.3558, w: 0.1333, h: 0.0889 } },
      { label: 'C', ratio: { x: 0.0583, y: 0.3846, w: 0.1083, h: 0.1178 } },
    ],
  },
  {
    id: 'sunset',
    name: 'サンセット',
    image: { src: sunsetUrl, width: 894, height: 894 },
    sites: [
      { label: 'A', ratio: { x: 0.8367, y: 0.3736, w: 0.094, h: 0.1163 } },
      { label: 'B', ratio: { x: 0.0872, y: 0.264, w: 0.1477, h: 0.1029 } },
    ],
  },
  {
    // 画像から計測した値
    id: 'split',
    name: 'スプリット',
    image: { src: splitUrl, width: 700, height: 700 },
    sites: [
      { label: 'A', ratio: { x: 0.0671, y: 0.5814, w: 0.0957, h: 0.1671 } },
      { label: 'B', ratio: { x: 0.7586, y: 0.63, w: 0.1229, h: 0.0757 } },
    ],
  },
  {
    // 画像から計測した値
    id: 'corrode',
    name: 'コロード',
    image: { src: corrodeUrl, width: 787, height: 799 },
    sites: [
      { label: 'A', ratio: { x: 0.7522, y: 0.2541, w: 0.1449, h: 0.0864 } },
      { label: 'B', ratio: { x: 0.0788, y: 0.189, w: 0.1245, h: 0.1314 } },
    ],
  },
]

const fromSketch = (s: SketchMap): MapDef => ({
  id: s.id,
  name: s.name,
  sketch: s,
  sites: s.sites.map((x) => ({
    label: x.label,
    ratio: { x: x.rect[0] / CANVAS, y: x.rect[1] / CANVAS, w: x.rect[2] / CANVAS, h: x.rect[3] / CANVAS },
  })),
})

export const MAPS: MapDef[] = [
  ...SKETCH_MAPS.map((s) => IMAGE_MAPS.find((m) => m.id === s.id) ?? fromSketch(s)),
  ...IMAGE_MAPS.filter((m) => !SKETCH_MAPS.some((s) => s.id === m.id)),
]

export const mapById = (id: string) => MAPS.find((m) => m.id === id) ?? MAPS[0]

/** 画像をキャンバス(1000x1000)に収めたときの配置 */
export function imageBox(img: MapImage): Rect {
  const k = CANVAS / Math.max(img.width, img.height)
  const w = img.width * k, h = img.height * k
  return [(CANVAS - w) / 2, (CANVAS - h) / 2, w, h]
}

/** サイト範囲をキャンバス座標の矩形にする */
export function siteRect(map: MapDef, site: MapSite): Rect {
  const [ox, oy, w, h] = map.image ? imageBox(map.image) : [0, 0, CANVAS, CANVAS]
  const r = site.ratio
  return [ox + r.x * w, oy + r.y * h, r.w * w, r.h * h]
}
