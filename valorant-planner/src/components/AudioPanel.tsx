import { useEffect, useRef, useState } from 'react'
import { useCurrentPlan, useStore } from '../store'

export function AudioPanel() {
  const plan = useCurrentPlan()
  const step = useStore((s) => s.step)
  const setAudio = useStore((s) => s.setAudio)
  const audio = plan.steps[step].audio
  const [open, setOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState('')
  const rec = useRef<{ recorder: MediaRecorder; stream: MediaStream; step: number } | null>(null)

  const stop = () => {
    if (rec.current?.recorder.state === 'recording') rec.current.recorder.stop()
  }

  // 録音中にステップを切り替えたら、録音を止めて元のステップに添付する
  useEffect(() => {
    if (rec.current && rec.current.step !== step) stop()
  }, [step])
  useEffect(() => () => stop(), [])

  const start = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      const target = step
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecording(false)
        rec.current = null
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        const fr = new FileReader()
        fr.onload = () => setAudio(fr.result as string, target)
        fr.readAsDataURL(blob)
      }
      rec.current = { recorder, stream, step: target }
      recorder.start()
      setRecording(true)
    } catch {
      setError('マイクを使用できません（権限またはHTTPS接続を確認してください）')
    }
  }

  return (
    <div className="section">
      <button className={`wide ${open ? 'active' : ''}`} onClick={() => setOpen(!open)}>
        🎙 Audio {audio ? '●' : ''}
      </button>
      {open && (
        <div className="audio-panel">
          <div className="muted">STEP {step + 1} の音声メモ</div>
          <div className="row">
            {recording ? (
              <button className="danger" onClick={stop}>■ 停止</button>
            ) : (
              <button onClick={start}>● {audio ? '録り直す' : '録音'}</button>
            )}
            {audio && !recording && <button onClick={() => setAudio(undefined)}>削除</button>}
          </div>
          {recording && <div className="rec">● REC…</div>}
          {audio && !recording && <audio controls src={audio} />}
          {error && <div className="error">{error}</div>}
        </div>
      )}
    </div>
  )
}
