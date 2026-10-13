'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Search, Pencil, Trash2, Users, Phone, Mail, MapPin } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { useApiCollection } from '@/hooks/use-api-collection'
import { formatDateTime } from '@/lib/utils'
import type { Supplier } from '@/lib/types'

const supplierSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  contact_person: z.string().min(1, 'اسم جهة الاتصال مطلوب'),
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  address: z.string().min(1, 'العنوان مطلوب'),
  status: z.enum(['active', 'inactive']),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

export default function SuppliersPage() {
  const { data: suppliers, isLoading, create, update, remove } = useApiCollection<Supplier>('/api/suppliers')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = React.useState<Supplier | null>(null)
  const [viewingSupplier, setViewingSupplier] = React.useState<Supplier | null>(null)

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      status: 'active',
    },
  })

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAddSupplier = async (data: SupplierFormValues) => {
    try {
      await create(data)
      setIsAddDialogOpen(false)
      form.reset()
      toast.success('تمت إضافة المورد بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر إضافة المورد')
    }
  }

  const handleEditSupplier = async (data: SupplierFormValues) => {
    if (!editingSupplier) return
    try {
      await update(editingSupplier.id, data)
      setEditingSupplier(null)
      form.reset()
      toast.success('تم تحديث المورد بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر تحديث المورد')
    }
  }

  const handleDeleteSupplier = async () => {
    if (!deletingSupplier) return
    try {
      await remove(deletingSupplier.id)
      setDeletingSupplier(null)
      toast.success('تم حذف المورد بنجاح')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر حذف المورد')
      setDeletingSupplier(null)
    }
  }

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    form.reset({
      name: supplier.name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      status: supplier.status,
    })
  }

  const SupplierForm = ({ onSubmit, submitLabel }: { onSubmit: (data: SupplierFormValues) => void; submitLabel: string }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم الشركة</FormLabel>
              <FormControl>
                <Input placeholder="اسم الشركة" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact_person"
            render={({ field }) => (
              <FormItem>
                <FormLabel>جهة الاتصال</FormLabel>
                <FormControl>
                  <Input placeholder="اسم جهة الاتصال" {...field} />
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
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الهاتف</FormLabel>
                <FormControl>
                  <Input placeholder="+20-xxx-xxx-xxxx" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>البريد الإلكتروني</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العنوان</FormLabel>
              <FormControl>
                <Textarea placeholder="العنوان الكامل" {...field} />
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
          <h1 className="text-3xl font-bold tracking-tight">الموردين</h1>
          <p className="text-muted-foreground">
            إدارة علاقات الموردين
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => form.reset()}>
              <Plus className="ml-2 size-4" />
              إضافة مورد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>إضافة مورد جديد</DialogTitle>
              <DialogDescription>
                أضف مورداً جديداً إلى شبكتك
              </DialogDescription>
            </DialogHeader>
            <SupplierForm onSubmit={handleAddSupplier} submitLabel="إضافة المورد" />
          </DialogContent>
        </Dialog>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموردين</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نشط</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {suppliers.filter((s) => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">غير نشط</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {suppliers.filter((s) => s.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الفلاتر */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث عن الموردين..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* جدول الموردين */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشركة</TableHead>
                <TableHead>جهة الاتصال</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {isLoading ? 'جاري التحميل...' : 'لا يوجد موردين'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      <button
                        className="hover:underline text-right"
                        onClick={() => setViewingSupplier(supplier)}
                      >
                        {supplier.name}
                      </button>
                    </TableCell>
                    <TableCell>{supplier.contact_person}</TableCell>
                    <TableCell dir="ltr" className="text-right">{supplier.phone}</TableCell>
                    <TableCell dir="ltr" className="text-right">{supplier.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={supplier.status === 'active' ? 'default' : 'secondary'}
                      >
                        {supplier.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(supplier.created_at)}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex justify-start gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(supplier)}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">تعديل</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingSupplier(supplier)}
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

      {/* نافذة عرض المورد */}
      <Dialog open={!!viewingSupplier} onOpenChange={(open) => !open && setViewingSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingSupplier?.name}</DialogTitle>
            <DialogDescription>تفاصيل المورد</DialogDescription>
          </DialogHeader>
          {viewingSupplier && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">جهة الاتصال</p>
                  <p className="font-medium">{viewingSupplier.contact_person}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-medium" dir="ltr">{viewingSupplier.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                  <p className="font-medium" dir="ltr">{viewingSupplier.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">العنوان</p>
                  <p className="font-medium">{viewingSupplier.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Badge
                  variant={viewingSupplier.status === 'active' ? 'default' : 'secondary'}
                >
                  {viewingSupplier.status === 'active' ? 'نشط' : 'غير نشط'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  منذ {formatDateTime(viewingSupplier.created_at)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة التعديل */}
      <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل المورد</DialogTitle>
            <DialogDescription>
              تحديث بيانات المورد
            </DialogDescription>
          </DialogHeader>
          <SupplierForm onSubmit={handleEditSupplier} submitLabel="حفظ التغييرات" />
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={!!deletingSupplier} onOpenChange={(open) => !open && setDeletingSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المورد</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف &quot;{deletingSupplier?.name}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
