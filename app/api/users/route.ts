import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb, publicUser, type UserRow } from '@/lib/server/db'
import { requirePermission, jsonError } from '@/lib/server/auth'
import { userCreateSchema, zodErrorMessage } from '@/lib/server/validation'

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_users')
  if (!gate.ok) return gate.response
  const db = getDb()
  const rows = db.prepare('SELECT * FROM users ORDER BY id ASC').all() as UserRow[]
  // لا نرسل تجزئة كلمة المرور أبداً
  return NextResponse.json({ success: true, data: rows.map(publicUser) })
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_users')
  if (!gate.ok) return gate.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('طلب غير صالح', 400)
  }
  const parsed = userCreateSchema.safeParse(body)
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400)

  const db = getDb()
  const exists = db
    .prepare('SELECT id FROM users WHERE lower(username) = lower(?)')
    .get(parsed.data.username) as { id: number } | undefined
  if (exists) return jsonError('اسم المستخدم موجود بالفعل', 409)

  const now = new Date().toISOString()
  const hash = await bcrypt.hash(parsed.data.password, 12)
  try {
    const info = db
      .prepare(
        'INSERT INTO users (name, username, password_hash, role, permissions, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(parsed.data.name, parsed.data.username, hash, parsed.data.role, JSON.stringify(parsed.data.permissions), now)
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(info.lastInsertRowid)) as UserRow
    return NextResponse.json({ success: true, data: publicUser(row) }, { status: 201 })
  } catch {
    return jsonError('تعذر إنشاء المستخدم', 500)
  }
}
