import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requirePermission, jsonError } from '@/lib/server/auth'
import { incomingSchema, zodErrorMessage } from '@/lib/server/validation'

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_transactions')
  if (!gate.ok) return gate.response
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT t.*, s.name AS supplier_name, i.name AS item_name
       FROM incoming_transactions t
       LEFT JOIN suppliers s ON s.id = t.supplier_id
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
  const parsed = incomingSchema.safeParse(body)
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400)

  const db = getDb()
  const d = parsed.data
  const supplier = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(d.supplier_id)
  if (!supplier) return jsonError('المورد غير موجود', 404)
  const item = db.prepare('SELECT id, quantity FROM items WHERE id = ?').get(d.item_id) as
    | { id: number; quantity: number }
    | undefined
  if (!item) return jsonError('الصنف غير موجود', 404)

  const total = Math.round(d.quantity * d.unit_price * 100) / 100
  const now = new Date().toISOString()

  // ذرّي: إدخال المعاملة + زيادة المخزون معاً
  const tx = db.transaction(() => {
    const info = db
      .prepare(
        'INSERT INTO incoming_transactions (supplier_id, item_id, quantity, unit_price, total_price, invoice_number, receipt_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(d.supplier_id, d.item_id, d.quantity, d.unit_price, total, d.invoice_number, d.receipt_date, d.notes, now)
    db.prepare('UPDATE items SET quantity = quantity + ?, last_updated = ? WHERE id = ?').run(
      d.quantity, now, d.item_id
    )
    return Number(info.lastInsertRowid)
  })
  let newId: number
  try {
    newId = tx()
  } catch {
    return jsonError('تعذر تسجيل المعاملة', 500)
  }
  const row = db
    .prepare(
      `SELECT t.*, s.name AS supplier_name, i.name AS item_name
       FROM incoming_transactions t
       LEFT JOIN suppliers s ON s.id = t.supplier_id
       LEFT JOIN items i ON i.id = t.item_id
       WHERE t.id = ?`
    )
    .get(newId)
  return NextResponse.json({ success: true, data: row }, { status: 201 })
}
