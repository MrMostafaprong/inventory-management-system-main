import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requirePermission, jsonError } from '@/lib/server/auth'
import { itemSchema, zodErrorMessage } from '@/lib/server/validation'

// القراءة: أي مستخدم مسجل (القوائم المنسدلة للمعاملات تحتاجها)
// الكتابة: manage_items
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response
  const db = getDb()
  const rows = db.prepare('SELECT * FROM items ORDER BY id ASC').all()
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_items')
  if (!gate.ok) return gate.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('طلب غير صالح', 400)
  }
  const parsed = itemSchema.safeParse(body)
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400)

  const db = getDb()
  const now = new Date().toISOString()
  const d = parsed.data
  const info = db
    .prepare(
      'INSERT INTO items (name, category, unit_of_measure, quantity, reorder_level, last_updated) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(d.name, d.category, d.unit_of_measure, Math.floor(d.quantity), Math.floor(d.reorder_level), now)
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(Number(info.lastInsertRowid))
  return NextResponse.json({ success: true, data: row }, { status: 201 })
}
