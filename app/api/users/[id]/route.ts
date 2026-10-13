import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb, publicUser, type UserRow } from '@/lib/server/db'
import { requirePermission, jsonError } from '@/lib/server/auth'
import { userUpdateSchema, zodErrorMessage } from '@/lib/server/validation'

function getId(req: NextRequest): number | null {
  const parts = req.nextUrl.pathname.split('/')
  const id = Number(parts[parts.length - 1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function PATCH(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_users')
  if (!gate.ok) return gate.response
  const id = getId(req)
  if (!id) return jsonError('معرف غير صالح', 400)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('طلب غير صالح', 400)
  }
  const parsed = userUpdateSchema.safeParse(body)
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400)

  const db = getDb()
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
  if (!target) return jsonError('المستخدم غير موجود', 404)
  if (target.role === 'owner') return jsonError('لا يمكن تعديل مالك العمل من هنا', 403)

  const d = parsed.data
  if (d.username) {
    const conflict = db
      .prepare('SELECT id FROM users WHERE lower(username) = lower(?) AND id != ?')
      .get(d.username, id) as { id: number } | undefined
    if (conflict) return jsonError('اسم المستخدم موجود بالفعل', 409)
  }

  const fields: string[] = []
  const values: unknown[] = []
  if (d.name !== undefined) { fields.push('name = ?'); values.push(d.name) }
  if (d.username !== undefined) { fields.push('username = ?'); values.push(d.username) }
  if (d.role !== undefined) { fields.push('role = ?'); values.push(d.role) }
  if (d.permissions !== undefined) { fields.push('permissions = ?'); values.push(JSON.stringify(d.permissions)) }
  if (d.password !== undefined && d.password !== '') {
    if (d.password.length < 8) return jsonError('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 400)
    fields.push('password_hash = ?')
    values.push(await bcrypt.hash(d.password, 12))
  }
  if (fields.length === 0) {
    return NextResponse.json({ success: true, data: publicUser(target) })
  }
  values.push(id)
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow
  return NextResponse.json({ success: true, data: publicUser(row) })
}

export async function DELETE(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_users')
  if (!gate.ok) return gate.response
  const id = getId(req)
  if (!id) return jsonError('معرف غير صالح', 400)

  const db = getDb()
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
  if (!target) return jsonError('المستخدم غير موجود', 404)
  if (target.role === 'owner') return jsonError('لا يمكن حذف مالك العمل', 403)
  if (gate.user.id === id) return jsonError('لا يمكنك حذف حسابك الحالي', 403)

  db.prepare('DELETE FROM users WHERE id = ?').run(id)
  return NextResponse.json({ success: true, data: null })
}
