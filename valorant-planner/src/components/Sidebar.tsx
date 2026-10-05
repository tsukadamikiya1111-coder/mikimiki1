import { useRef } from 'react'
import { AGENTS, ROLES, roleColor } from '../data/agents'
import { STAMPS, StampGlyph } from '../data/stamps'
import { scaleItem } from '../geometry'
import { loadImage } from '../imageUtil'
import { groupOf, uid, useCurrentPlan, useStore } from '../store'
import { STEP_COUNT } from '../types'
import type { ItemGroup, Tool } from '../types'
import { AudioPanel } from './AudioPanel'
import { PlanPreview } from './PlanPreview'

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'select', label: '選択', icon: '⬚' },
  { id: 'pen', label: 'ペン', icon: '✎' },
  { id: 'eraser', label: '消しゴム', icon: '⌫' },
  { id: 'text', label: 'テキスト', icon: 'T' },
  { id: 'image', label: '画像', icon: '🖼' },
  { id: 'arrow', label: '軌道線', icon: '➚' },
]

const GROUPS: { id: ItemGroup; label: string; icon: string }[] = [
  { id: 'agents', label: '人物（エージェント）', icon: '👤' },
  { id: 'text', label: 'テキスト', icon: 'T' },
  { id: 'images', label: '画像', icon: '🖼' },
  { id: 'drawings', label: '線（ペン・軌道線）', icon: '✎' },
  { id: 'stamps', label: 'スタンプ', icon: '★' },
]

const COLORS = ['#ff4655', '#ffffff', '#f2c94c', '#4fd1a5', '#4fc3f7', '#b388ff', '#ff9f43']

