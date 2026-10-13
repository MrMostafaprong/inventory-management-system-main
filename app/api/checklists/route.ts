import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requirePermission, jsonError } from '@/lib/server/auth'
import { checklistSchema, zodErrorMessage } from '@/lib/server/validation'

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_checklists')
  if (!gate.ok) return gate.response
  const db = getDb()
  const rows = db.prepare('SELECT * FROM checklists ORDER BY id DESC').all()
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, 'manage_checklists')
  if (!gate.ok) return gate.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('طلب غير صالح', 400)
  }
  const parsed = checklistSchema.safeParse(body)
  if (!parsed.success) return jsonError(zodErrorMessage(parsed.error), 400)

  const db = getDb()
  const now = new Date().toISOString()
  const d = parsed.data
  const info = db
    .prepare('INSERT INTO checklists (title, description, status, due_date, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(d.title, d.description, d.status, d.due_date, now)
  const row = db.prepare('SELECT * FROM checklists WHERE id = ?').get(Number(info.lastInsertRowid))
  return NextResponse.json({ success: true, data: row }, { status: 201 })
}
