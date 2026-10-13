import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requirePermission, jsonError } from '@/lib/server/auth'
import { supplierSchema, zodErrorMessage } from '@/lib/server/validation'

function getId(req: NextRequest): number | null {
  const parts = req.nextUrl.pathname.split('/')
  const id = Number(parts[parts.length - 1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function PUT(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_suppliers')
  if (!gate.ok) return gate.response
  const id = getId(req)
  if (!id) return jsonError('معرف غير صالح', 400)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('طلب غير صالح', 400)
  }
  const parsed = supplierSchema.safeParse(body)
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400)

  const db = getDb()
  const exists = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(id)
  if (!exists) return jsonError('المورد غير موجود', 404)

  const d = parsed.data
  db.prepare(
    'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, status = ? WHERE id = ?'
  ).run(d.name, d.contact_person, d.phone, d.email, d.address, d.status, id)
  const row = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id)
  return NextResponse.json({ success: true, data: row })
}

export async function DELETE(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_suppliers')
  if (!gate.ok) return gate.response
  const id = getId(req)
  if (!id) return jsonError('معرف غير صالح', 400)

  const db = getDb()
  const exists = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(id)
  if (!exists) return jsonError('المورد غير موجود', 404)
  try {
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id)
  } catch {
    return jsonError('لا يمكن حذف مورد مرتبط بمعاملات', 409)
  }
  return NextResponse.json({ success: true, data: null })
}
