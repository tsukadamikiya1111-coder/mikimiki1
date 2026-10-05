import type { StateStorage } from 'zustand/middleware'

// 画像・音声(data URL)を含むため localStorage ではなく IndexedDB に保存する。
// 書き込みは頻繁（ドラッグ中など）なのでデバウンスする。
const DB = 'val-planner'
const STORE = 'kv'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(key: string): Promise<string | null> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE).objectStore(STORE).get(key)
    r.onsuccess = () => resolve((r.result as string | undefined) ?? null)
    r.onerror = () => reject(r.error)
  })
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function idbDel(key: string): Promise<void> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

let timer: ReturnType<typeof setTimeout> | undefined
let pending: { key: string; value: string } | undefined

const flush = () => {
  if (!pending) return
  const { key, value } = pending
  pending = undefined
  idbSet(key, value).catch((e) => console.error('save failed', e))
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flush)
  document.addEventListener('visibilitychange', () => document.hidden && flush())
}

export const idbStorage: StateStorage = {
  getItem: (name) => idbGet(name).catch(() => null),
  setItem: (name, value) => {
    pending = { key: name, value }
    clearTimeout(timer)
    timer = setTimeout(flush, 400)
  },
  removeItem: (name) => {
    pending = undefined
    return idbDel(name)
  },
}
