'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'
import { toast } from 'sonner'

import { useInventory } from '@/components/inventory-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { itemCategories, unitsOfMeasure } from '@/lib/mock-data'
import {
  formatDateTime, getStockStatus,
  getStockStatusVariant, getStockStatusLabel,
} from '@/lib/utils'
import type { Item } from '@/lib/types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  name:            z.string().min(1, 'الاسم مطلوب'),
  category:        z.string().min(1, 'الفئة مطلوبة'),
  unit_of_measure: z.string().min(1, 'وحدة القياس مطلوبة'),
  quantity:        z.coerce.number().min(0, 'الكمية يجب أن تكون 0 أو أكثر'),
  reorder_level:   z.coerce.number().min(1, 'حد إعادة الطلب يجب أن يكون 1 على الأقل'),
})

type ItemFormValues = z.infer<typeof itemSchema>

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ItemsPage() {
  // ← البيانات من الـ context المشترك
  const { items, addItem, updateItem, deleteItem, highlightedItemId, setHighlightedItemId } =
    useInventory()

  const router = useRouter()
  const [searchQuery,     setSearchQuery]     = React.useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [editingItem,     setEditingItem]     = React.useState<Item | null>(null)
  const [deletingItem,    setDeletingItem]    = React.useState<Item | null>(null)

  // ref للصف المُبرَز حتى نقدر نعمل scroll إليه
  const highlightedRowRef = React.useRef<HTMLTableRowElement | null>(null)

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '', category: '', unit_of_measure: '',
      quantity: 0, reorder_level: 10,
    },
  })

  // ── Scroll للصنف المُبرَز عند الوصول من التنبيهات ──────────────────────────
  React.useEffect(() => {
    if (highlightedItemId !== null && highlightedRowRef.current) {
      // انتظر قليلاً حتى تنتهي الـ render
      setTimeout(() => {
        highlightedRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 150)
      // أزل التبرز بعد 3 ثوانٍ
      const timer = setTimeout(() => setHighlightedItemId(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightedItemId, setHighlightedItemId])

  // ── Filter ──
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const handleAddItem = async (data: ItemFormValues) => {
    try {
      await addItem(data)
      setIsAddDialogOpen(false)
      form.reset()
      toast.success('تمت إضافة الصنف بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر إضافة الصنف')
    }
  }

  const handleEditItem = async (data: ItemFormValues) => {
    if (!editingItem) return
    // ← updateItem في الـ context يعيد حساب التنبيهات تلقائياً
    try {
      await updateItem(editingItem.id, data)
      setEditingItem(null)
      form.reset()
      toast.success('تم تحديث الصنف بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر تحديث الصنف')
    }
  }

  const handleDeleteItem = async () => {
    if (!deletingItem) return
    try {
      await deleteItem(deletingItem.id)
      setDeletingItem(null)
      toast.success('تم حذف الصنف بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر حذف الصنف')
      setDeletingItem(null)
    }
  }

  const openEditDialog = (item: Item) => {
    setEditingItem(item)
    form.reset({
      name:            item.name,
      category:        item.category,
      unit_of_measure: item.unit_of_measure,
      quantity:        item.quantity,
      reorder_level:   item.reorder_level,
    })
  }

  // ── Stats ──
  const lowCount      = items.filter((i) => getStockStatus(i.quantity, i.reorder_level) === 'low').length
  const criticalCount = items.filter((i) => getStockStatus(i.quantity, i.reorder_level) === 'critical').length
  const categories    = new Set(items.map((i) => i.category)).size

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الأصناف</h1>
          <p className="text-muted-foreground">إدارة أصناف المخزون</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => form.reset()}>
              <Plus className="ml-2 size-4" />
              إضافة صنف
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة صنف جديد</DialogTitle>
              <DialogDescription>أضف صنفاً جديداً إلى المخزون</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddItem)} className="space-y-4">
                <FormField control={form.control} name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم</FormLabel>
                      <FormControl><Input placeholder="اسم الصنف" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الفئة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {itemCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="unit_of_measure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوحدة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="اختر الوحدة" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {unitsOfMeasure.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الكمية</FormLabel>
                        <FormControl><Input type="number" min={0} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="reorder_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>حد إعادة الطلب</FormLabel>
                        <FormControl><Input type="number" min={1} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">إضافة الصنف</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{items.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حرج</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفئات</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{categories}</div></CardContent>
        </Card>
      </div>

      {/* ─── Search ─── */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث عن الأصناف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* ─── Table ─── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>الوحدة</TableHead>
                <TableHead className="text-left">الكمية</TableHead>
                <TableHead className="text-left">حد إعادة الطلب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر تحديث</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    لا توجد أصناف
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const status      = getStockStatus(item.quantity, item.reorder_level)
                  const isHighlight = item.id === highlightedItemId

                  return (
                    <TableRow
                      key={item.id}
                      // ← ref فقط على الصف المُبرَز
                      ref={isHighlight ? highlightedRowRef : null}
                      // ← تأثير بصري واضح: حدود + خلفية متحركة
                      className={
                        isHighlight
                          ? 'border-r-4 border-r-primary bg-primary/10 transition-colors duration-700'
                          : 'transition-colors duration-700'
                      }
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.unit_of_measure}</TableCell>
                      <TableCell className="text-left">{item.quantity}</TableCell>
                      <TableCell className="text-left">{item.reorder_level}</TableCell>
                      <TableCell>
                        <Badge variant={getStockStatusVariant(status)}>
                          {getStockStatusLabel(status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(item.last_updated)}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex justify-start gap-2">
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="size-4" />
                            <span className="sr-only">تعديل</span>
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => setDeletingItem(item)}
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">حذف</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Edit Dialog ─── */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الصنف</DialogTitle>
            <DialogDescription>تحديث بيانات الصنف</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditItem)} className="space-y-4">
              <FormField control={form.control} name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم</FormLabel>
                    <FormControl><Input placeholder="اسم الصنف" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفئة</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {itemCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="unit_of_measure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوحدة</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر الوحدة" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unitsOfMeasure.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكمية</FormLabel>
                      <FormControl><Input type="number" min={0} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="reorder_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حد إعادة الطلب</FormLabel>
                      <FormControl><Input type="number" min={1} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">حفظ التغييرات</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm ─── */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الصنف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف &quot;{deletingItem?.name}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}