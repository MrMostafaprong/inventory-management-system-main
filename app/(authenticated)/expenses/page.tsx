'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Search, Pencil, Trash2, Receipt, Calendar } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { expenseCategories } from '@/lib/mock-data'
import { useApiCollection } from '@/hooks/use-api-collection'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Expense } from '@/lib/types'

const expenseSchema = z.object({
  category: z.string().min(1, 'الفئة مطلوبة'),
  amount: z.coerce.number().min(0.01, 'المبلغ يجب أن يكون أكبر من 0'),
  description: z.string().min(1, 'الوصف مطلوب'),
  expense_date: z.string().min(1, 'التاريخ مطلوب'),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export default function ExpensesPage() {
  const { data: expenses, create, update, remove } = useApiCollection<Expense>('/api/expenses')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = React.useState<Expense | null>(null)

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: '',
      amount: 0,
      description: '',
      expense_date: new Date().toISOString().split('T')[0],
    },
  })

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const handleAddExpense = async (data: ExpenseFormValues) => {
    try {
      await create(data)
      setIsAddDialogOpen(false)
      form.reset()
      toast.success('تمت إضافة المصروف بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر إضافة المصروف')
    }
  }

  const handleEditExpense = async (data: ExpenseFormValues) => {
    if (!editingExpense) return
    try {
      await update(editingExpense.id, data)
      setEditingExpense(null)
      form.reset()
      toast.success('تم تحديث المصروف بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر تحديث المصروف')
    }
  }

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return
    try {
      await remove(deletingExpense.id)
      setDeletingExpense(null)
      toast.success('تم حذف المصروف بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر حذف المصروف')
      setDeletingExpense(null)
    }
  }

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense)
    form.reset({
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      expense_date: expense.expense_date,
    })
  }

  const ExpenseForm = ({ onSubmit, submitLabel }: { onSubmit: (data: ExpenseFormValues) => void; submitLabel: string }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الفئة</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المبلغ (ج.م)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={0.01} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="expense_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>التاريخ</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوصف</FormLabel>
              <FormControl>
                <Textarea placeholder="وصف المصروف..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">{submitLabel}</Button>
        </DialogFooter>
      </form>
    </Form>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المصروفات</h1>
          <p className="text-muted-foreground">
            تتبع وإدارة المصروفات التشغيلية
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => form.reset()}>
              <Plus className="ml-2 size-4" />
              إضافة مصروف
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مصروف جديد</DialogTitle>
              <DialogDescription>
                تسجيل مصروف جديد
              </DialogDescription>
            </DialogHeader>
            <ExpenseForm onSubmit={handleAddExpense} submitLabel="إضافة المصروف" />
          </DialogContent>
        </Dialog>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <Receipt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>
        {Object.entries(expensesByCategory).slice(0, 3).map(([category, amount]) => (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(amount)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* الفلاتر */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث في المصروفات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية حسب الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            {expenseCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* جدول المصروفات */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead className="text-left">المبلغ</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    لا توجد مصروفات
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        {formatDate(expense.expense_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {expense.description}
                    </TableCell>
                    <TableCell className="text-left font-medium text-destructive">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex justify-start gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(expense)}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">تعديل</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingExpense(expense)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">حذف</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* نافذة التعديل */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المصروف</DialogTitle>
            <DialogDescription>
              تحديث بيانات المصروف
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm onSubmit={handleEditExpense} submitLabel="حفظ التغييرات" />
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المصروف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المصروف ({formatCurrency(deletingExpense?.amount || 0)} - {deletingExpense?.category})؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
