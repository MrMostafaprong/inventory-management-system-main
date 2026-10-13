// Server-side alert computation (single source of truth for alerts + dashboard).
import type Database from 'better-sqlite3'

export interface ServerAlert {
  id: number
  key: string
  item_id: number
  item_name: string
  alert_type: 'low_stock' | 'overstocked'
  message: string
  is_read: boolean
  created_at: string
}

function stockStatus(qty: number, reorder: number): 'critical' | 'low' | 'normal' | 'overstocked' {
  if (qty <= reorder * 0.5) return 'critical'
  if (qty <= reorder) return 'low'
  if (qty > reorder * 3) return 'overstocked'
  return 'normal'
}

function hashKey(key: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return (h % 2_000_000_000) + 1
}

interface ItemRow { id: number; name: string; quantity: number; reorder_level: number }
interface StateRow { alert_key: string; is_read: number; dismissed: number }

export function computeAlerts(db: Database.Database): ServerAlert[] {
  const items = db.prepare('SELECT id, name, quantity, reorder_level FROM items').all() as ItemRow[]
  const states = db.prepare('SELECT alert_key, is_read, dismissed FROM alert_state').all() as StateRow[]
  const stateMap = new Map(states.map((s) => [s.alert_key, s]))
  const now = new Date().toISOString()
  const out: ServerAlert[] = []

  for (const item of items) {
    const status = stockStatus(item.quantity, item.reorder_level)
    const mk = (type: 'low_stock' | 'overstocked', message: string) => {
      const key = `${type}:${item.id}`
      const st = stateMap.get(key)
      if (st?.dismissed) return
      out.push({
        id: hashKey(key),
        key,
        item_id: item.id,
        item_name: item.name,
        alert_type: type,
        message,
        is_read: st?.is_read === 1,
        created_at: now,
      })
    }
    if (status === 'critical') {
      mk('low_stock', `مستوى المخزون (${item.quantity}) أقل من حد إعادة الطلب (${item.reorder_level})`)
    } else if (status === 'low') {
      mk('low_stock', `مستوى المخزون (${item.quantity}) يقترب من حد إعادة الطلب (${item.reorder_level})`)
    } else if (status === 'overstocked') {
      mk('overstocked', `مستوى المخزون (${item.quantity}) يتجاوز المستويات الطبيعية بشكل كبير`)
    }
  }
  return out
}
