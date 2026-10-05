import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import { MAPS, mapById, siteRect } from '../data/maps'
import { hit, moveItem, topHit } from '../geometry'
import { uid, useCurrentPlan, useStore } from '../store'
import type { Item } from '../types'
import { Items, SelectionBox } from './ItemView'
import { MapArt } from './MapArt'
import { exportPng } from './PlanPreview'

type Drag =
  | { kind: 'move'; id: string; x: number; y: number }
  | { kind: 'erase'; pushed: boolean }
  | { kind: 'pen' }
  | { kind: 'arrow'; x: number; y: number }

interface TextEdit {
  id?: string
  x: number
  y: number
  value: string
}

export function MapCanvas() {
  const plan = useCurrentPlan()
  const s = useStore()
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<Drag | null>(null)
  const [draft, setDraftState] = useState<Item | null>(null)
  const draftRef = useRef<Item | null>(null)
  const setDraft = (it: Item | null) => {
    draftRef.current = it
    setDraftState(it)
  }
  const [textEdit, setTextEdit] = useState<TextEdit | null>(null)
  const committed = useRef(false)

  const [hoverSite, setHoverSite] = useState<string | null>(null)
  const [pinnedSite, setPinnedSite] = useState<string | null>(null)
  const mapDef = mapById(plan.map)
  const sites = mapDef.sites.map((site) => ({ label: site.label, rect: siteRect(mapDef, site) }))
  const siteAt = (x: number, y: number) =>
    sites.find(({ rect: [rx, ry, rw, rh] }) => x >= rx && x <= rx + rw && y >= ry && y <= ry + rh)?.label ?? null
  const activeSite = hoverSite ?? pinnedSite

  // マップを切り替えたらサイトのハイライトを解除
  useEffect(() => {
    setHoverSite(null)
    setPinnedSite(null)
  }, [plan.map])

  const items = plan.steps[s.step].items
  const ghost = s.onion && s.step > 0 ? plan.steps[s.step - 1].items : null
  const selected = items.find((i) => i.id === s.selectedId)

  const toPoint = (e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current!
    const m = svg.getScreenCTM()!.inverse()
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m)
    return { x: Math.max(0, Math.min(1000, pt.x)), y: Math.max(0, Math.min(1000, pt.y)) }
  }

  const eraseAt = (x: number, y: number, d: { kind: 'erase'; pushed: boolean }) => {
    const st = useStore.getState()
    const cur = st.plans.find((p) => p.id === st.currentId) ?? st.plans[0]
    const ids = cur.steps[st.step].items.filter((i) => hit(i, x, y, 8)).map((i) => i.id)
    if (!ids.length) return
    if (!d.pushed) {
      st.pushHistory()
      d.pushed = true
    }
    st.removeMany(ids)
  }

  const onPointerDown = (e: RPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 || textEdit) return
    const { x, y } = toPoint(e)
    const st = useStore.getState()
    switch (st.tool) {
      case 'select': {
        const t = topHit(items, x, y)
        st.select(t?.id ?? null)
        if (!t) {
          const site = siteAt(x, y)
          setPinnedSite((cur) => (site && cur !== site ? site : null))
        }
        if (t) {
          st.pushHistory()
          drag.current = { kind: 'move', id: t.id, x, y }
          e.currentTarget.setPointerCapture(e.pointerId)
        }
        break
      }
      case 'pen':
        drag.current = { kind: 'pen' }
        setDraft({ id: uid(), type: 'pen', points: [x, y], color: st.color, width: st.width })
        e.currentTarget.setPointerCapture(e.pointerId)
        break
      case 'arrow':
        drag.current = { kind: 'arrow', x, y }
        setDraft({ id: uid(), type: 'arrow', x1: x, y1: y, x2: x, y2: y, color: st.color, width: st.width })
        e.currentTarget.setPointerCapture(e.pointerId)
        break
      case 'eraser': {
        const d = { kind: 'erase' as const, pushed: false }
        drag.current = d
        eraseAt(x, y, d)
        e.currentTarget.setPointerCapture(e.pointerId)
        break
      }
      case 'text': {
        const t = topHit(items, x, y)
        if (t?.type === 'text') setTextEdit({ id: t.id, x: t.x, y: t.y, value: t.text })
        else setTextEdit({ x, y, value: '' })
        committed.current = false
        e.preventDefault()
        break
      }
      case 'stamp':
        st.addItem({ id: uid(), type: 'stamp', stamp: st.stamp, x, y, color: st.color, size: 56 })
        break
      case 'image':
        break
    }
  }

  const onPointerMove = (e: RPointerEvent<SVGSVGElement>) => {
    const d = drag.current
    const { x, y } = toPoint(e)
    if (!d) {
      const site = siteAt(x, y)
      if (site !== hoverSite) setHoverSite(site)
      return
    }
    if (d.kind === 'move') {
      const st = useStore.getState()
      const cur = st.plans.find((p) => p.id === st.currentId) ?? st.plans[0]
      const it = cur.steps[st.step].items.find((i) => i.id === d.id)
      if (it) st.replaceItem(moveItem(it, x - d.x, y - d.y))
      d.x = x
      d.y = y
    } else if (d.kind === 'erase') {
      eraseAt(x, y, d)
    } else if (d.kind === 'pen') {
      const cur = draftRef.current
      if (cur?.type !== 'pen') return
      const n = cur.points.length
      if (Math.hypot(x - cur.points[n - 2], y - cur.points[n - 1]) >= 2.5) setDraft({ ...cur, points: [...cur.points, x, y] })
    } else if (d.kind === 'arrow') {
      const cur = draftRef.current
      if (cur?.type === 'arrow') setDraft({ ...cur, x2: x, y2: y })
    }
  }

  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (d.kind === 'pen' || d.kind === 'arrow') {
      const cur = draftRef.current
      if (cur && (cur.type !== 'arrow' || Math.hypot(cur.x2 - cur.x1, cur.y2 - cur.y1) > 8)) useStore.getState().addItem(cur)
      setDraft(null)
    }
  }

  const onDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (useStore.getState().tool !== 'select') return
    const { x, y } = toPoint(e)
    const t = topHit(items, x, y)
    if (t?.type === 'text') {
      committed.current = false
      setTextEdit({ id: t.id, x: t.x, y: t.y, value: t.text })
    }
  }

  const commitText = () => {
    if (committed.current || !textEdit) return
    committed.current = true
    const value = textEdit.value.trim()
    const st = useStore.getState()
    if (textEdit.id) {
      if (!value) st.removeItem(textEdit.id)
      else {
        const it = items.find((i) => i.id === textEdit.id)
        if (it?.type === 'text' && it.text !== value) {
          st.pushHistory()
          st.replaceItem({ ...it, text: value })
        }
      }
    } else if (value) {
      st.addItem({ id: uid(), type: 'text', x: textEdit.x, y: textEdit.y, text: value, color: st.color, size: 32 })
    }
    setTextEdit(null)
  }

  const onDrop = (e: React.DragEvent) => {
    const agentId = e.dataTransfer.getData('application/x-agent')
    if (!agentId) return
    e.preventDefault()
    const { x, y } = toPoint(e)
    const st = useStore.getState()
    st.addItem({ id: uid(), type: 'agent', agentId, team: st.team, x, y, size: 64 })
    st.setTool('select')
  }

  // キーボードショートカット（入力欄の中では無効）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return
      const st = useStore.getState()
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        e.shiftKey ? st.redo() : st.undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        st.redo()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && st.selectedId) {
        e.preventDefault()
        st.removeItem(st.selectedId)
      } else if (e.key === 'Escape') {
        st.select(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const cursor = { select: 'default', pen: 'crosshair', eraser: 'cell', text: 'text', image: 'default', arrow: 'crosshair', stamp: 'copy' }[s.tool]

  return (
    <div className="canvas-area">
      <div className="canvas-bar">
        <label className="field">
          MAP
          <select value={plan.map} onChange={(e) => s.patchPlan({ map: e.target.value })}>
            {MAPS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
        <div className="site-chips" title="サイト範囲をハイライト">
          {sites.map(({ label }) => (
            <button
              key={label}
              className={activeSite === label ? 'active' : ''}
              onMouseEnter={() => setHoverSite(label)}
              onMouseLeave={() => setHoverSite(null)}
              onClick={() => setPinnedSite((cur) => (cur === label ? null : label))}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="badge">STEP {s.step + 1} / 10</span>
        <span className="spacer" />
        <button disabled={!s.past.length} onClick={s.undo} title="元に戻す (Ctrl+Z)">↶ Undo</button>
        <button disabled={!s.future.length} onClick={s.redo} title="やり直し (Ctrl+Y)">↷ Redo</button>
        <button onClick={() => exportPng(plan.map, plan.side, items, `${plan.name}-step${s.step + 1}.png`)}>PNG保存</button>
      </div>
      <div className="canvas-wrap">
        <div className="canvas-box" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <svg
            ref={svgRef}
            viewBox="0 0 1000 1000"
            style={{ cursor, touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={onDoubleClick}
            onPointerLeave={() => setHoverSite(null)}
          >
            <MapArt mapId={plan.map} side={plan.side} />
            {sites.map(({ label, rect: [x, y, w, h] }) =>
              label === activeSite ? (
                <g key={label} pointerEvents="none">
                  <rect x={x} y={y} width={w} height={h} rx={6} fill="rgba(255,70,85,0.18)" stroke="#ffd166" strokeWidth={3} strokeDasharray="10 6" />
                  <text x={x + w / 2} y={y - 8} textAnchor="middle" fontSize={22} fontWeight={800} fill="#ffd166" stroke="#0b131a" strokeWidth={4} paintOrder="stroke">
                    {label} SITE
                  </text>
                </g>
              ) : null,
            )}
            {ghost && (
              <g opacity={0.22} pointerEvents="none">
                <Items items={ghost} />
              </g>
            )}
            <Items items={items} />
            {draft && <Items items={[draft]} />}
            {selected && s.tool === 'select' && <SelectionBox item={selected} />}
          </svg>
          {textEdit && (
            <input
              className="text-input"
              autoFocus
              style={{ left: `${textEdit.x / 10}%`, top: `${textEdit.y / 10}%` }}
              value={textEdit.value}
              placeholder="テキスト…"
              onChange={(e) => setTextEdit({ ...textEdit, value: e.target.value })}
              onBlur={commitText}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitText()
                if (e.key === 'Escape') {
                  committed.current = true
                  setTextEdit(null)
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
