import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requirePermission, jsonError } from '@/lib/server/auth'
import { supplierSchema, zodErrorMessage } from '@/lib/server/validation'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response
  const db = getDb()
  const rows = db.prepare('SELECT * FROM suppliers ORDER BY id ASC').all()
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_suppliers')
  if (!gate.ok) return gate.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('طلب غير صالح', 400)
  }
  const parsed = supplierSchema.safeParse(body)
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400)

  const db = getDb()
  const now = new Date().toISOString()
  const d = parsed.data
  const info = db
    .prepare(
      'INSERT INTO suppliers (name, contact_person, phone, email, address, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(d.name, d.contact_person, d.phone, d.email, d.address, d.status, now)
  const row = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(Number(info.lastInsertRowid))
  return NextResponse.json({ success: true, data: row }, { status: 201 })
}
