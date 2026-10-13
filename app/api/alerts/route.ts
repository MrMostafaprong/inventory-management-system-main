import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, jsonError } from '@/lib/server/auth'
import { computeAlerts } from '@/lib/server/alerts'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response
  const db = getDb()
  return NextResponse.json({ success: true, data: computeAlerts(db) })
}

const actionSchema = z.object({
  action: z.enum(['read', 'read-all', 'dismiss']),
  key: z.string().max(100).optional(),
})

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('طلب غير صالح', 400)
  }
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) return jsonError('إجراء غير صالح', 400)

  const db = getDb()
  const { action, key } = parsed.data

  if (action === 'read-all') {
    const alerts = computeAlerts(db)
    const tx = db.transaction(() => {
      for (const a of alerts) {
        db.prepare(
          'INSERT INTO alert_state (alert_key, is_read, dismissed) VALUES (?, 1, 0) ON CONFLICT(alert_key) DO UPDATE SET is_read = 1'
        ).run(a.key)
      }
    })
    tx()
    return NextResponse.json({ success: true, data: computeAlerts(db) })
  }

  if (!key) return jsonError('مفتاح التنبيه مطلوب', 400)
  if (action === 'read') {
    db.prepare(
      'INSERT INTO alert_state (alert_key, is_read, dismissed) VALUES (?, 1, 0) ON CONFLICT(alert_key) DO UPDATE SET is_read = 1'
    ).run(key)
  } else {
    db.prepare(
      'INSERT INTO alert_state (alert_key, is_read, dismissed) VALUES (?, 1, 1) ON CONFLICT(alert_key) DO UPDATE SET dismissed = 1'
    ).run(key)
  }
  return NextResponse.json({ success: true, data: computeAlerts(db) })
}
