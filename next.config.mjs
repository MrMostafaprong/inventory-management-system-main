/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server mode: الـ Backend (API routes + SQLite) يعمل داخل نفس السيرفر.
  // التصدير الثابت output:'export' لا يدعم API routes لذلك أُزيل.
  // ملاحظة: لا تفعّل trailingSlash — يكسر POST للـ API (تحويل 308 يضيّع الـ body).
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['better-sqlite3'],
  // يبقي الرابط العام ثابتاً مع تجنب مسار ملف يسبب panic في Turbopack
  async rewrites() {
    return [{ source: '/api/reports/stock-status', destination: '/api/reports/stock' }]
  },
}

export default nextConfig
