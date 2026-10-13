import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb, publicUser, type UserRow } from '@/lib/server/db'
import { signSession, sessionCookieHeader, type SessionUser } from '@/lib/server/auth'
import { loginSchema, zodErrorMessage } from '@/lib/server/validation'
import { rateLimit, clientIp } from '@/lib/server/rate-limit'

export async function POST(req: NextRequest) {
  // حدّ صارم ضد التخمين
  const rl = rateLimit(`login:${clientIp(req)}`, 10, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: `محاولات كثيرة — حاول بعد ${rl.retryAfterSec} ثانية` },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'طلب غير صالح' }, { status: 400 })
  }
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: zodErrorMessage(parsed.error) }, { status: 400 })
  }

  // تأخير ثابت لإبطاء التخمين
  await new Promise((r) => setTimeout(r, 400))

  const db = getDb()
  const row = db
    .prepare('SELECT * FROM users WHERE lower(username) = lower(?)')
    .get(parsed.data.username) as UserRow | undefined

  // رسالة موحدة لمنع تعداد المستخدمين
  const fail = () =>
    NextResponse.json({ success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })

  if (!row) return fail()
  const ok = await bcrypt.compare(parsed.data.password, row.password_hash)
  if (!ok) return fail()

  const pub = publicUser(row)
  const session: SessionUser = {
    id: pub.id, name: pub.name, username: pub.username, role: pub.role, permissions: pub.permissions,
  }
  const token = await signSession(session)
  const res = NextResponse.json({ success: true, data: session })
  res.headers.set('Set-Cookie', sessionCookieHeader(token))
  return res
}
