// Same-origin API client. Session travels in an httpOnly cookie — JS never sees it.
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, opts?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: opts?.method ?? 'GET',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    // empty / non-JSON
  }
  if (!res.ok) {
    const msg =
      (data as { error?: string } | null)?.error ??
      (res.status === 401 ? 'انتهت الجلسة — سجل الدخول مجدداً' : `خطأ ${res.status}`)
    throw new ApiError(msg, res.status)
  }
  return (data as { data?: T })?.data !== undefined ? (data as { data: T }).data : (data as T)
}
