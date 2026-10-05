export type Side = 'attack' | 'defense'
export type Team = 'ally' | 'enemy'

export type StampKind = 'smoke' | 'wall' | 'dart' | 'pin' | 'warning' | 'flag' | 'anchor' | 'aim' | 'star'

export type Tool = 'select' | 'pen' | 'eraser' | 'text' | 'image' | 'arrow' | 'stamp'

export type ItemGroup = 'agents' | 'text' | 'images' | 'drawings' | 'stamps'

interface Base {
  id: string
}

export interface PenItem extends Base {
  type: 'pen'
  points: number[] // [x0, y0, x1, y1, ...]
  color: string
  width: number
}
export interface ArrowItem extends Base {
  type: 'arrow'
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
}
export interface TextItem extends Base {
  type: 'text'
  x: number
  y: number
  text: string
  color: string
  size: number
}
export interface ImageItem extends Base {
  type: 'image'
  x: number
  y: number
  w: number
  h: number
  href: string
}
export interface StampItem extends Base {
  type: 'stamp'
  stamp: StampKind
  x: number
  y: number
  color: string
  size: number
}
export interface AgentItem extends Base {
  type: 'agent'
  agentId: string
  team: Team
  x: number
  y: number
  size: number
}

export type Item = PenItem | ArrowItem | TextItem | ImageItem | StampItem | AgentItem

export interface Step {
  items: Item[]
  audio?: string // data URL
}

export interface Plan {
  id: string
  name: string
  map: string
  side: Side
  thumbnail?: string
  steps: Step[]
  createdAt: number
  updatedAt: number
}

export interface Lineup {
  id: string
  map: string
  agentId: string
  title: string
  note: string
}

export interface Match {
  id: string
  date: string
  map: string
  agentId: string
  result: 'win' | 'loss' | 'draw'
  score: string
  weapon: string
  sidearm: string
  note: string
}

export const STEP_COUNT = 10
