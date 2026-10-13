import { NextRequest, NextResponse } from 'next/server'

// Security headers + pragmatic CSRF for /api mutations:
// - same-origin fetch always carries Origin (POST) — enforce match
// - allow missing Origin+Referer (curl / non-browser), block mismatched
export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  const { pathname } = req.nextUrl
  const method = req.method.toUpperCase()
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const host = req.headers.get('host') ?? ''
    const origin = req.headers.get('origin')
    const referer = req.headers.get('referer')
    const originHost = origin ? safeHost(origin) : null
    const refererHost = !originHost && referer ? safeHost(referer) : null
    const claimed = originHost ?? refererHost
    // claimed === null → non-browser client (curl): allow (auth cookie still required)
    if (claimed && claimed !== host) {
      return NextResponse.json({ success: false, error: 'طلب مرفوض (CSRF)' }, { status: 403 })
    }
  }
  return res
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host
  } catch {
    return 'invalid'
  }
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}
