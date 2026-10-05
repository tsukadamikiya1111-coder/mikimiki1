import { useState } from 'react'
import { AGENTS, agentById } from '../data/agents'
import { MAPS, mapById } from '../data/maps'
import { useStore } from '../store'

export function Lineups() {
  const { lineups, addLineup, removeLineup } = useStore()
  const [map, setMap] = useState(MAPS[0].id)
  const [agentId, setAgentId] = useState(AGENTS[0].id)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState('all')

  const shown = lineups.filter((l) => filter === 'all' || l.map === filter)

  return (
    <div className="page">
      <div className="page-head">
        <h2>LINEUPS</h2>
        <label className="field">
          表示マップ
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">すべて</option>
            {MAPS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
      </div>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          addLineup({ map, agentId, title: title.trim(), note })
          setTitle('')
          setNote('')
        }}
      >
        <select value={map} onChange={(e) => setMap(e.target.value)}>
          {MAPS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
          {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input placeholder="タイトル（例: A site 奥ダーツ）" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="立ち位置・照準・手順のメモ" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="primary" type="submit">追加</button>
      </form>
      <div className="list">
        {shown.map((l) => (
          <div key={l.id} className="list-item">
            <div>
              <strong>{l.title}</strong>
              <div className="muted">{mapById(l.map).name} / {agentById(l.agentId)?.name}</div>
              {l.note && <p>{l.note}</p>}
            </div>
            <button className="danger" onClick={() => removeLineup(l.id)}>削除</button>
          </div>
        ))}
        {!shown.length && <div className="muted">ラインナップのメモはまだありません。</div>}
      </div>
    </div>
  )
}
