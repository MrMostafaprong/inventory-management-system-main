// In-memory rate limiter (per process). Enough for single-node local deployment.
interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, max: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }
  if (b.count >= max) {
    return { allowed: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
  }
  b.count += 1
  return { allowed: true, retryAfterSec: 0 }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim().slice(0, 64)
  return 'local'
}

// Periodic cleanup to avoid unbounded growth
if (!(globalThis as Record<string, unknown>).__wmsRlCleanup) {
  ;(globalThis as Record<string, unknown>).__wmsRlCleanup = true
  setInterval(() => {
    const now = Date.now()
    for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k)
  }, 60_000).unref?.()
}
