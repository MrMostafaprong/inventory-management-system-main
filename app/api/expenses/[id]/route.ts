import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requirePermission, jsonError } from '@/lib/server/auth'
import { expenseSchema, zodErrorMessage } from '@/lib/server/validation'

function getId(req: NextRequest): number | null {
  const parts = req.nextUrl.pathname.split('/')
  const id = Number(parts[parts.length - 1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function PUT(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_expenses')
  if (!gate.ok) return gate.response
  const id = getId(req)
  if (!id) return jsonError('معرف غير صالح', 400)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('طلب غير صالح', 400)
  }
  const parsed = expenseSchema.safeParse(body)
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400)

  const db = getDb()
  const exists = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id)
  if (!exists) return jsonError('المصروف غير موجود', 404)

  const d = parsed.data
  db.prepare('UPDATE expenses SET category = ?, amount = ?, description = ?, expense_date = ? WHERE id = ?').run(
    d.category, d.amount, d.description, d.expense_date, id
  )
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id)
  return NextResponse.json({ success: true, data: row })
}

export async function DELETE(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_expenses')
  if (!gate.ok) return gate.response
  const id = getId(req)
  if (!id) return jsonError('معرف غير صالح', 400)

  const db = getDb()
  const exists = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id)
  if (!exists) return jsonError('المصروف غير موجود', 404)
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id)
  return NextResponse.json({ success: true, data: null })
}
