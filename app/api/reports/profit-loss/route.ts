import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requirePermission } from '@/lib/server/auth'

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

function periodLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${AR_MONTHS[(m || 1) - 1]} ${y}`
}

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, 'view_reports')
  if (!gate.ok) return gate.response
  const db = getDb()

  const sales = db
    .prepare(
      "SELECT substr(sale_date, 1, 7) AS ym, COALESCE(SUM(total_price),0) AS s FROM outgoing_transactions GROUP BY ym"
    )
    .all() as Array<{ ym: string; s: number }>
  const purchases = db
    .prepare(
      "SELECT substr(receipt_date, 1, 7) AS ym, COALESCE(SUM(total_price),0) AS s FROM incoming_transactions GROUP BY ym"
    )
    .all() as Array<{ ym: string; s: number }>
  const expenses = db
    .prepare("SELECT substr(expense_date, 1, 7) AS ym, COALESCE(SUM(amount),0) AS s FROM expenses GROUP BY ym")
    .all() as Array<{ ym: string; s: number }>

  const map = new Map<string, { sales: number; purchases: number; expenses: number }>()
  const bump = (ym: string, k: 'sales' | 'purchases' | 'expenses', v: number) => {
    if (!ym) return
    const cur = map.get(ym) ?? { sales: 0, purchases: 0, expenses: 0 }
    cur[k] += v
    map.set(ym, cur)
  }
  sales.forEach((r) => bump(r.ym, 'sales', r.s))
  purchases.forEach((r) => bump(r.ym, 'purchases', r.s))
  expenses.forEach((r) => bump(r.ym, 'expenses', r.s))

  const data = [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 12)
    .map(([ym, v]) => {
      const gross = v.sales - v.purchases
      return {
        period: periodLabel(ym),
        total_sales: v.sales,
        total_purchases: v.purchases,
        total_expenses: v.expenses,
        gross_profit: gross,
        net_profit: gross - v.expenses,
      }
    })
  return NextResponse.json({ success: true, data })
}
