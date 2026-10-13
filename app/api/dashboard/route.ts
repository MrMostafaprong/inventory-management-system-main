import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth } from '@/lib/server/auth'
import { computeAlerts } from '@/lib/server/alerts'

// All figures computed from live DB data — no more static mocks.
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response
  const db = getDb()

  const today = new Date().toISOString().split('T')[0]
  const month = today.slice(0, 7)

  const items = db.prepare('SELECT COUNT(*) AS c FROM items').get() as { c: number }
  const suppliers = db.prepare("SELECT COUNT(*) AS c FROM suppliers WHERE status = 'active'").get() as { c: number }
  const alerts = computeAlerts(db)
  const unread = alerts.filter((a) => !a.is_read).length
  const lowStock = alerts.filter((a) => a.alert_type === 'low_stock').length

  const lastPrice = (itemId: number): number => {
    const r = db
      .prepare('SELECT unit_price FROM incoming_transactions WHERE item_id = ? ORDER BY id DESC LIMIT 1')
      .get(itemId) as { unit_price: number } | undefined
    return r?.unit_price ?? 0
  }
  const allItems = db.prepare('SELECT id, quantity FROM items').all() as Array<{ id: number; quantity: number }>
  const stockValue = allItems.reduce((s, i) => s + i.quantity * lastPrice(i.id), 0)

  const sumCol = (table: string, col: string, dateCol: string, like: string): number => {
    const r = db.prepare(`SELECT COALESCE(SUM(${col}),0) AS s FROM ${table} WHERE ${dateCol} LIKE ?`).get(`${like}%`) as { s: number }
    return r.s
  }

  const recentAlerts = alerts.filter((a) => !a.is_read).slice(0, 3)
  const recentIncoming = db
    .prepare(
      `SELECT t.*, s.name AS supplier_name, i.name AS item_name FROM incoming_transactions t
       LEFT JOIN suppliers s ON s.id = t.supplier_id LEFT JOIN items i ON i.id = t.item_id
       ORDER BY t.id DESC LIMIT 4`
    )
    .all()
  const recentOutgoing = db
    .prepare(
      `SELECT t.*, i.name AS item_name FROM outgoing_transactions t
       LEFT JOIN items i ON i.id = t.item_id ORDER BY t.id DESC LIMIT 4`
    )
    .all()

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        total_items: items.c,
        total_suppliers: suppliers.c,
        low_stock_items: lowStock,
        total_stock_value: stockValue,
        today_incoming: sumCol('incoming_transactions', 'total_price', 'receipt_date', today),
        today_outgoing: sumCol('outgoing_transactions', 'total_price', 'sale_date', today),
        monthly_expenses: sumCol('expenses', 'amount', 'expense_date', month),
        unread_alerts: unread,
      },
      recentAlerts,
      recentIncoming,
      recentOutgoing,
    },
  })
}
