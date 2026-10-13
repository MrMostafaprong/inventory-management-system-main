'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, ClipboardList, Circle, CheckCircle2, Calendar, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatDate } from '@/lib/utils'
import { useApiCollection } from '@/hooks/use-api-collection'
import type { Checklist } from '@/lib/types'

const checklistSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  description: z.string().min(1, 'الوصف مطلوب'),
  due_date: z.string().min(1, 'تاريخ الاستحقاق مطلوب'),
  status: z.enum(['pending', 'completed']),
})

type ChecklistFormValues = z.infer<typeof checklistSchema>

export default function ChecklistsPage() {
  const { data: checklists, create, update, remove } = useApiCollection<Checklist>('/api/checklists')
  const [filter, setFilter] = React.useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [editingChecklist, setEditingChecklist] = React.useState<Checklist | null>(null)
  const [deletingChecklist, setDeletingChecklist] = React.useState<Checklist | null>(null)

  const form = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      title: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      status: 'pending',
    },
  })

  const filteredChecklists = checklists.filter((item) => {
    if (filter === 'pending') return item.status === 'pending'
    if (filter === 'completed') return item.status === 'completed'
    return true
  })

  const pendingCount = checklists.filter((c) => c.status === 'pending').length
  const completedCount = checklists.filter((c) => c.status === 'completed').length

  // التحقق من المهام المتأخرة
  const overdueCount = checklists.filter(
    (c) => c.status === 'pending' && new Date(c.due_date) < new Date()
  ).length

  const handleAddChecklist = async (data: ChecklistFormValues) => {
    try {
      await create(data)
      setIsAddDialogOpen(false)
      form.reset()
      toast.success('تمت إضافة المهمة بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر إضافة المهمة')
    }
  }

  const handleEditChecklist = async (data: ChecklistFormValues) => {
    if (!editingChecklist) return
    try {
      await update(editingChecklist.id, data)
      setEditingChecklist(null)
      form.reset()
      toast.success('تم تحديث المهمة بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر تحديث المهمة')
    }
  }

  const handleDeleteChecklist = async () => {
    if (!deletingChecklist) return
    try {
      await remove(deletingChecklist.id)
      setDeletingChecklist(null)
      toast.success('تم حذف المهمة')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر حذف المهمة')
      setDeletingChecklist(null)
    }
  }

  const toggleStatus = async (checklistId: number) => {
    const target = checklists.find((c) => c.id === checklistId)
    if (!target) return
    try {
      await update(checklistId, {
        title: target.title,
        description: target.description,
        due_date: target.due_date,
        status: target.status === 'pending' ? 'completed' : 'pending',
      })
      toast.success('تم تحديث الحالة')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر تحديث الحالة')
    }
  }

  const openEditDialog = (checklist: Checklist) => {
    setEditingChecklist(checklist)
    form.reset({
      title: checklist.title,
      description: checklist.description,
      due_date: checklist.due_date,
      status: checklist.status,
    })
  }

  const ChecklistForm = ({
    onSubmit,
    submitLabel,
  }: {
    onSubmit: (data: ChecklistFormValues) => void
    submitLabel: string
  }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العنوان</FormLabel>
              <FormControl>
                <Input placeholder="عنوان المهمة" {...field} />
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
                <Textarea placeholder="وصف المهمة..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ الاستحقاق</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الحالة</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="completed">مكتملة</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
          <h1 className="text-3xl font-bold tracking-tight">قوائم المهام</h1>
          <p className="text-muted-foreground">
            إدارة المهام وقوائم التحقق التشغيلية
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => form.reset()}>
              <Plus className="ml-2 size-4" />
              إضافة مهمة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مهمة جديدة</DialogTitle>
              <DialogDescription>
                إنشاء عنصر جديد في قائمة المهام
              </DialogDescription>
            </DialogHeader>
            <ChecklistForm onSubmit={handleAddChecklist} submitLabel="إضافة المهمة" />
          </DialogContent>
        </Dialog>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المهام</CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checklists.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            <Circle className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مكتملة</CardTitle>
            <CheckCircle2 className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متأخرة</CardTitle>
            <Calendar className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* الفلتر */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية المهام" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المهام</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="completed">مكتملة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* قائمة المهام */}
      <div className="space-y-3">
        {filteredChecklists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="size-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">لا توجد مهام</p>
              <p className="text-sm text-muted-foreground">
                {filter === 'all'
                  ? 'أنشئ أول مهمة للبدء.'
                  : 'لا توجد مهام تطابق معايير التصفية.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredChecklists.map((checklist) => {
            const isOverdue =
              checklist.status === 'pending' && new Date(checklist.due_date) < new Date()
            return (
              <Card
                key={checklist.id}
                className={
                  isOverdue
                    ? 'border-r-4 border-r-destructive'
                    : checklist.status === 'completed'
                      ? 'opacity-75'
                      : ''
                }
              >
                <CardContent className="flex items-start gap-4 py-4">
                  <Checkbox
                    checked={checklist.status === 'completed'}
                    onCheckedChange={() => toggleStatus(checklist.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-medium ${
                          checklist.status === 'completed'
                            ? 'line-through text-muted-foreground'
                            : ''
                        }`}
                      >
                        {checklist.title}
                      </h3>
                      <Badge
                        variant={
                          checklist.status === 'completed'
                            ? 'default'
                            : isOverdue
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {checklist.status === 'completed'
                          ? 'مكتملة'
                          : isOverdue
                            ? 'متأخرة'
                            : 'قيد الانتظار'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {checklist.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        الاستحقاق: {formatDate(checklist.due_date)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(checklist)}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">تعديل</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingChecklist(checklist)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">حذف</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* نافذة التعديل */}
      <Dialog
        open={!!editingChecklist}
        onOpenChange={(open) => !open && setEditingChecklist(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المهمة</DialogTitle>
            <DialogDescription>تحديث بيانات المهمة</DialogDescription>
          </DialogHeader>
          <ChecklistForm onSubmit={handleEditChecklist} submitLabel="حفظ التغييرات" />
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog
        open={!!deletingChecklist}
        onOpenChange={(open) => !open && setDeletingChecklist(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المهمة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف &quot;{deletingChecklist?.title}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChecklist}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
