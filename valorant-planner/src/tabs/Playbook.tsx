import { ConfirmButton } from '../components/ConfirmButton'
import { PlanPreview } from '../components/PlanPreview'
import { mapById } from '../data/maps'
import { useStore } from '../store'

export function Playbook() {
  const { plans, currentId, switchPlan, setTab, createPlan, duplicatePlan, deletePlan } = useStore()
  return (
    <div className="page">
      <div className="page-head">
        <h2>PLAYBOOK</h2>
        <button className="primary" onClick={createPlan}>＋ 新しい戦術</button>
      </div>
      <div className="cards">
        {plans.map((p) => {
          const used = p.steps.filter((st) => st.items.length || st.audio).length
          return (
            <div key={p.id} className={`card ${p.id === currentId ? 'current' : ''}`}>
              <div
                className="card-thumb"
                onClick={() => { switchPlan(p.id); setTab('STRATEGY') }}
              >
                {p.thumbnail ? <img src={p.thumbnail} alt="" /> : <PlanPreview mapId={p.map} side={p.side} items={p.steps[0].items} />}
              </div>
              <div className="card-body">
                <strong>{p.name || '(無題)'}</strong>
                <span className="muted">
                  {mapById(p.map).name} / {p.side === 'attack' ? 'Attack' : 'Defense'} / {used} step
                </span>
                <div className="row">
                  <button onClick={() => { switchPlan(p.id); setTab('STRATEGY') }}>開く</button>
                  <button onClick={() => duplicatePlan(p.id)}>複製</button>
                  <ConfirmButton className="danger" onConfirm={() => deletePlan(p.id)}>削除</ConfirmButton>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
