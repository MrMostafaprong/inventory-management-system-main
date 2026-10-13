import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requirePermission, jsonError } from '@/lib/server/auth'
import { outgoingSchema, zodErrorMessage } from '@/lib/server/validation'

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_transactions')
  if (!gate.ok) return gate.response
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT t.*, i.name AS item_name
       FROM outgoing_transactions t
       LEFT JOIN items i ON i.id = t.item_id
       ORDER BY t.id DESC`
    )
    .all()
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_transactions')
  if (!gate.ok) return gate.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('طلب غير صالح', 400)
  }
  const parsed = outgoingSchema.safeParse(body)
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400)

  const db = getDb()
  const d = parsed.data
  const item = db.prepare('SELECT id, quantity FROM items WHERE id = ?').get(d.item_id) as
    | { id: number; quantity: number }
    | undefined
  if (!item) return jsonError('الصنف غير موجود', 404)
  // منع البيع أكثر من المتاح — فحص داخل المعاملة الذرية أيضاً
  if (item.quantity < d.quantity) {
    return jsonError(`الكمية المتاحة (${item.quantity}) لا تكفي`, 409)
  }

  const total = Math.round(d.quantity * d.unit_price * 100) / 100
  const now = new Date().toISOString()

  const tx = db.transaction(() => {
    const current = db.prepare('SELECT quantity FROM items WHERE id = ?').get(d.item_id) as { quantity: number }
    if (current.quantity < d.quantity) throw new Error('INSUFFICIENT')
    const info = db
      .prepare(
        'INSERT INTO outgoing_transactions (item_id, quantity, unit_price, total_price, sale_date, destination, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(d.item_id, d.quantity, d.unit_price, total, d.sale_date, d.destination, d.notes, now)
    db.prepare('UPDATE items SET quantity = quantity - ?, last_updated = ? WHERE id = ?').run(
      d.quantity, now, d.item_id
    )
    return Number(info.lastInsertRowid)
  })
  let newId: number
  try {
    newId = tx()
  } catch {
    return jsonError('الكمية المتاحة لا تكفي', 409)
  }
  const row = db
    .prepare(
      `SELECT t.*, i.name AS item_name
       FROM outgoing_transactions t
       LEFT JOIN items i ON i.id = t.item_id
       WHERE t.id = ?`
    )
    .get(newId)
  return NextResponse.json({ success: true, data: row }, { status: 201 })
}