export function Sidebar() {
  const plan = useCurrentPlan()
  const s = useStore()
  const imageInput = useRef<HTMLInputElement>(null)
  const thumbInput = useRef<HTMLInputElement>(null)
  const items = plan.steps[s.step].items
  const selected = items.find((i) => i.id === s.selectedId)

  const pickTool = (t: Tool) => {
    if (t === 'image') imageInput.current?.click()
    else s.setTool(t)
  }

  const onImage = async (file?: File) => {
    if (!file) return
    try {
      const { href, w, h } = await loadImage(file)
      const k = Math.min(1, 320 / Math.max(w, h))
      const iw = w * k, ih = h * k
      const id = uid()
      s.addItem({ id, type: 'image', href, x: 500 - iw / 2, y: 500 - ih / 2, w: iw, h: ih })
      s.setTool('select')
      s.select(id)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const onThumb = async (file?: File) => {
    if (!file) return
    try {
      s.patchPlan({ thumbnail: (await loadImage(file, 480)).href })
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const rescale = (f: number) => {
    if (!selected) return
    s.pushHistory()
    s.replaceItem(scaleItem(selected, f))
  }

  const placeAgent = (agentId: string) => {
    const n = items.filter((i) => i.type === 'agent').length
    s.addItem({ id: uid(), type: 'agent', agentId, team: s.team, x: 500 + (n % 5) * 20 - 40, y: 500 + (n % 5) * 20 - 40, size: 64 })
  }

  const onMapIds = new Set(items.flatMap((i) => (i.type === 'agent' ? [i.agentId] : [])))
  const agents = AGENTS.filter((a) => {
    if (s.roleFilter !== 'all' && a.role !== s.roleFilter) return false
    if (s.agentFilter === 'fav') return s.favorites.includes(a.id)
    if (s.agentFilter === 'map') return onMapIds.has(a.id)
    return true
  })

  return (
    <aside className="sidebar">
      {/* 1. 戦術名・サムネイル・Attack/Defense */}
      <div className="section plan-head">
        <div className="thumb" onClick={() => thumbInput.current?.click()} title="クリックでサムネイル画像を差し替え">
          {plan.thumbnail ? (
            <img src={plan.thumbnail} alt="thumbnail" />
          ) : (
            <PlanPreview mapId={plan.map} side={plan.side} items={plan.steps[0].items} />
          )}
        </div>
        <div className="plan-meta">
          <input
            className="plan-name"
            value={plan.name}
            onChange={(e) => s.patchPlan({ name: e.target.value })}
            placeholder="戦術名"
          />
          <div className="seg">
            <button className={plan.side === 'attack' ? 'active atk' : ''} onClick={() => s.patchPlan({ side: 'attack' })}>ATTACK</button>
            <button className={plan.side === 'defense' ? 'active def' : ''} onClick={() => s.patchPlan({ side: 'defense' })}>DEFENSE</button>
          </div>
          {plan.thumbnail && <button className="link" onClick={() => s.patchPlan({ thumbnail: undefined })}>サムネイルを自動に戻す</button>}
        </div>
        <input ref={thumbInput} type="file" accept="image/*" hidden onChange={(e) => { onThumb(e.target.files?.[0]); e.target.value = '' }} />
      </div>

      {/* 2. Sequence */}
      <div className="section">
        <h3>Sequence</h3>
        <div className="steps">
          {Array.from({ length: STEP_COUNT }, (_, i) => {
            const st = plan.steps[i]
            const filled = st.items.length > 0 || !!st.audio
            return (
              <button key={i} className={`${s.step === i ? 'active' : ''} ${filled ? 'filled' : ''}`} onClick={() => s.setStep(i)}>
                {i + 1}
              </button>
            )
          })}
        </div>
        <label className="check">
          <input type="checkbox" checked={s.onion} onChange={(e) => s.setOnion(e.target.checked)} /> 前のステップを薄く表示
        </label>
      </div>

      {/* 3. Audio */}
      <AudioPanel />

      {/* 4, 5. Delete */}
      <div className="section">
        <h3>Delete</h3>
        <div className="row">
          <button
            className="danger"
            onClick={() => confirm('全ステップの描き込みと音声をすべて削除します。よろしいですか？') && s.clearAll()}
          >
            Everything
          </button>
          <button className="danger" onClick={() => confirm(`STEP ${s.step + 1} の内容を削除します。よろしいですか？`) && s.clearStep()}>
            Sequence Step
          </button>
        </div>
        <div className="icon-row">
          {GROUPS.map((g) => {
            const n = items.filter((i) => groupOf(i) === g.id).length
            return (
              <button key={g.id} disabled={!n} title={`${g.label}を現在のステップから削除`} onClick={() => s.clearGroup(g.id)}>
                {g.icon}
                <small>{n}</small>
              </button>
            )
          })}
        </div>
      </div>

      {/* 6. Tools */}
      <div className="section">
        <h3>Tools</h3>
        <div className="tools">
          {TOOLS.map((t) => (
            <button key={t.id} className={s.tool === t.id ? 'active' : ''} onClick={() => pickTool(t.id)}>
              <span className="ico">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <input ref={imageInput} type="file" accept="image/*" hidden onChange={(e) => { onImage(e.target.files?.[0]); e.target.value = '' }} />
        <div className="colors">
          {COLORS.map((c) => (
            <button key={c} className={`swatch ${s.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => s.setColor(c)} aria-label={c} />
          ))}
          <input type="color" value={s.color} onChange={(e) => s.setColor(e.target.value)} />
        </div>
        <label className="field">
          太さ {s.width}
          <input type="range" min={2} max={24} value={s.width} onChange={(e) => s.setWidth(+e.target.value)} />
        </label>
        <div className="stamps">
          {STAMPS.map((st) => (
            <button key={st.id} className={s.tool === 'stamp' && s.stamp === st.id ? 'active' : ''} title={st.name} onClick={() => s.setStamp(st.id)}>
              <svg viewBox="-16 -16 32 32" width={26} height={26}>
                <StampGlyph kind={st.id} color="currentColor" size={26} />
              </svg>
            </button>
          ))}
        </div>
        {selected && (
          <div className="selected">
            <span>選択中: {selected.type}</span>
            <button onClick={() => rescale(0.85)}>－</button>
            <button onClick={() => rescale(1.18)}>＋</button>
            <button className="danger" onClick={() => s.removeItem(selected.id)}>削除</button>
          </div>
        )}
      </div>

      {/* 7. Agents */}
      <div className="section">
        <h3>Agents</h3>
        <div className="seg">
          {([['all', 'All'], ['fav', 'Favorited'], ['map', 'On Map']] as const).map(([id, label]) => (
            <button key={id} className={s.agentFilter === id ? 'active' : ''} onClick={() => s.setAgentFilter(id)}>{label}</button>
          ))}
        </div>
        <div className="roles">
          <button className={s.roleFilter === 'all' ? 'active' : ''} onClick={() => s.setRoleFilter('all')}>全役職</button>
          {ROLES.map((r) => (
            <button
              key={r.id}
              className={s.roleFilter === r.id ? 'active' : ''}
              style={s.roleFilter === r.id ? { borderColor: r.color, color: r.color } : undefined}
              onClick={() => s.setRoleFilter(r.id)}
            >
              {r.name}
            </button>
          ))}
        </div>
        <div className="seg small">
          <button className={s.team === 'ally' ? 'active' : ''} onClick={() => s.setTeam('ally')}>味方として配置</button>
          <button className={s.team === 'enemy' ? 'active enemy' : ''} onClick={() => s.setTeam('enemy')}>敵として配置</button>
        </div>
        <div className="agents">
          {agents.map((a) => (
            <div
              key={a.id}
              className="agent"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/x-agent', a.id)
                e.dataTransfer.effectAllowed = 'copy'
              }}
              onClick={() => placeAgent(a.id)}
              title={`${a.name}（クリックで配置 / ドラッグでマップへ）`}
            >
              <span className="avatar" style={{ borderColor: roleColor(a.role) }}>{a.code}</span>
              <span className="aname">{a.name}</span>
              <button
                className={`star ${s.favorites.includes(a.id) ? 'on' : ''}`}
                onClick={(e) => { e.stopPropagation(); s.toggleFavorite(a.id) }}
                aria-label="お気に入り"
              >
                ★
              </button>
            </div>
          ))}
          {!agents.length && <div className="muted">該当するエージェントがいません</div>}
        </div>
      </div>
    </aside>
  )
}
