import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { idbStorage } from './idbStorage'
import { STEP_COUNT } from './types'
import type { Item, ItemGroup, Lineup, Match, Plan, StampKind, Step, Team, Tool } from './types'

export type Tab = 'STRATEGY' | 'LINEUPS' | 'PLAYBOOK' | 'COMMUNITY' | 'MATCHES'
export type AgentFilter = 'all' | 'fav' | 'map'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const emptySteps = (): Step[] => Array.from({ length: STEP_COUNT }, () => ({ items: [] }))

export const newPlan = (name = '新しい戦術', map = 'ascent'): Plan => ({
  id: uid(),
  name,
  map,
  side: 'attack',
  steps: emptySteps(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

export const groupOf = (item: Item): ItemGroup => {
  switch (item.type) {
    case 'agent': return 'agents'
    case 'text': return 'text'
    case 'image': return 'images'
    case 'stamp': return 'stamps'
    default: return 'drawings'
  }
}

const HISTORY_LIMIT = 60
type Snapshot = Item[][]

interface State {
  // ---- 永続化するデータ ----
  plans: Plan[]
  currentId: string
  favorites: string[]
  lineups: Lineup[]
  matches: Match[]
  // ---- UI 状態 ----
  tab: Tab
  step: number
  tool: Tool
  color: string
  width: number
  stamp: StampKind
  team: Team
  onion: boolean
  agentFilter: AgentFilter
  roleFilter: string
  selectedId: string | null
  past: Snapshot[]
  future: Snapshot[]
  hydrated: boolean

  setTab: (t: Tab) => void
  setStep: (n: number) => void
  setTool: (t: Tool) => void
  setColor: (c: string) => void
  setWidth: (w: number) => void
  setStamp: (s: StampKind) => void
  setTeam: (t: Team) => void
  setOnion: (v: boolean) => void
  setAgentFilter: (f: AgentFilter) => void
  setRoleFilter: (r: string) => void
  select: (id: string | null) => void
  toggleFavorite: (agentId: string) => void

  // プラン操作
  createPlan: () => void
  duplicatePlan: (id: string) => void
  switchPlan: (id: string) => void
  deletePlan: (id: string) => void
  patchPlan: (patch: Partial<Pick<Plan, 'name' | 'map' | 'side' | 'thumbnail'>>) => void
  importAll: (data: Partial<Pick<State, 'plans' | 'favorites' | 'lineups' | 'matches'>>) => void

  // 描画内容の編集（履歴は pushHistory で明示的に積む）
  pushHistory: () => void
  undo: () => void
  redo: () => void
  addItem: (item: Item, withHistory?: boolean) => void
  replaceItem: (item: Item) => void
  removeItem: (id: string) => void
  removeMany: (ids: string[]) => void
  clearGroup: (g: ItemGroup) => void
  clearStep: () => void
  clearAll: () => void
  setAudio: (audio: string | undefined, stepIdx?: number) => void

  addLineup: (l: Omit<Lineup, 'id'>) => void
  removeLineup: (id: string) => void
  addMatch: (m: Omit<Match, 'id'>) => void
  removeMatch: (id: string) => void
}

const initialPlan = newPlan('Ascent A Execute')

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const cur = () => {
        const s = get()
        return s.plans.find((p) => p.id === s.currentId) ?? s.plans[0]
      }
      const snapshot = (): Snapshot => cur().steps.map((st) => st.items)
      const mapPlan = (fn: (p: Plan) => Plan) =>
        set((s) => ({
          plans: s.plans.map((p) => (p.id === (s.plans.find((x) => x.id === s.currentId) ?? s.plans[0]).id ? fn(p) : p)),
        }))
      const mapStepItems = (fn: (items: Item[]) => Item[], stepIdx = get().step) =>
        mapPlan((p) => ({
          ...p,
          updatedAt: Date.now(),
          steps: p.steps.map((st, i) => (i === stepIdx ? { ...st, items: fn(st.items) } : st)),
        }))
      const restore = (snap: Snapshot) =>
        mapPlan((p) => ({ ...p, updatedAt: Date.now(), steps: p.steps.map((st, i) => ({ ...st, items: snap[i] ?? [] })) }))
      const resetEditing = () => set({ past: [], future: [], selectedId: null, step: 0 })

      return {
        plans: [initialPlan],
        currentId: initialPlan.id,
        favorites: [],
        lineups: [],
        matches: [],
        tab: 'STRATEGY',
        step: 0,
        tool: 'select',
        color: '#ff4655',
        width: 6,
        stamp: 'smoke',
        team: 'ally',
        onion: true,
        agentFilter: 'all',
        roleFilter: 'all',
        selectedId: null,
        past: [],
        future: [],
        hydrated: false,

        setTab: (tab) => set({ tab }),
        setStep: (step) => set({ step, selectedId: null }),
        setTool: (tool) => set({ tool, selectedId: tool === 'select' ? get().selectedId : null }),
        setColor: (color) => set({ color }),
        setWidth: (width) => set({ width }),
        setStamp: (stamp) => set({ stamp, tool: 'stamp' }),
        setTeam: (team) => set({ team }),
        setOnion: (onion) => set({ onion }),
        setAgentFilter: (agentFilter) => set({ agentFilter }),
        setRoleFilter: (roleFilter) => set({ roleFilter }),
        select: (selectedId) => set({ selectedId }),
        toggleFavorite: (id) =>
          set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] })),

        createPlan: () => {
          const p = newPlan(`新しい戦術 ${get().plans.length + 1}`, cur().map)
          set((s) => ({ plans: [...s.plans, p], currentId: p.id, tab: 'STRATEGY' }))
          resetEditing()
        },
        duplicatePlan: (id) => {
          const src = get().plans.find((p) => p.id === id)
          if (!src) return
          const p: Plan = { ...structuredClone(src), id: uid(), name: `${src.name} (コピー)`, createdAt: Date.now(), updatedAt: Date.now() }
          set((s) => ({ plans: [...s.plans, p] }))
        },
        switchPlan: (id) => {
          set({ currentId: id })
          resetEditing()
        },
        deletePlan: (id) => {
          const s = get()
          let plans = s.plans.filter((p) => p.id !== id)
          if (plans.length === 0) plans = [newPlan()]
          const currentId = plans.some((p) => p.id === s.currentId) ? s.currentId : plans[0].id
          set({ plans, currentId })
          if (currentId !== s.currentId) resetEditing()
        },
        patchPlan: (patch) => mapPlan((p) => ({ ...p, ...patch, updatedAt: patch.thumbnail ? p.updatedAt : Date.now() })),
        importAll: (data) => {
          set((s) => ({
            plans: data.plans?.length ? data.plans : s.plans,
            currentId: data.plans?.length ? data.plans[0].id : s.currentId,
            favorites: data.favorites ?? s.favorites,
            lineups: data.lineups ?? s.lineups,
            matches: data.matches ?? s.matches,
          }))
          resetEditing()
        },

        pushHistory: () => set((s) => ({ past: [...s.past, snapshot()].slice(-HISTORY_LIMIT), future: [] })),
        undo: () => {
          const { past } = get()
          if (!past.length) return
          const prev = past[past.length - 1]
          set((s) => ({ past: s.past.slice(0, -1), future: [...s.future, snapshot()], selectedId: null }))
          restore(prev)
        },
        redo: () => {
          const { future } = get()
          if (!future.length) return
          const next = future[future.length - 1]
          set((s) => ({ future: s.future.slice(0, -1), past: [...s.past, snapshot()], selectedId: null }))
          restore(next)
        },
        addItem: (item, withHistory = true) => {
          if (withHistory) get().pushHistory()
          mapStepItems((items) => [...items, item])
        },
        replaceItem: (item) => mapStepItems((items) => items.map((i) => (i.id === item.id ? item : i))),
        removeItem: (id) => {
          get().pushHistory()
          mapStepItems((items) => items.filter((i) => i.id !== id))
          set({ selectedId: null })
        },
        removeMany: (ids) => mapStepItems((items) => items.filter((i) => !ids.includes(i.id))),
        clearGroup: (g) => {
          get().pushHistory()
          mapStepItems((items) => items.filter((i) => groupOf(i) !== g))
          set({ selectedId: null })
        },
        clearStep: () => {
          get().pushHistory()
          mapPlan((p) => ({
            ...p,
            updatedAt: Date.now(),
            steps: p.steps.map((st, i) => (i === get().step ? { items: [] } : st)),
          }))
          set({ selectedId: null })
        },
        clearAll: () => {
          get().pushHistory()
          mapPlan((p) => ({ ...p, updatedAt: Date.now(), steps: emptySteps() }))
          set({ selectedId: null })
        },
        setAudio: (audio, stepIdx = get().step) =>
          mapPlan((p) => ({
            ...p,
            steps: p.steps.map((st, i) => (i === stepIdx ? { ...st, audio } : st)),
          })),

        addLineup: (l) => set((s) => ({ lineups: [{ ...l, id: uid() }, ...s.lineups] })),
        removeLineup: (id) => set((s) => ({ lineups: s.lineups.filter((x) => x.id !== id) })),
        addMatch: (m) => set((s) => ({ matches: [{ ...m, id: uid() }, ...s.matches] })),
        removeMatch: (id) => set((s) => ({ matches: s.matches.filter((x) => x.id !== id) })),
      }
    },
    {
      name: 'val-planner-v1',
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({
        plans: s.plans,
        currentId: s.currentId,
        favorites: s.favorites,
        lineups: s.lineups,
        matches: s.matches,
        color: s.color,
        width: s.width,
      }),
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
)

export const useCurrentPlan = () => useStore((s) => s.plans.find((p) => p.id === s.currentId) ?? s.plans[0])
