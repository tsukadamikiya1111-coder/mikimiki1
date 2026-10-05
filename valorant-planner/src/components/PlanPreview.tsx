import { renderToStaticMarkup } from 'react-dom/server'
import { Items } from './ItemView'
import { MapArt } from './MapArt'
import type { Item, Side } from '../types'

export function PlanPreview({ mapId, side, items, className }: { mapId: string; side: Side; items: Item[]; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
      <MapArt mapId={mapId} side={side} />
      <Items items={items} />
    </svg>
  )
}

export function exportPng(mapId: string, side: Side, items: Item[], filename: string) {
  const markup = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width={1600} height={1600}>
      <MapArt mapId={mapId} side={side} />
      <Items items={items} />
    </svg>,
  )
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }))
  const img = new Image()
  img.onload = () => {
    const c = document.createElement('canvas')
    c.width = c.height = 1600
    c.getContext('2d')!.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)
    c.toBlob((b) => {
      if (!b) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(b)
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    })
  }
  img.src = url
}
