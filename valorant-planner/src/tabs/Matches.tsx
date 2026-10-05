import { useState } from 'react'
import { AGENTS, agentById } from '../data/agents'
import { MAPS, mapById } from '../data/maps'
import { WEAPON_GROUPS } from '../data/weapons'
import { useStore } from '../store'
import type { Match } from '../types'

const today = () => new Date().toISOString().slice(0, 10)
const sidearms = WEAPON_GROUPS[0].weapons
const mains = WEAPON_GROUPS.slice(1).flatMap((g) => g.weapons)

const RESULT: Record<Match['result'], string> = { win: 'WIN', loss: 'LOSS', draw: 'DRAW' }

export function Matches() {
  const { matches, addMatch, removeMatch } = useStore()
  const [f, setF] = useState<Omit<Match, 'id'>>({
    date: today(), map: MAPS[0].id, agentId: AGENTS[0].id, result: 'win', score: '', weapon: 'ヴァンダル', sidearm: 'クラシック', note: '',
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))

  const wins = matches.filter((m) => m.result === 'win').length

  return (
    <div className="page">
      <div className="page-head">
        <h2>MATCHES</h2>
        <span className="muted">{matches.length} 試合 / 勝率 {matches.length ? Math.round((wins / matches.length) * 100) : 0}%</span>
      </div>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          addMatch(f)
          setF((p) => ({ ...p, score: '', note: '' }))
        }}
      >
        <input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} />
        <select value={f.map} onChange={(e) => set('map', e.target.value)}>
          {MAPS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={f.agentId} onChange={(e) => set('agentId', e.target.value)}>
          {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={f.result} onChange={(e) => set('result', e.target.value as Match['result'])}>
          {Object.entries(RESULT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input placeholder="スコア（例: 13-9）" value={f.score} onChange={(e) => set('score', e.target.value)} />
        <select value={f.weapon} onChange={(e) => set('weapon', e.target.value)}>
          {WEAPON_GROUPS.slice(1).map((g) => (
            <optgroup key={g.category} label={g.category}>
              {g.weapons.map((w) => <option key={w}>{w}</option>)}
            </optgroup>
          ))}
        </select>
        <select value={f.sidearm} onChange={(e) => set('sidearm', e.target.value)}>
          {sidearms.map((w) => <option key={w}>{w}</option>)}
        </select>
        <textarea placeholder="ロードアウト・反省メモ" value={f.note} onChange={(e) => set('note', e.target.value)} />
        <button className="primary" type="submit">記録</button>
      </form>
      <div className="list">
        {matches.map((m) => (
          <div key={m.id} className="list-item">
            <div>
              <strong className={`res ${m.result}`}>{RESULT[m.result]}</strong> {m.score}
              <span className="muted"> {m.date} / {mapById(m.map).name} / {agentById(m.agentId)?.name}</span>
              <div className="muted">メイン: {mains.includes(m.weapon) ? m.weapon : m.weapon} / サイドアーム: {m.sidearm}</div>
              {m.note && <p>{m.note}</p>}
            </div>
            <button className="danger" onClick={() => removeMatch(m.id)}>削除</button>
          </div>
        ))}
        {!matches.length && <div className="muted">試合の記録はまだありません。</div>}
      </div>
    </div>
  )
}
