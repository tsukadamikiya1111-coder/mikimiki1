// 取り込んだ画像を縮小して data URL にする（IndexedDB の肥大化を防ぐ）。
export function loadImage(file: File, maxSide = 800): Promise<{ href: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('画像を読み込めませんでした'))
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height))
        const w = Math.round(img.width * k), h = Math.round(img.height * k)
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        c.getContext('2d')!.drawImage(img, 0, 0, w, h)
        const keepAlpha = file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif'
        resolve({ href: keepAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85), w, h })
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
