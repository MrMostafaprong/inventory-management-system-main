// البيانات التجريبية للتطوير واختبار الواجهة
import type {
  Item,
  Supplier,
  IncomingTransaction,
  OutgoingTransaction,
  Expense,
  DailyBalance,
  Alert,
  Checklist,
  DashboardStats,
  ProfitLossReport,
  StockStatusReport,
} from './types'

export const mockItems: Item[] = [
  { id: 1, name: 'أكياس أسمنت', category: 'مواد بناء', unit_of_measure: 'كيس', quantity: 150, reorder_level: 50, last_updated: '2024-01-15T10:30:00Z' },
  { id: 2, name: 'قضبان حديد', category: 'مواد بناء', unit_of_measure: 'طن', quantity: 25, reorder_level: 10, last_updated: '2024-01-15T09:15:00Z' },
  { id: 3, name: 'دهانات', category: 'تشطيبات', unit_of_measure: 'وحدة', quantity: 8, reorder_level: 20, last_updated: '2024-01-14T14:45:00Z' },
  { id: 4, name: 'أسلاك كهربائية', category: 'كهرباء', unit_of_measure: 'متر', quantity: 500, reorder_level: 200, last_updated: '2024-01-14T11:20:00Z' },
  { id: 5, name: 'مواسير PVC', category: 'سباكة', unit_of_measure: 'وحدة', quantity: 45, reorder_level: 30, last_updated: '2024-01-13T16:00:00Z' },
  { id: 6, name: 'بلاط سيراميك', category: 'تشطيبات', unit_of_measure: 'صندوق', quantity: 200, reorder_level: 100, last_updated: '2024-01-13T13:30:00Z' },
  { id: 7, name: 'رمل', category: 'مواد بناء', unit_of_measure: 'متر مكعب', quantity: 30, reorder_level: 15, last_updated: '2024-01-12T10:00:00Z' },
  { id: 8, name: 'طوب أحمر', category: 'مواد بناء', unit_of_measure: 'وحدة', quantity: 5000, reorder_level: 2000, last_updated: '2024-01-12T08:45:00Z' },
]

export const mockSuppliers: Supplier[] = [
  { id: 1, name: 'شركة ABC لمستلزمات البناء', contact_person: 'أحمد حسن', phone: '+20-123-456-7890', email: 'ahmed@abcsupply.com', address: 'القاهرة، مصر', status: 'active', created_at: '2023-06-15T08:00:00Z' },
  { id: 2, name: 'شركة الحديد العالمية', contact_person: 'محمد علي', phone: '+20-123-456-7891', email: 'mohamed@globalsteel.com', address: 'الإسكندرية، مصر', status: 'active', created_at: '2023-07-20T09:30:00Z' },
  { id: 3, name: 'الدهانات المتقدمة', contact_person: 'سارة إبراهيم', phone: '+20-123-456-7892', email: 'sara@paintmasters.com', address: 'الجيزة، مصر', status: 'active', created_at: '2023-08-10T10:15:00Z' },
  { id: 4, name: 'الكهربائيات المحترفة', contact_person: 'كريم محمود', phone: '+20-123-456-7893', email: 'karim@electropro.com', address: 'القاهرة، مصر', status: 'inactive', created_at: '2023-09-05T11:00:00Z' },
  { id: 5, name: 'حلول السباكة', contact_person: 'فاطمة أحمد', phone: '+20-123-456-7894', email: 'fatma@plumbingsolutions.com', address: 'المنصورة، مصر', status: 'active', created_at: '2023-10-12T14:30:00Z' },
]

export const mockIncomingTransactions: IncomingTransaction[] = [
  { id: 1, supplier_id: 1, supplier_name: 'شركة ABC لمستلزمات البناء', item_id: 1, item_name: 'أكياس أسمنت', quantity: 100, unit_price: 75, total_price: 7500, invoice_number: 'INV-2024-001', receipt_date: '2024-01-15', notes: 'طلب شهري منتظم', created_at: '2024-01-15T10:30:00Z' },
  { id: 2, supplier_id: 2, supplier_name: 'شركة الحديد العالمية', item_id: 2, item_name: 'قضبان حديد', quantity: 10, unit_price: 2500, total_price: 25000, invoice_number: 'INV-2024-002', receipt_date: '2024-01-14', notes: 'مواد مشروع ألفا', created_at: '2024-01-14T14:00:00Z' },
  { id: 3, supplier_id: 3, supplier_name: 'الدهانات المتقدمة', item_id: 3, item_name: 'دهانات', quantity: 50, unit_price: 150, total_price: 7500, invoice_number: 'INV-2024-003', receipt_date: '2024-01-13', notes: 'تشطيبات داخلية', created_at: '2024-01-13T09:15:00Z' },
  { id: 4, supplier_id: 1, supplier_name: 'شركة ABC لمستلزمات البناء', item_id: 7, item_name: 'رمل', quantity: 20, unit_price: 300, total_price: 6000, invoice_number: 'INV-2024-004', receipt_date: '2024-01-12', notes: '', created_at: '2024-01-12T11:30:00Z' },
]

