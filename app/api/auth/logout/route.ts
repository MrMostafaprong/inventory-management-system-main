import { NextResponse } from 'next/server'
import { clearSessionCookieHeader } from '@/lib/server/auth'

export async function POST() {
  const res = NextResponse.json({ success: true, data: null })
  res.headers.set('Set-Cookie', clearSessionCookieHeader())
  return res
}
