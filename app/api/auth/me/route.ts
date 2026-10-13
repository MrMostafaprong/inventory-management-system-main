import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response
  return NextResponse.json({ success: true, data: auth.user })
}
