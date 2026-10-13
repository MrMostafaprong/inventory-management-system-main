import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requirePermission, jsonError } from '@/lib/server/auth'
import { expenseSchema, zodErrorMessage } from '@/lib/server/validation'

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_expenses')
  if (!gate.ok) return gate.response
  const db = getDb()
  const rows = db.prepare('SELECT * FROM expenses ORDER BY id DESC').all()
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_expenses')
  if (!gate.ok) return gate.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('طلب غير صالح', 400)
  }
  const parsed = expenseSchema.safeParse(body)
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400)

  const db = getDb()
  const now = new Date().toISOString()
  const d = parsed.data
  const info = db
    .prepare('INSERT INTO expenses (category, amount, description, expense_date, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(d.category, d.amount, d.description, d.expense_date, now)
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(Number(info.lastInsertRowid))
  return NextResponse.json({ success: true, data: row }, { status: 201 })
}