export const mockOutgoingTransactions: OutgoingTransaction[] = [
  { id: 1, item_id: 1, item_name: 'أكياس أسمنت', quantity: 50, unit_price: 85, total_price: 4250, sale_date: '2024-01-15', destination: 'موقع مشروع ألفا', notes: 'أعمال الأساسات', created_at: '2024-01-15T11:00:00Z' },
  { id: 2, item_id: 2, item_name: 'قضبان حديد', quantity: 5, unit_price: 2800, total_price: 14000, sale_date: '2024-01-14', destination: 'بناء المبنى ب', notes: 'الهيكل الإنشائي', created_at: '2024-01-14T15:30:00Z' },
  { id: 3, item_id: 6, item_name: 'بلاط سيراميك', quantity: 30, unit_price: 50, total_price: 1500, sale_date: '2024-01-13', destination: 'المجمع السكني ج', notes: 'تبليط الأرضيات', created_at: '2024-01-13T10:45:00Z' },
  { id: 4, item_id: 4, item_name: 'أسلاك كهربائية', quantity: 200, unit_price: 5, total_price: 1000, sale_date: '2024-01-12', destination: 'مبنى المكاتب د', notes: 'تركيبات كهربائية', created_at: '2024-01-12T14:00:00Z' },
]

export const mockExpenses: Expense[] = [
  { id: 1, category: 'نقل', amount: 1500, description: 'وقود وصيانة شاحنة التوصيل', expense_date: '2024-01-15', created_at: '2024-01-15T16:00:00Z' },
  { id: 2, category: 'تخزين', amount: 3000, description: 'إيجار المستودع الشهري', expense_date: '2024-01-01', created_at: '2024-01-01T08:00:00Z' },
  { id: 3, category: 'رواتب', amount: 12000, description: 'رواتب الموظفين لشهر يناير', expense_date: '2024-01-01', created_at: '2024-01-01T09:00:00Z' },
  { id: 4, category: 'مرافق', amount: 800, description: 'فواتير الكهرباء والمياه', expense_date: '2024-01-10', created_at: '2024-01-10T10:30:00Z' },
  { id: 5, category: 'صيانة', amount: 500, description: 'إصلاح المعدات', expense_date: '2024-01-08', created_at: '2024-01-08T14:15:00Z' },
]

export const mockDailyBalances: DailyBalance[] = [
  { id: 1, item_id: 1, item_name: 'أكياس أسمنت', date: '2024-01-15', opening_balance: 100, quantity_in: 100, quantity_out: 50, closing_balance: 150, total_value: 11250 },
  { id: 2, item_id: 2, item_name: 'قضبان حديد', date: '2024-01-15', opening_balance: 20, quantity_in: 10, quantity_out: 5, closing_balance: 25, total_value: 62500 },
  { id: 3, item_id: 3, item_name: 'دهانات', date: '2024-01-15', opening_balance: 8, quantity_in: 50, quantity_out: 0, closing_balance: 58, total_value: 8700 },
  { id: 4, item_id: 4, item_name: 'أسلاك كهربائية', date: '2024-01-15', opening_balance: 700, quantity_in: 0, quantity_out: 200, closing_balance: 500, total_value: 2500 },
]

export const mockAlerts: Alert[] = [
  { id: 1, item_id: 3, item_name: 'دهانات', alert_type: 'low_stock', message: 'مستوى المخزون (8) أقل من حد إعادة الطلب (20)', is_read: false, created_at: '2024-01-15T12:00:00Z' },
  { id: 2, item_id: 5, item_name: 'مواسير PVC', alert_type: 'low_stock', message: 'مستوى المخزون (45) يقترب من حد إعادة الطلب (30)', is_read: false, created_at: '2024-01-14T09:30:00Z' },
  { id: 3, item_id: 8, item_name: 'طوب أحمر', alert_type: 'overstocked', message: 'مستوى المخزون (5000) يتجاوز المستويات الطبيعية بشكل كبير', is_read: true, created_at: '2024-01-13T15:45:00Z' },
]

