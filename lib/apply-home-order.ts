import type { Artwork } from "@/lib/artworks"

export function applyHomeOrder(items: Artwork[], orderedIds: readonly string[]) {
  if (!orderedIds.length) return items
  const byId = new Map(items.map((item) => [item.id, item]))
  const next: Artwork[] = []
  const used = new Set<string>()
  for (const id of orderedIds) {
    const item = byId.get(id)
    if (!item) continue
    next.push(item)
    used.add(id)
  }
  for (const item of items) {
    if (!used.has(item.id)) next.push(item)
  }
  return next
}
