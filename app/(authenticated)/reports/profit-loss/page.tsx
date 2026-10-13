'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, DollarSign, Receipt, ShoppingCart } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Line,
  LineChart,
  Tooltip,
  Legend,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockProfitLossReport } from '@/lib/mock-data'
import { api } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import type { ProfitLossReport } from '@/lib/types'

export default function ProfitLossPage() {
  const [period, setPeriod] = React.useState('all')
  const [data, setData] = React.useState<ProfitLossReport[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    void api<ProfitLossReport[]>('/api/reports/profit-loss')
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])
  const latestPeriod = data[0] ?? { net_profit: 0 }
  const previousPeriod = data[1] ?? null

  const profitChange = previousPeriod
    ? ((latestPeriod.net_profit - previousPeriod.net_profit) / Math.abs(previousPeriod.net_profit)) * 100
    : 0

  const totalSales = data.reduce((sum, d) => sum + d.total_sales, 0)
  const totalPurchases = data.reduce((sum, d) => sum + d.total_purchases, 0)
  const totalExpenses = data.reduce((sum, d) => sum + d.total_expenses, 0)
  const totalNetProfit = data.reduce((sum, d) => sum + d.net_profit, 0)

  const chartData = [...data].reverse().map((d) => ({
    period: d.period,
    المبيعات: d.total_sales,
    المشتريات: d.total_purchases,
    المصروفات: d.total_expenses,
    'صافي الربح': d.net_profit,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">تقرير الأرباح والخسائر</h1>
          <p className="text-muted-foreground">
            نظرة مالية شاملة وتحليل الربحية
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="اختر الفترة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفترات</SelectItem>
            <SelectItem value="quarter">الربع الأخير</SelectItem>
            <SelectItem value="month">هذا الشهر</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalSales)}
            </div>
            <p className="text-xs text-muted-foreground">إيرادات من المبيعات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشتريات</CardTitle>
            <ShoppingCart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalPurchases)}
            </div>
            <p className="text-xs text-muted-foreground">تكلفة البضائع</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <Receipt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">مصروفات تشغيلية</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            {totalNetProfit >= 0 ? (
              <TrendingUp className="size-4 text-green-500" />
            ) : (
              <TrendingDown className="size-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(totalNetProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {profitChange >= 0 ? '+' : ''}
              {profitChange.toFixed(1)}% من الفترة السابقة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* رسم بياني للإيرادات مقابل التكاليف */}
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات مقابل التكاليف</CardTitle>
            <CardDescription>تفصيل شهري للمبيعات والمشتريات والمصروفات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000}ك`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="font-medium">{label}</p>
                            {payload.map((entry, index) => (
                              <p
                                key={index}
                                className="text-sm"
                                style={{ color: entry.color }}
                              >
                                {entry.name}: {formatCurrency(entry.value as number)}
                              </p>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Bar dataKey="المبيعات" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="المشتريات" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="المصروفات" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* رسم بياني لاتجاه الأرباح */}
        <Card>
          <CardHeader>
            <CardTitle>اتجاه الأرباح</CardTitle>
            <CardDescription>صافي الربح عبر الزمن</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000}ك`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm" style={{ color: payload[0].color }}>
                              صافي الربح: {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="صافي الربح"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-4))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول تفاصيل الفترات */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الفترات</CardTitle>
          <CardDescription>بيانات مالية تفصيلية حسب الفترة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-right font-medium">الفترة</th>
                  <th className="py-3 text-left font-medium">المبيعات</th>
                  <th className="py-3 text-left font-medium">المشتريات</th>
                  <th className="py-3 text-left font-medium">الربح الإجمالي</th>
                  <th className="py-3 text-left font-medium">المصروفات</th>
                  <th className="py-3 text-left font-medium">صافي الربح</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 font-medium">{row.period}</td>
                    <td className="py-3 text-left text-green-600">
                      {formatCurrency(row.total_sales)}
                    </td>
                    <td className="py-3 text-left text-blue-600">
                      {formatCurrency(row.total_purchases)}
                    </td>
                    <td className="py-3 text-left">
                      {formatCurrency(row.gross_profit)}
                    </td>
                    <td className="py-3 text-left text-orange-600">
                      {formatCurrency(row.total_expenses)}
                    </td>
                    <td
                      className={`py-3 text-left font-semibold ${
                        row.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(row.net_profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="py-3">الإجمالي</td>
                  <td className="py-3 text-left text-green-600">
                    {formatCurrency(totalSales)}
                  </td>
                  <td className="py-3 text-left text-blue-600">
                    {formatCurrency(totalPurchases)}
                  </td>
                  <td className="py-3 text-left">
                    {formatCurrency(totalSales - totalPurchases)}
                  </td>
                  <td className="py-3 text-left text-orange-600">
                    {formatCurrency(totalExpenses)}
                  </td>
                  <td
                    className={`py-3 text-left ${
                      totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(totalNetProfit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