export const mockChecklists: Checklist[] = [
  { id: 1, title: 'جرد المخزون الشهري', description: 'إجراء عد فعلي لجميع الأصناف في المستودع', status: 'pending', due_date: '2024-01-31', created_at: '2024-01-01T08:00:00Z' },
  { id: 2, title: 'مراجعة مدفوعات الموردين', description: 'مراجعة ومعالجة المدفوعات المعلقة للموردين', status: 'pending', due_date: '2024-01-20', created_at: '2024-01-05T10:00:00Z' },
  { id: 3, title: 'فحص معدات السلامة', description: 'فحص جميع معدات السلامة في المستودع', status: 'completed', due_date: '2024-01-10', created_at: '2024-01-03T09:00:00Z' },
  { id: 4, title: 'طلب الأصناف منخفضة المخزون', description: 'تقديم طلبات للأصناف التي تقل عن حد إعادة الطلب', status: 'pending', due_date: '2024-01-18', created_at: '2024-01-15T11:00:00Z' },
]

export const mockDashboardStats: DashboardStats = {
  total_items: 8,
  total_suppliers: 5,
  low_stock_items: 2,
  total_stock_value: 85000,
  today_incoming: 7500,
  today_outgoing: 4250,
  monthly_expenses: 17800,
  unread_alerts: 2,
}

export const mockProfitLossReport: ProfitLossReport[] = [
  { period: 'يناير 2024', total_sales: 45000, total_purchases: 32000, total_expenses: 17800, gross_profit: 13000, net_profit: -4800 },
  { period: 'ديسمبر 2023', total_sales: 62000, total_purchases: 38000, total_expenses: 16500, gross_profit: 24000, net_profit: 7500 },
  { period: 'نوفمبر 2023', total_sales: 55000, total_purchases: 35000, total_expenses: 15800, gross_profit: 20000, net_profit: 4200 },
  { period: 'أكتوبر 2023', total_sales: 48000, total_purchases: 30000, total_expenses: 15200, gross_profit: 18000, net_profit: 2800 },
]

export const mockStockStatusReport: StockStatusReport[] = [
  { item_id: 1, item_name: 'أكياس أسمنت', category: 'مواد بناء', current_quantity: 150, reorder_level: 50, status: 'normal', value: 11250 },
  { item_id: 2, item_name: 'قضبان حديد', category: 'مواد بناء', current_quantity: 25, reorder_level: 10, status: 'normal', value: 62500 },
  { item_id: 3, item_name: 'دهانات', category: 'تشطيبات', current_quantity: 8, reorder_level: 20, status: 'critical', value: 1200 },
  { item_id: 4, item_name: 'أسلاك كهربائية', category: 'كهرباء', current_quantity: 500, reorder_level: 200, status: 'normal', value: 2500 },
  { item_id: 5, item_name: 'مواسير PVC', category: 'سباكة', current_quantity: 45, reorder_level: 30, status: 'low', value: 2250 },
  { item_id: 6, item_name: 'بلاط سيراميك', category: 'تشطيبات', current_quantity: 200, reorder_level: 100, status: 'normal', value: 10000 },
  { item_id: 7, item_name: 'رمل', category: 'مواد بناء', current_quantity: 30, reorder_level: 15, status: 'normal', value: 9000 },
  { item_id: 8, item_name: 'طوب أحمر', category: 'مواد بناء', current_quantity: 5000, reorder_level: 2000, status: 'overstocked', value: 25000 },
]

// خيارات الفئات للأصناف
export const itemCategories = [
  'مواد بناء',
  'تشطيبات',
  'كهرباء',
  'سباكة',
  'أدوات',
  'معدات سلامة',
  'أخرى',
]

// خيارات وحدات القياس
export const unitsOfMeasure = [
  'وحدة',
  'كيس',
  'صندوق',
  'طن',
  'كيلوجرام',
  'متر',
  'متر مكعب',
  'لتر',
  'قطعة',
]

// فئات المصروفات
export const expenseCategories = [
  'نقل',
  'تخزين',
  'رواتب',
  'مرافق',
  'صيانة',
  'تأمين',
  'متنوعة',
]
