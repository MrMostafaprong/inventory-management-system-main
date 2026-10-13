// Helpers أمنية مشتركة: تجزئة كلمات المرور، تنظيف المدخلات، والتحقق من السلامة.
// ملاحظة صريحة: هذا تطبيق Frontend فقط (localStorage) — لا يوجد backend،
// لذلك هذه الإجراءات "تحسين دفاعي" وليست حماية كاملة ضد مهاجم يملك DevTools.

const SALT = 'wms-v1::'

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// SHA-256 عبر WebCrypto، مع fallback متزامن بسيط (FNV-1a) عند عدم التوفر.
export async function hashPassword(password: string): Promise<string> {
  const input = SALT + password
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(input)
      )
      return 'sha256$' + bytesToHex(digest)
    }
  } catch {
    // fallthrough إلى fallback
  }
  return 'fnv$' + fnv1a(input)
}

function fnv1a(str: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

// مقارنة كلمة مرور نصية مع قيمة مخزنة (تدعم الحسابات القديمة plaintext للترحيل).
export async function verifyPassword(
  plain: string,
  stored: string
): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (stored.startsWith('sha256$') || stored.startsWith('fnv$')) {
    const h = await hashPassword(plain)
    return { ok: timingSafeEqual(h, stored), needsRehash: false }
  }
  // حساب قديم بكلمة مرور نصية — نقارن ثم نطلب إعادة تجزئة
  return { ok: plain === stored, needsRehash: true }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// تنظيف نص حر: إزالة محارف التحكم + قص + حد أقصى للطول
export function sanitizeText(value: string, maxLen = 200): string {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen)
}

export function normalizeUsername(value: string): string {
  return sanitizeText(value, 64).toLowerCase()
}

// توقيع بسيط للجلسة لكشف العبث بـ sessionStorage (ليس بديلاً عن backend).
export async function signSession(payload: string): Promise<string> {
  return hashPassword('session:' + payload)
}

// قائمة الصلاحيات المسموحة — أي صلاحية خارجها تُرفض (حماية من حقن صلاحيات).
export const ALLOWED_PERMISSIONS = [
  'dashboard',
  'manage_items',
  'manage_suppliers',
  'manage_transactions',
  'manage_expenses',
  'view_daily_balance',
  'view_reports',
  'view_stock_status',
  'view_alerts',
  'manage_checklists',
  'manage_users',
] as const

export function filterPermissions(perms: string[]): string[] {
  const allowed = new Set<string>(ALLOWED_PERMISSIONS as readonly string[])
  return Array.from(new Set(perms)).filter((p) => allowed.has(p))
}

export function isStrongPassword(pw: string): boolean {
  return pw.length >= 8
}
