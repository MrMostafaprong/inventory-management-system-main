import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requirePermission, jsonError } from '@/lib/server/auth'
import { itemSchema, zodErrorMessage } from '@/lib/server/validation'

function getId(req: NextRequest): number | null {
  const parts = req.nextUrl.pathname.split('/')
  const id = Number(parts[parts.length - 1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function PUT(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_items')
  if (!gate.ok) return gate.response
  const id = getId(req)
  if (!id) return jsonError('معرف غير صالح', 400)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('طلب غير صالح', 400)
  }
  const parsed = itemSchema.safeParse(body)
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400)

  const db = getDb()
  const exists = db.prepare('SELECT id FROM items WHERE id = ?').get(id)
  if (!exists) return jsonError('الصنف غير موجود', 404)

  const now = new Date().toISOString()
  const d = parsed.data
  db.prepare(
    'UPDATE items SET name = ?, category = ?, unit_of_measure = ?, quantity = ?, reorder_level = ?, last_updated = ? WHERE id = ?'
  ).run(d.name, d.category, d.unit_of_measure, Math.floor(d.quantity), Math.floor(d.reorder_level), now, id)
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id)
  return NextResponse.json({ success: true, data: row })
}

export async function DELETE(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_items')
  if (!gate.ok) return gate.response
  const id = getId(req)
  if (!id) return jsonError('معرف غير صالح', 400)

  const db = getDb()
  const exists = db.prepare('SELECT id FROM items WHERE id = ?').get(id)
  if (!exists) return jsonError('الصنف غير موجود', 404)
  try {
    db.prepare('DELETE FROM items WHERE id = ?').run(id)
  } catch {
    return jsonError('لا يمكن حذف صنف مرتبط بمعاملات — احذف المعاملات أولاً', 409)
  }
  return NextResponse.json({ success: true, data: null })
}
