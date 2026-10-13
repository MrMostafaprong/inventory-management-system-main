'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Plus, Search, Pencil, Trash2, UserCog, Shield, Check,
  Eye, EyeOff, LayoutDashboard, Package, Truck,
  ArrowDownToLine, Receipt, DollarSign, TrendingUp,
  Warehouse, Bell, ClipboardList, Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { ProtectedRoute } from '@/components/protected-route'
import type { AuthUser, UserRole } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// ─── All Permissions Definition ──────────────────────────────────────────────

const PERMISSION_GROUPS = [
  {
    group: 'الرئيسية',
    items: [
      { id: 'dashboard',            label: 'لوحة التحكم',       icon: LayoutDashboard },
    ],
  },
  {
    group: 'المخزون',
    items: [
      { id: 'manage_items',         label: 'الأصناف',            icon: Package },
      { id: 'manage_suppliers',     label: 'الموردين',           icon: Truck },
    ],
  },
  {
    group: 'المعاملات',
    items: [
      { id: 'manage_transactions',  label: 'المعاملات (وارد/صادر)', icon: ArrowDownToLine },
    ],
  },
  {
    group: 'المالية',
    items: [
      { id: 'manage_expenses',      label: 'المصروفات',          icon: Receipt },
      { id: 'view_daily_balance',   label: 'الرصيد اليومي',      icon: DollarSign },
      { id: 'view_reports',         label: 'الأرباح والخسائر',   icon: TrendingUp },
      { id: 'view_stock_status',    label: 'حالة المخزون',       icon: Warehouse },
    ],
  },
  {
    group: 'الأخرى',
    items: [
      { id: 'view_alerts',          label: 'التنبيهات',          icon: Bell },
      { id: 'manage_checklists',    label: 'قوائم المهام',       icon: ClipboardList },
      { id: 'manage_users',         label: 'إدارة المستخدمين',   icon: Users },
    ],
  },
]

const ALL_PERMISSION_IDS = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.id))

const ROLE_BADGE_VARIANT: Record<UserRole, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  owner:     'default',
  admin:     'default',
  warehouse: 'secondary',
  cashier:   'outline',
  custom:    'outline',
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const userSchema = z.object({
  name:        z.string().trim().min(2,  'الاسم يجب أن يكون حرفين على الأقل').max(100),
  username:    z.string().trim().min(3,  'اسم المستخدم يجب أن يكون 3 أحرف على الأقل').max(64),
  // فارغ = إبقاء كلمة المرور الحالية عند التعديل؛ وعند الإضافة نتحقق يدوياً
  password:    z.string().max(128),
  permissions: z.array(z.string()).min(1, 'يجب تحديد صلاحية واحدة على الأقل'),
})

type UserFormValues = z.infer<typeof userSchema>

// ─── Helper: اشتقاق الدور من الصلاحيات ──────────────────────────────────────

function deriveRole(permissions: string[]): UserRole {
  if (permissions.length === ALL_PERMISSION_IDS.length) return 'admin'
  if (
    permissions.includes('manage_items') &&
    permissions.includes('manage_transactions') &&
    !permissions.includes('manage_expenses')
  ) return 'warehouse'
  if (
    permissions.includes('manage_expenses') &&
    !permissions.includes('manage_items') &&
    !permissions.includes('manage_suppliers')
  ) return 'cashier'
  return 'custom'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  return (
    <ProtectedRoute requiredPermission="manage_users">
      <UsersContent />
    </ProtectedRoute>
  )
}

