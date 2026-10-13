// Database Types for Warehouse Management System

export interface Item {
  id: number
  name: string
  category: string
  unit_of_measure: string
  quantity: number
  reorder_level: number
  last_updated: string
}

export interface Supplier {
  id: number
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface IncomingTransaction {
  id: number
  supplier_id: number
  supplier_name?: string
  item_id: number
  item_name?: string
  quantity: number
  unit_price: number
  total_price: number
  invoice_number: string
  receipt_date: string
  notes: string
  created_at: string
}

export interface OutgoingTransaction {
  id: number
  item_id: number
  item_name?: string
  quantity: number
  unit_price: number
  total_price: number
  sale_date: string
  destination: string
  notes: string
  created_at: string
}

export interface Expense {
  id: number
  category: string
  amount: number
  description: string
  expense_date: string
  created_at: string
}

export interface DailyBalance {
  id: number
  item_id: number
  item_name?: string
  date: string
  opening_balance: number
  quantity_in: number
  quantity_out: number
  closing_balance: number
  total_value: number
}

export interface Alert {
  id: number
  item_id: number
  item_name?: string
  alert_type: 'low_stock' | 'overstocked'
  message: string
  is_read: boolean
  created_at: string
}

export interface Checklist {
  id: number
  title: string
  description: string
  status: 'pending' | 'completed'
  due_date: string
  created_at: string
}

// Report Types
export interface ProfitLossReport {
  period: string
  total_sales: number
  total_purchases: number
  total_expenses: number
  gross_profit: number
  net_profit: number
}

export interface StockStatusReport {
  item_id: number
  item_name: string
  category: string
  current_quantity: number
  reorder_level: number
  status: 'normal' | 'low' | 'critical' | 'overstocked'
  value: number
}

// Dashboard Statistics
export interface DashboardStats {
  total_items: number
  total_suppliers: number
  low_stock_items: number
  total_stock_value: number
  today_incoming: number
  today_outgoing: number
  monthly_expenses: number
  unread_alerts: number
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// ─── User & Auth Types ────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'warehouse' | 'cashier' | 'custom'

export const ROLE_LABELS: Record<UserRole, string> = {
  owner:     'مالك العمل',
  admin:     'المدير',
  warehouse: 'مدير المخزن',
  cashier:   'الكاشير',
  custom:    'مخصص',
}

export interface AuthUser {
  id: number
  name: string
  username: string
  password: string
  role: UserRole
  permissions: string[]
  created_at: string
}