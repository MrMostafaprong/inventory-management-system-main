'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Search, Eye, ArrowDownToLine, FileText, Calendar } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApiCollection } from '@/hooks/use-api-collection'
import { useInventory } from '@/components/inventory-context'
import { api } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { IncomingTransaction, Supplier, Item } from '@/lib/types'

const incomingSchema = z.object({
  supplier_id: z.coerce.number().min(1, 'المورد مطلوب'),
  item_id: z.coerce.number().min(1, 'الصنف مطلوب'),
  quantity: z.coerce.number().min(1, 'الكمية يجب أن تكون 1 على الأقل'),
  unit_price: z.coerce.number().min(0.01, 'سعر الوحدة يجب أن يكون أكبر من 0'),
  invoice_number: z.string().min(1, 'رقم الفاتورة مطلوب'),
  receipt_date: z.string().min(1, 'تاريخ الاستلام مطلوب'),
  notes: z.string().optional(),
})

type IncomingFormValues = z.infer<typeof incomingSchema>

export default function IncomingTransactionsPage() {
  const { data: transactions, create } = useApiCollection<IncomingTransaction>('/api/transactions/incoming')
  const { items, refreshItems } = useInventory()
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
  React.useEffect(() => {
    void api<Supplier[]>('/api/suppliers').then(setSuppliers).catch(() => {})
  }, [])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [viewingTransaction, setViewingTransaction] = React.useState<IncomingTransaction | null>(null)

  const form = useForm<IncomingFormValues>({
    resolver: zodResolver(incomingSchema),
    defaultValues: {
      supplier_id: 0,
      item_id: 0,
      quantity: 1,
      unit_price: 0,
      invoice_number: '',
      receipt_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  })

  const quantity = form.watch('quantity')
  const unitPrice = form.watch('unit_price')
  const totalPrice = (quantity || 0) * (unitPrice || 0)

  const filteredTransactions = transactions.filter(
    (t) =>
      t.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalValue = transactions.reduce((sum, t) => sum + t.total_price, 0)
  const totalQuantity = transactions.reduce((sum, t) => sum + t.quantity, 0)

  const handleAddTransaction = async (data: IncomingFormValues) => {
    try {
      await create(data)
      // الخادم زاد المخزون ذريّاً — حدّث الـ context
      await refreshItems()
      setIsAddDialogOpen(false)
      form.reset()
      toast.success('تم تسجيل معاملة الوارد بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر تسجيل المعاملة')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">معاملات الوارد</h1>
          <p className="text-muted-foreground">
            تسجيل وتتبع مشتريات المخزون
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => form.reset()}>
              <Plus className="ml-2 size-4" />
              تسجيل وارد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>تسجيل معاملة وارد</DialogTitle>
              <DialogDescription>
                تسجيل عملية شراء أو استلام مخزون جديدة
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddTransaction)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplier_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المورد</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المورد" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.filter((s) => s.status === 'active').map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="item_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الصنف</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الصنف" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {items.map((item: Item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الكمية</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>سعر الوحدة (ج.م)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={0.01} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">السعر الإجمالي:</span>
                    <span className="font-semibold">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoice_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الفاتورة</FormLabel>
                        <FormControl>
                          <Input placeholder="INV-2024-XXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receipt_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ الاستلام</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="ملاحظات إضافية..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">تسجيل المعاملة</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المعاملات</CardTitle>
            <ArrowDownToLine className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القيمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الوحدات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity}</div>
          </CardContent>
        </Card>
      </div>

      {/* البحث */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث بالصنف أو المورد أو الفاتورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* جدول المعاملات */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>الفاتورة</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>الصنف</TableHead>
                <TableHead className="text-left">الكمية</TableHead>
                <TableHead className="text-left">سعر الوحدة</TableHead>
                <TableHead className="text-left">الإجمالي</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    لا توجد معاملات
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.receipt_date)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.invoice_number}
                    </TableCell>
                    <TableCell>{transaction.supplier_name}</TableCell>
                    <TableCell className="font-medium">{transaction.item_name}</TableCell>
                    <TableCell className="text-left text-green-600">
                      +{transaction.quantity}
                    </TableCell>
                    <TableCell className="text-left">
                      {formatCurrency(transaction.unit_price)}
                    </TableCell>
                    <TableCell className="text-left font-medium">
                      {formatCurrency(transaction.total_price)}
                    </TableCell>
                    <TableCell className="text-left">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingTransaction(transaction)}
                      >
                        <Eye className="size-4" />
                        <span className="sr-only">عرض</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* نافذة عرض المعاملة */}
      <Dialog open={!!viewingTransaction} onOpenChange={(open) => !open && setViewingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تفاصيل المعاملة</DialogTitle>
            <DialogDescription>
              الفاتورة: {viewingTransaction?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          {viewingTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ الاستلام</p>
                    <p className="font-medium">{formatDate(viewingTransaction.receipt_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">الفاتورة</p>
                    <p className="font-medium font-mono">{viewingTransaction.invoice_number}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المورد</span>
                  <span className="font-medium">{viewingTransaction.supplier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الصنف</span>
                  <span className="font-medium">{viewingTransaction.item_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الكمية</span>
                  <span className="font-medium text-green-600">+{viewingTransaction.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">سعر الوحدة</span>
                  <span className="font-medium">{formatCurrency(viewingTransaction.unit_price)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">الإجمالي</span>
                  <span className="font-bold text-lg">{formatCurrency(viewingTransaction.total_price)}</span>
                </div>
              </div>
              {viewingTransaction.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ملاحظات</p>
                  <p className="text-sm">{viewingTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
