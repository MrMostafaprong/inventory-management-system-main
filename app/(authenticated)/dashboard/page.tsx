'use client'

import * as React from 'react'
import {
  Package,
  Users,
  AlertTriangle,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  Bell,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DashboardStats, Alert, IncomingTransaction, OutgoingTransaction } from '@/lib/types'

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

interface DashboardData {
  stats: DashboardStats
  recentAlerts: Alert[]
  recentIncoming: IncomingTransaction[]
  recentOutgoing: OutgoingTransaction[]
}

const EMPTY_STATS: DashboardStats = {
  total_items: 0, total_suppliers: 0, low_stock_items: 0, total_stock_value: 0,
  today_incoming: 0, today_outgoing: 0, monthly_expenses: 0, unread_alerts: 0,
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null)

  React.useEffect(() => {
    void api<DashboardData>('/api/dashboard').then(setData).catch(() => {})
  }, [])

  const stats = data?.stats ?? EMPTY_STATS
  const recentAlerts = data?.recentAlerts ?? []
  const recentIncoming = data?.recentIncoming ?? []
  const recentOutgoing = data?.recentOutgoing ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
        <p className="text-muted-foreground">
          نظرة عامة على عمليات المستودع
        </p>
      </div>

      {/* شبكة الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الأصناف"
          value={stats.total_items}
          icon={Package}
          description="منتجات فريدة في المخزون"
        />
        <StatCard
          title="إجمالي الموردين"
          value={stats.total_suppliers}
          icon={Users}
          description="علاقات موردين نشطة"
        />
        <StatCard
          title="أصناف منخفضة المخزون"
          value={stats.low_stock_items}
          icon={AlertTriangle}
          description="أصناف تحت حد إعادة الطلب"
        />
        <StatCard
          title="قيمة المخزون"
          value={formatCurrency(stats.total_stock_value)}
          icon={DollarSign}
          description="إجمالي قيمة المخزون"
        />
      </div>

      {/* نشاط اليوم */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="وارد اليوم"
          value={formatCurrency(stats.today_incoming)}
          icon={ArrowDownToLine}
          description="مشتريات مستلمة اليوم"
        />
        <StatCard
          title="صادر اليوم"
          value={formatCurrency(stats.today_outgoing)}
          icon={ArrowUpFromLine}
          description="مبيعات صادرة اليوم"
        />
        <StatCard
          title="مصروفات الشهر"
          value={formatCurrency(stats.monthly_expenses)}
          icon={Receipt}
          description="إجمالي مصروفات هذا الشهر"
        />
        <StatCard
          title="تنبيهات غير مقروءة"
          value={stats.unread_alerts}
          icon={Bell}
          description="تحتاج انتباهك"
        />
      </div>

      {/* شبكة النشاط الأخير */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* التنبيهات الأخيرة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5" />
              التنبيهات الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد تنبيهات غير مقروءة</p>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <AlertTriangle
                      className={`size-4 mt-0.5 ${
                        alert.alert_type === 'low_stock'
                          ? 'text-destructive'
                          : 'text-yellow-500'
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {alert.item_name}
                        </span>
                        <Badge
                          variant={
                            alert.alert_type === 'low_stock'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {alert.alert_type === 'low_stock'
                            ? 'مخزون منخفض'
                            : 'فائض مخزون'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* المعاملات الواردة الأخيرة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownToLine className="size-5" />
              الوارد الأخير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentIncoming.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{transaction.item_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.supplier_name} - {formatDate(transaction.receipt_date)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm text-green-600 dark:text-green-400">
                      +{transaction.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(transaction.total_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* المعاملات الصادرة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="size-5" />
            الصادر الأخير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {recentOutgoing.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">{transaction.item_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.destination} - {formatDate(transaction.sale_date)}
                  </p>
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm text-red-600 dark:text-red-400">
                    -{transaction.quantity}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(transaction.total_price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
