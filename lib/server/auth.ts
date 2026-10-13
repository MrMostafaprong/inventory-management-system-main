// Server auth: JWT in httpOnly cookie + RBAC gates. Passwords never leave the server.
import { SignJWT, jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { getDb, publicUser, type UserRow } from './db'

export const SESSION_COOKIE = 'wms_session'
const SESSION_MAX_AGE = 60 * 60 * 12 // 12h

export interface SessionUser {
  id: number
  name: string
  username: string
  role: string
  permissions: string[]
}

function secretPath() {
  return path.join(process.cwd(), 'data', '.jwt-secret')
}

export function getSecret(): Uint8Array {
  const p = secretPath()
  try {
    const raw = fs.readFileSync(p, 'utf8').trim()
    if (raw.length >= 32) return new TextEncoder().encode(raw)
  } catch {}
  const fresh = crypto.randomBytes(48).toString('hex')
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, fresh, { mode: 0o600 })
  return new TextEncoder().encode(fresh)
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (typeof payload.sub !== 'string') return null
    return {
      id: Number(payload.sub),
      name: String(payload.name ?? ''),
      username: String(payload.username ?? ''),
      role: String(payload.role ?? 'custom'),
      permissions: Array.isArray(payload.permissions) ? payload.permissions.map(String) : [],
    }
  } catch {
    return null
  }
}

export function sessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}${secure}`
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}

/** Read session from request cookie AND re-validate against DB (fresh role/permissions). */
export async function getSession(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  const claims = await verifySessionToken(token)
  if (!claims) return null
  try {
    const db = getDb()
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(claims.id) as UserRow | undefined
    if (!row) return null
    const pub = publicUser(row)
    return { id: pub.id, name: pub.name, username: pub.username, role: pub.role, permissions: pub.permissions }
  } catch {
    return null
  }
}

export function hasPermission(user: SessionUser, perm: string): boolean {
  if (user.role === 'owner') return true
  return user.permissions.includes(perm)
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status })
}

/** Gate: must be logged in. Returns {ok:true,user} or {ok:false,response:401}. */
export async function requireAuth(
  req: NextRequest
): Promise<{ ok: true; user: SessionUser } | { ok: false; response: NextResponse }> {
  const user = await getSession(req)
  if (!user) return { ok: false, response: jsonError('غير مصرح — سجل الدخول أولاً', 401) }
  return { ok: true, user }
}

/** Gate: must be logged in AND have permission (owner bypasses). */
export async function requirePermission(
  req: NextRequest,
  perm: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; response: NextResponse }> {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth
  if (!hasPermission(auth.user, perm)) {
    return { ok: false, response: jsonError('صلاحيات غير كافية', 403) }
  }
  return auth
}
