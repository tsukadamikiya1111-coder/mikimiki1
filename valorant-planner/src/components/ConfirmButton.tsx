import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// confirm() が使えない環境（埋め込み表示など）でも動くよう、2回押しで確定する。
export function ConfirmButton({ onConfirm, children, className }: { onConfirm: () => void; children: ReactNode; className?: string }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button
      className={className}
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else setArmed(true)
      }}
    >
      {armed ? 'もう一度押して確定' : children}
    </button>
  )
}