function UsersContent() {
  // ← الآن تأتي البيانات من auth-provider مباشرةً
  const { allUsers, addUser, updateUser, deleteUser } = useAuth()

  const [searchQuery,    setSearchQuery]    = React.useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [editingUser,    setEditingUser]    = React.useState<AuthUser | null>(null)
  const [deletingUser,   setDeletingUser]   = React.useState<AuthUser | null>(null)
  const [showPassword,   setShowPassword]   = React.useState(false)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', username: '', password: '', permissions: ['dashboard'] },
  })

  const watchedPermissions = form.watch('permissions')

  // ── Filtering ──
  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Toggle permission checkbox ──
  const togglePermission = (permId: string, current: string[]) => {
    form.setValue(
      'permissions',
      current.includes(permId)
        ? current.filter((p) => p !== permId)
        : [...current, permId],
      { shouldValidate: true }
    )
  }

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleAddUser = async (data: UserFormValues) => {
    if (!data.password || data.password.length < 8) {
      form.setError('password', { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
      return
    }
    const result = await addUser({
      name:        data.name,
      username:    data.username,
      password:    data.password,
      role:        deriveRole(data.permissions),
      permissions: data.permissions,
    })

    if (!result.success) {
      form.setError('username', { message: result.error })
      return
    }

    setIsAddDialogOpen(false)
    resetForm()
    toast.success('تمت إضافة المستخدم بنجاح')
  }

  const handleEditUser = async (data: UserFormValues) => {
    if (!editingUser) return

    if (data.password && data.password.length > 0 && data.password.length < 8) {
      form.setError('password', { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
      return
    }
    const result = await updateUser(editingUser.id, {
      name:        data.name,
      username:    data.username,
      // فارغ = إبقاء القديمة (يُعالَج في auth-provider)
      password:    data.password,
      role:        deriveRole(data.permissions),
      permissions: data.permissions,
    })

    if (!result.success) {
      form.setError('username', { message: result.error })
      return
    }

    setEditingUser(null)
    resetForm()
    toast.success('تم تحديث المستخدم بنجاح')
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    const result = await deleteUser(deletingUser.id)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success('تم حذف المستخدم بنجاح')
    }
    setDeletingUser(null)
  }

  // ── Dialog helpers ──
  const resetForm = () =>
    form.reset({ name: '', username: '', password: '', permissions: ['dashboard'] })

  const openAddDialog = () => {
    resetForm()
    setShowPassword(false)
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (user: AuthUser) => {
    setEditingUser(user)
    setShowPassword(false)
    form.reset({
      name:        user.name,
      username:    user.username,
      password:    '',
      permissions: user.permissions,
    })
  }

  // ── Permissions Selector Component ────────────────────────────────────────
  const PermissionsSelector = ({ currentPerms }: { currentPerms: string[] }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel>الصلاحيات</FormLabel>
        <div className="flex items-center gap-2">
          <Button
            type="button" variant="ghost" size="sm" className="h-7 text-xs"
            onClick={() => form.setValue('permissions', [...ALL_PERMISSION_IDS], { shouldValidate: true })}
          >
            تحديد الكل
          </Button>
          <Separator orientation="vertical" className="h-4 self-center" />
          <Button
            type="button" variant="ghost" size="sm" className="h-7 text-xs"
            onClick={() => form.setValue('permissions', [], { shouldValidate: true })}
          >
            مسح الكل
          </Button>
        </div>
      </div>

      <ScrollArea className="h-64 rounded-md border p-3">
        <div className="space-y-4">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.group}>
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.group}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((perm) => {
                  const Icon = perm.icon
                  const checked = currentPerms.includes(perm.id)
                  return (
                    <label
                      key={perm.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
                        checked
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-transparent hover:border-border hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => togglePermission(perm.id, currentPerms)}
                      />
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      <span>{perm.label}</span>
                      {checked && <Check className="size-3.5 mr-auto text-primary" />}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <p className="text-xs text-muted-foreground">
        محدد:{' '}
        <span className="font-semibold text-foreground">{currentPerms.length}</span>
        {' '}من {ALL_PERMISSION_IDS.length} صلاحية
      </p>
    </div>
  )

  // ── Password Field ── (عند التعديل: فارغ = إبقاء الحالية)
  const PasswordField = ({ forEdit }: { forEdit?: boolean }) => (
    <FormField
      control={form.control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>كلمة المرور{forEdit ? ' (فارغ = إبقاء الحالية)' : ''}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={forEdit ? 'اتركه فارغاً للإبقاء على الحالية' : 'أدخل كلمة المرور (8 أحرف على الأقل)'}
                className="pl-10"
                autoComplete="new-password"
                {...field}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  // ── User Form Fields (مشترك بين Add و Edit) ──
  const UserFormFields = ({ forEdit }: { forEdit?: boolean }) => (
    <div className="space-y-4">
      {/* الاسم */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>الاسم الكامل</FormLabel>
            <FormControl>
              <Input placeholder="مثال: محمد أحمد" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* اسم المستخدم */}
      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>اسم المستخدم (للدخول)</FormLabel>
            <FormControl>
              <Input placeholder="مثال: mohamed" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* كلمة المرور */}
      <PasswordField forEdit={forEdit} />
      {/* الصلاحيات */}
      <FormField
        control={form.control}
        name="permissions"
        render={() => (
          <FormItem>
            <PermissionsSelector currentPerms={watchedPermissions} />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCog className="size-7" />
            إدارة المستخدمين
          </h1>
          <p className="text-muted-foreground">
            إضافة وتعديل وحذف حسابات المستخدمين وصلاحياتهم
          </p>
        </div>

        {/* ── Add Dialog ── */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="ml-2 size-4" />
              إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
              <DialogDescription>أنشئ حساباً جديداً وحدد صلاحياته</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddUser)}>
                <UserFormFields />
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    <Plus className="ml-2 size-4" />
                    إضافة المستخدم
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صلاحيات كاملة</CardTitle>
            <Shield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUsers.filter((u) => u.permissions.length === ALL_PERMISSION_IDS.length).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الصلاحيات المتاحة</CardTitle>
            <Check className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ALL_PERMISSION_IDS.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صلاحيات مخصصة</CardTitle>
            <UserCog className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUsers.filter((u) => u.role === 'custom').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Search ─── */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث بالاسم أو اسم المستخدم..."
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
                <TableHead>المستخدم</TableHead>
                <TableHead>اسم الدخول</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الصلاحيات</TableHead>
                <TableHead>تاريخ الإضافة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    لا يوجد مستخدمون
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    {/* الاسم */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>

                    {/* اسم الدخول */}
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {user.username}
                    </TableCell>

                    {/* الدور */}
                    <TableCell>
                      <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>

                    {/* الصلاحيات */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {user.permissions.length === ALL_PERMISSION_IDS.length ? (
                          <Badge variant="default" className="text-xs">
                            <Shield className="ml-1 size-3" />
                            كاملة
                          </Badge>
                        ) : (
                          <>
                            {user.permissions.slice(0, 3).map((pid) => {
                              const perm = PERMISSION_GROUPS.flatMap((g) => g.items).find((p) => p.id === pid)
                              return perm ? (
                                <Badge key={pid} variant="outline" className="text-xs gap-1">
                                  <perm.icon className="size-3" />
                                  {perm.label}
                                </Badge>
                              ) : null
                            })}
                            {user.permissions.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{user.permissions.length - 3}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>

                    {/* التاريخ */}
                    <TableCell className="text-muted-foreground text-sm">
                      {new Intl.DateTimeFormat('ar-EG', {
                        year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
                      }).format(new Date(user.created_at))}
                    </TableCell>

                    {/* الإجراءات */}
                    <TableCell className="text-left">
                      <div className="flex justify-start gap-2">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => openEditDialog(user)}
                          disabled={user.role === 'owner'}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">تعديل</span>
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => setDeletingUser(user)}
                          disabled={user.role === 'owner'}
                          className="hover:text-destructive"
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

      {/* ─── Edit Dialog ─── */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) { setEditingUser(null); resetForm() }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>تحديث بيانات وصلاحيات المستخدم</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditUser)}>
              <UserFormFields forEdit />
              <DialogFooter className="mt-4">
                <Button
                  type="button" variant="outline"
                  onClick={() => { setEditingUser(null); resetForm() }}
                >
                  إلغاء
                </Button>
                <Button type="submit">حفظ التغييرات</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm ─── */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستخدم &quot;{deletingUser?.name}&quot;؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}