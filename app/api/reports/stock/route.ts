import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requirePermission } from '@/lib/server/auth'

// تقرير حالة المخزون — يُحسب لحظياً من الأصناف وآخر سعر شراء.

function stockStatus(qty: number, reorder: number) {
  if (qty <= reorder * 0.5) return 'critical' as const
  if (qty <= reorder) return 'low' as const
  if (qty > reorder * 3) return 'overstocked' as const
  return 'normal' as const
}

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, 'view_stock_status')
  if (!gate.ok) return gate.response
  const db = getDb()
  const items = db.prepare('SELECT * FROM items ORDER BY id ASC').all() as Array<{
    id: number; name: string; category: string; quantity: number; reorder_level: number
  }>
  const data = items.map((i) => {
    const price = (
      db.prepare('SELECT unit_price FROM incoming_transactions WHERE item_id = ? ORDER BY id DESC LIMIT 1').get(i.id) as
        | { unit_price: number } | undefined
    )?.unit_price ?? 0
    return {
      item_id: i.id,
      item_name: i.name,
      category: i.category,
      current_quantity: i.quantity,
      reorder_level: i.reorder_level,
      status: stockStatus(i.quantity, i.reorder_level),
      value: i.quantity * price,
    }
  })
  return NextResponse.json({ success: true, data })
}
