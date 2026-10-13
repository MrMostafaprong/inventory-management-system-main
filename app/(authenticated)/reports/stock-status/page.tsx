'use client'

import * as React from 'react'
import { Package, AlertTriangle, TrendingUp, Search } from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api-client'
import { formatCurrency, getStockStatusVariant, getStockStatusLabel } from '@/lib/utils'
import type { StockStatusReport } from '@/lib/types'

const STATUS_COLORS = {
  normal: 'hsl(var(--chart-1))',
  low: 'hsl(var(--chart-4))',
  critical: 'hsl(var(--destructive))',
  overstocked: 'hsl(var(--chart-2))',
}

const STATUS_LABELS = {
  normal: 'طبيعي',
  low: 'منخفض',
  critical: 'حرج',
  overstocked: 'فائض',
}

export default function StockStatusPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [data, setData] = React.useState<StockStatusReport[]>([])

  React.useEffect(() => {
    void api<StockStatusReport[]>('/api/reports/stock-status').then(setData).catch(() => {})
  }, [])

  const filteredData = data.filter((item) => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = data.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
    value: count,
    fill: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
  }))

  const categoryData = data.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { category: item.category, value: 0, count: 0 }
      }
      acc[item.category].value += item.value
      acc[item.category].count += 1
      return acc
    },
    {} as Record<string, { category: string; value: number; count: number }>
  )

  const barChartData = Object.values(categoryData)
  const totalValue = data.reduce((sum, d) => sum + d.value, 0)
  const totalItems = data.length
  const lowStockItems = data.filter((d) => d.status === 'low' || d.status === 'critical').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">تقرير حالة المخزون</h1>
        <p className="text-muted-foreground">
          نظرة عامة على مستويات المخزون وصحة المخزون
        </p>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">متتبعة في المخزون</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القيمة</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">قيمة المخزون</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تنبيه مخزون منخفض</CardTitle>
            <AlertTriangle className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">أصناف تحتاج انتباه</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حرج</CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {statusCounts.critical || 0}
            </div>
            <p className="text-xs text-muted-foreground">إعادة تخزين عاجلة</p>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* توزيع حالة المخزون */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع حالة المخزون</CardTitle>
            <CardDescription>تقسيم الأصناف حسب حالة المخزون</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.value} صنف
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* القيمة حسب الفئة */}
        <Card>
          <CardHeader>
            <CardTitle>القيمة حسب الفئة</CardTitle>
            <CardDescription>توزيع قيمة المخزون عبر الفئات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" tickFormatter={(v) => `${v / 1000}ك`} />
                  <YAxis type="category" dataKey="category" className="text-xs" width={100} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="font-medium">{data.category}</p>
                            <p className="text-sm">القيمة: {formatCurrency(data.value)}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.count} صنف
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الفلاتر */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث عن الأصناف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="normal">طبيعي</SelectItem>
            <SelectItem value="low">منخفض</SelectItem>
            <SelectItem value="critical">حرج</SelectItem>
            <SelectItem value="overstocked">فائض</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* جدول حالة المخزون */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل حالة المخزون</CardTitle>
          <CardDescription>تفاصيل كاملة لحالة المخزون</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصنف</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead className="text-left">الكمية الحالية</TableHead>
                <TableHead className="text-left">حد إعادة الطلب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">القيمة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    لا توجد أصناف
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.item_id}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-left">{item.current_quantity}</TableCell>
                    <TableCell className="text-left">{item.reorder_level}</TableCell>
                    <TableCell>
                      <Badge variant={getStockStatusVariant(item.status)}>
                        {getStockStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left font-medium">
                      {formatCurrency(item.value)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
