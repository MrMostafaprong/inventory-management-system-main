'use client'

import * as React from 'react'
import { Calendar, Package, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DailyBalance } from '@/lib/types'

export default function DailyBalancePage() {
  const [selectedDate, setSelectedDate] = React.useState(
    new Date().toISOString().split('T')[0]
  )
  const [balances, setBalances] = React.useState<DailyBalance[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    setIsLoading(true)
    void api<DailyBalance[]>(`/api/reports/daily-balance?date=${selectedDate}`)
      .then(setBalances)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [selectedDate])
  const totalClosingValue = balances.reduce((sum, b) => sum + b.total_value, 0)
  const totalIn = balances.reduce((sum, b) => sum + b.quantity_in, 0)
  const totalOut = balances.reduce((sum, b) => sum + b.quantity_out, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الرصيد اليومي</h1>
          <p className="text-muted-foreground">
            تتبع حركات وأرصدة المخزون اليومية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="date" className="text-sm text-muted-foreground">
            اختر التاريخ:
          </Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأصناف المتتبعة</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balances.length}</div>
            <p className="text-xs text-muted-foreground">
              ليوم {formatDate(selectedDate)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الوارد</CardTitle>
            <ArrowDownToLine className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{totalIn}</div>
            <p className="text-xs text-muted-foreground">وحدات مستلمة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الصادر</CardTitle>
            <ArrowUpFromLine className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{totalOut}</div>
            <p className="text-xs text-muted-foreground">وحدات صادرة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة الرصيد الختامي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalClosingValue)}</div>
            <p className="text-xs text-muted-foreground">إجمالي قيمة المخزون</p>
          </CardContent>
        </Card>
      </div>

      {/* جدول الرصيد اليومي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            تقرير الرصيد - {formatDate(selectedDate)}
          </CardTitle>
          <CardDescription>
            تفاصيل حركات المخزون للتاريخ المحدد
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصنف</TableHead>
                <TableHead className="text-left">رصيد الافتتاح</TableHead>
                <TableHead className="text-left">الكمية الواردة</TableHead>
                <TableHead className="text-left">الكمية الصادرة</TableHead>
                <TableHead className="text-left">رصيد الإقفال</TableHead>
                <TableHead className="text-left">إجمالي القيمة</TableHead>
                <TableHead>الحركة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {isLoading ? 'جاري التحميل...' : 'لا توجد بيانات رصيد لهذا التاريخ'}
                  </TableCell>
                </TableRow>
              ) : (
                balances.map((balance) => {
                  const netMovement = balance.quantity_in - balance.quantity_out
                  return (
                    <TableRow key={balance.id}>
                      <TableCell className="font-medium">{balance.item_name}</TableCell>
                      <TableCell className="text-left">{balance.opening_balance}</TableCell>
                      <TableCell className="text-left text-green-600">
                        {balance.quantity_in > 0 ? `+${balance.quantity_in}` : '-'}
                      </TableCell>
                      <TableCell className="text-left text-red-600">
                        {balance.quantity_out > 0 ? `-${balance.quantity_out}` : '-'}
                      </TableCell>
                      <TableCell className="text-left font-semibold">
                        {balance.closing_balance}
                      </TableCell>
                      <TableCell className="text-left">
                        {formatCurrency(balance.total_value)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            netMovement > 0
                              ? 'default'
                              : netMovement < 0
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {netMovement > 0 ? `+${netMovement}` : netMovement}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* صف الملخص */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">إجمالي الافتتاح</p>
              <p className="text-lg font-semibold">
                {balances.reduce((sum, b) => sum + b.opening_balance, 0)} وحدة
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">إجمالي الوارد</p>
              <p className="text-lg font-semibold text-green-600">+{totalIn} وحدة</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">إجمالي الصادر</p>
              <p className="text-lg font-semibold text-red-600">-{totalOut} وحدة</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">إجمالي الإقفال</p>
              <p className="text-lg font-semibold">
                {balances.reduce((sum, b) => sum + b.closing_balance, 0)} وحدة
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">إجمالي القيمة</p>
              <p className="text-lg font-semibold">{formatCurrency(totalClosingValue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
