import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requirePermission } from '@/lib/server/auth'

// الرصيد اليومي الحقيقي: لكل صنف — وارد/صادر التاريخ المطلوب + الرصيد الحالي
export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, 'view_daily_balance')
  if (!gate.ok) return gate.response

  const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ success: false, error: 'التاريخ غير صالح' }, { status: 400 })
  }

  const db = getDb()
  const items = db.prepare('SELECT * FROM items ORDER BY id ASC').all() as Array<{
    id: number; name: string; quantity: number
  }>

  const data = items.map((item, idx) => {
    const qIn = (
      db.prepare('SELECT COALESCE(SUM(quantity),0) AS s FROM incoming_transactions WHERE item_id = ? AND receipt_date = ?').get(item.id, date) as { s: number }
    ).s
    const qOut = (
      db.prepare('SELECT COALESCE(SUM(quantity),0) AS s FROM outgoing_transactions WHERE item_id = ? AND sale_date = ?').get(item.id, date) as { s: number }
    ).s
    const price = (
      db.prepare('SELECT unit_price FROM incoming_transactions WHERE item_id = ? ORDER BY id DESC LIMIT 1').get(item.id) as
        | { unit_price: number } | undefined
    )?.unit_price ?? 0
    const closing = item.quantity
    return {
      id: idx + 1,
      item_id: item.id,
      item_name: item.name,
      date,
      opening_balance: closing - qIn + qOut,
      quantity_in: qIn,
      quantity_out: qOut,
      closing_balance: closing,
      total_value: closing * price,
    }
  })
  return NextResponse.json({ success: true, data })
}
