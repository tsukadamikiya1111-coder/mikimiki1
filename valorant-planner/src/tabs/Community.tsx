import { useRef, useState } from 'react'
import { ConfirmButton } from '../components/ConfirmButton'
import { useStore } from '../store'

// 個人用ツールのため共有サーバは持たず、JSON のエクスポート/インポートで戦術を受け渡す。
export function Community() {
  const importAll = useStore((s) => s.importAll)
  const input = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [pending, setPending] = useState<Parameters<typeof importAll>[0] | null>(null)

  const exportJson = () => {
    const { plans, favorites, lineups, matches } = useStore.getState()
    const blob = new Blob([JSON.stringify({ app: 'val-planner', version: 1, plans, favorites, lineups, matches })], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `val-planner-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const importJson = async (file?: File) => {
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (data.app !== 'val-planner' || !Array.isArray(data.plans)) throw new Error('形式が違います')
      setPending(data)
      setMsg('読み込み準備ができました。下のボタンで現在のデータと置き換えます。')
    } catch (e) {
      setMsg(`インポートに失敗しました: ${(e as Error).message}`)
    }
  }

  return (
    <div className="page">
      <div className="page-head"><h2>COMMUNITY</h2></div>
      <p className="muted">個人用ツールのため共有サーバはありません。戦術・ラインナップ・試合記録をJSONで書き出して、バックアップや他の端末への移行に使えます。</p>
      <div className="row">
        <button className="primary" onClick={exportJson}>データを書き出す (JSON)</button>
        <button onClick={() => input.current?.click()}>データを読み込む</button>
        <input ref={input} type="file" accept="application/json" hidden onChange={(e) => { importJson(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      {msg && <p>{msg}</p>}
      {pending && (
        <div className="row">
          <ConfirmButton className="danger" onConfirm={() => { importAll(pending); setPending(null); setMsg('インポートしました。') }}>
            現在のデータを置き換える
          </ConfirmButton>
        </div>
      )}
    </div>
  )
}
