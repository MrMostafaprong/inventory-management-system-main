import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requirePermission, jsonError } from '@/lib/server/auth'
import { checklistSchema, zodErrorMessage } from '@/lib/server/validation'

function getId(req: NextRequest): number | null {
  const parts = req.nextUrl.pathname.split('/')
  const id = Number(parts[parts.length - 1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function PUT(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_checklists')
  if (!gate.ok) return gate.response
  const id = getId(req)
  if (!id) return jsonError('معرف غير صالح', 400)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('طلب غير صالح', 400)
  }
  // تحديث كامل أو جزئي (toggleStatus يرسل status فقط)
  const partial = checklistSchema.partial()
  const parsed = partial.safeParse(body)
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400)

  const db = getDb()
  const exists = db.prepare('SELECT id FROM checklists WHERE id = ?').get(id)
  if (!exists) return jsonError('المهمة غير موجودة', 404)

  const d = parsed.data
  const fields: string[] = []
  const values: unknown[] = []
  if (d.title !== undefined) { fields.push('title = ?'); values.push(d.title) }
  if (d.description !== undefined) { fields.push('description = ?'); values.push(d.description) }
  if (d.status !== undefined) { fields.push('status = ?'); values.push(d.status) }
  if (d.due_date !== undefined) { fields.push('due_date = ?'); values.push(d.due_date) }
  if (fields.length === 0) return jsonError('لا توجد بيانات للتحديث', 400)

  // تحقق إضافي: الحقول المرسلة يجب أن تحقق شروطها الكاملة
  if (d.title !== undefined && d.title.length < 1) return jsonError('العنوان مطلوب', 400)
  values.push(id)
  db.prepare(`UPDATE checklists SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  const row = db.prepare('SELECT * FROM checklists WHERE id = ?').get(id)
  return NextResponse.json({ success: true, data: row })
}

export async function DELETE(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_checklists')
  if (!gate.ok) return gate.response
  const id = getId(req)
  if (!id) return jsonError('معرف غير صالح', 400)

  const db = getDb()
  const exists = db.prepare('SELECT id FROM checklists WHERE id = ?').get(id)
  if (!exists) return jsonError('المهمة غير موجودة', 404)
  db.prepare('DELETE FROM checklists WHERE id = ?').run(id)
  return NextResponse.json({ success: true, data: null })
}
