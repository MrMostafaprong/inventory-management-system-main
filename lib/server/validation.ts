// Server-side validation (zod) + sanitization. Every write goes through here.
import { z } from 'zod'

export function cleanText(v: unknown, max = 200): string {
  if (typeof v !== 'string') return ''
  return (
    v
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim()
      .slice(0, max)
  )
}

const txt = (max: number, min = 1, requiredMsg = 'الحقل مطلوب') =>
  z.preprocess(
    (v) => cleanText(v, max),
    min === 0 ? z.string().max(max) : z.string().min(min, requiredMsg).max(max)
  )

export const ALLOWED_PERMISSIONS = [
  'dashboard', 'manage_items', 'manage_suppliers', 'manage_transactions',
  'manage_expenses', 'view_daily_balance', 'view_reports', 'view_stock_status',
  'view_alerts', 'manage_checklists', 'manage_users',
] as const

export const ROLES = ['owner', 'admin', 'warehouse', 'cashier', 'custom'] as const

export const loginSchema = z.object({
  username: z.preprocess((v) => cleanText(v, 64).toLowerCase(), z.string().min(1, 'اسم المستخدم مطلوب').max(64)),
  password: z.string().min(1, 'كلمة المرور مطلوبة').max(128),
})

export const userCreateSchema = z.object({
  name: txt(100, 2, 'الاسم يجب أن يكون حرفين على الأقل'),
  username: txt(64, 3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل').max(128),
  role: z.enum(ROLES),
  permissions: z.array(z.enum(ALLOWED_PERMISSIONS)).min(1, 'يجب تحديد صلاحية واحدة على الأقل').max(20),
})

export const userUpdateSchema = z.object({
  name: txt(100, 2).optional(),
  username: txt(64, 3).optional(),
  // غيابها أو فراغها = إبقاء الحالية
  password: z.string().max(128).optional(),
  role: z.enum(ROLES).optional(),
  permissions: z.array(z.enum(ALLOWED_PERMISSIONS)).min(1).max(20).optional(),
})

export const itemSchema = z.object({
  name: txt(200, 1, 'الاسم مطلوب'),
  category: txt(100, 1, 'الفئة مطلوبة'),
  unit_of_measure: txt(50, 1, 'وحدة القياس مطلوبة'),
  quantity: z.coerce.number().finite().min(0, 'الكمية يجب أن تكون 0 أو أكثر').max(1_000_000_000),
  reorder_level: z.coerce.number().finite().min(1, 'حد إعادة الطلب يجب أن يكون 1 على الأقل').max(1_000_000_000),
})

export const supplierSchema = z.object({
  name: txt(200, 1, 'الاسم مطلوب'),
  contact_person: txt(100, 0),
  phone: txt(30, 0),
  email: z.preprocess((v) => cleanText(v, 100), z.string().max(100).refine(
    (v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    'البريد الإلكتروني غير صالح'
  )),
  address: txt(300, 0),
  status: z.enum(['active', 'inactive']),
})

export const incomingSchema = z.object({
  supplier_id: z.coerce.number().int().min(1, 'المورد مطلوب'),
  item_id: z.coerce.number().int().min(1, 'الصنف مطلوب'),
  quantity: z.coerce.number().finite().min(0.01, 'الكمية يجب أن تكون أكبر من 0').max(1_000_000_000),
  unit_price: z.coerce.number().finite().min(0, 'السعر يجب أن يكون 0 أو أكثر').max(1_000_000_000),
  invoice_number: txt(100, 0),
  receipt_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ غير صالح'),
  notes: txt(1000, 0),
})

export const outgoingSchema = z.object({
  item_id: z.coerce.number().int().min(1, 'الصنف مطلوب'),
  quantity: z.coerce.number().finite().min(0.01, 'الكمية يجب أن تكون أكبر من 0').max(1_000_000_000),
  unit_price: z.coerce.number().finite().min(0, 'السعر يجب أن يكون 0 أو أكثر').max(1_000_000_000),
  sale_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ غير صالح'),
  destination: txt(200, 0),
  notes: txt(1000, 0),
})

export const expenseSchema = z.object({
  category: txt(100, 1, 'الفئة مطلوبة'),
  amount: z.coerce.number().finite().min(0.01, 'المبلغ يجب أن يكون أكبر من 0').max(1_000_000_000),
  description: txt(500, 0),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ غير صالح'),
})

export const checklistSchema = z.object({
  title: txt(200, 1, 'العنوان مطلوب'),
  description: txt(1000, 0),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ غير صالح'),
  status: z.enum(['pending', 'completed']),
})

export function zodErrorMessage(e: z.ZodError): string {
  return e.issues[0]?.message ?? 'بيانات غير صالحة'
}
