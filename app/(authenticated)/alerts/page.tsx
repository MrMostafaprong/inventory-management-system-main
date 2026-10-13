'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Bell, AlertTriangle, Package, Check, CheckCheck, Trash2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { useInventory } from '@/components/inventory-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatDateTime } from '@/lib/utils'
import type { Alert } from '@/lib/types'

export default function AlertsPage() {
  const router = useRouter()

  // ← البيانات من الـ context — تتحدث تلقائياً عند تعديل أي صنف
  const {
    alerts,
    markAlertRead,
    markAllAlertsRead,
    deleteAlert,
    unreadAlertsCount,
    setHighlightedItemId,
  } = useInventory()

  const [filter,         setFilter]         = React.useState<string>('all')
  const [deletingAlert,  setDeletingAlert]  = React.useState<Alert | null>(null)

  // ── Filter ──
  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'unread')      return !alert.is_read
    if (filter === 'read')        return alert.is_read
    if (filter === 'low_stock')   return alert.alert_type === 'low_stock'
    if (filter === 'overstocked') return alert.alert_type === 'overstocked'
    return true
  })

  const lowStockCount    = alerts.filter((a) => a.alert_type === 'low_stock').length
  const overstockedCount = alerts.filter((a) => a.alert_type === 'overstocked').length

  // ── الضغط على اسم الصنف → انتقل لصفحة الأصناف وبرّز الصنف ──────────────────
  const handleGoToItem = (alert: Alert) => {
    // 1. علّم التنبيه كمقروء
    if (!alert.is_read) markAlertRead(alert.id)

    // 2. احفظ id الصنف في الـ context
    setHighlightedItemId(alert.item_id)

    // 3. انتقل لصفحة الأصناف
    router.push('/items')
    toast.info(`جاري الانتقال إلى الصنف: ${alert.item_name}`)
  }

  // ── Handlers ──
  const handleMarkRead = (id: number) => {
    markAlertRead(id)
    toast.success('تم تعليم التنبيه كمقروء')
  }

  const handleMarkAllRead = () => {
    markAllAlertsRead()
    toast.success('تم تعليم جميع التنبيهات كمقروءة')
  }

  const handleDelete = () => {
    if (!deletingAlert) return
    deleteAlert(deletingAlert.id)
    setDeletingAlert(null)
    toast.success('تم حذف التنبيه')
  }

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">التنبيهات</h1>
          <p className="text-muted-foreground">تنبيهات وإشعارات المخزون</p>
        </div>
        {unreadAlertsCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="ml-2 size-4" />
            تعليم الكل كمقروء
          </Button>
        )}
      </div>

      {/* ─── Stats ─── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التنبيهات</CardTitle>
            <Bell className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{alerts.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">غير مقروءة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{unreadAlertsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
            <AlertTriangle className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فائض مخزون</CardTitle>
            <Package className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overstockedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filter ─── */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية التنبيهات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع التنبيهات</SelectItem>
            <SelectItem value="unread">غير مقروءة</SelectItem>
            <SelectItem value="read">مقروءة</SelectItem>
            <SelectItem value="low_stock">مخزون منخفض</SelectItem>
            <SelectItem value="overstocked">فائض مخزون</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ─── Alerts List ─── */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="size-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">لا توجد تنبيهات</p>
              <p className="text-sm text-muted-foreground">
                {filter === 'all'
                  ? 'كل شيء على ما يرام! لا توجد تنبيهات مخزون حالياً.'
                  : 'لا توجد تنبيهات تطابق معايير التصفية.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={!alert.is_read ? 'border-r-4 border-r-destructive' : ''}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        alert.alert_type === 'low_stock'
                          ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                      }`}
                    >
                      {alert.alert_type === 'low_stock' ? (
                        <AlertTriangle className="size-5" />
                      ) : (
                        <Package className="size-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {/* ← اسم الصنف قابل للضغط → ينقل لصفحة الأصناف */}
                        <button
                          onClick={() => handleGoToItem(alert)}
                          className="hover:text-primary hover:underline underline-offset-4 transition-colors flex items-center gap-1 text-right"
                        >
                          {alert.item_name}
                          <ArrowLeft className="size-3.5 opacity-60" />
                        </button>
                        {!alert.is_read && (
                          <Badge variant="destructive" className="text-xs">جديد</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{formatDateTime(alert.created_at)}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={alert.alert_type === 'low_stock' ? 'secondary' : 'outline'}>
                    {alert.alert_type === 'low_stock' ? 'مخزون منخفض' : 'فائض مخزون'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{alert.message}</p>
                <div className="flex items-center gap-2">
                  {/* زر "اذهب للصنف" واضح */}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleGoToItem(alert)}
                  >
                    <ArrowLeft className="ml-2 size-4" />
                    اذهب للصنف
                  </Button>

                  {!alert.is_read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkRead(alert.id)}
                    >
                      <Check className="ml-2 size-4" />
                      تعليم كمقروء
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingAlert(alert)}
                  >
                    <Trash2 className="ml-2 size-4" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ─── Delete Confirm ─── */}
      <AlertDialog
        open={!!deletingAlert}
        onOpenChange={(open) => !open && setDeletingAlert(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التنبيه</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التنبيه؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}