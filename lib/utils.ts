import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency with EGP (Egyptian Pound) symbol - Arabic format
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format date to Arabic readable format - using UTC to avoid hydration issues
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

// Format date with time - using UTC to avoid hydration issues
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date)
}

// Get stock status based on quantity and reorder level
export function getStockStatus(
  quantity: number,
  reorderLevel: number
): 'critical' | 'low' | 'normal' | 'overstocked' {
  if (quantity <= reorderLevel * 0.5) return 'critical'
  if (quantity <= reorderLevel) return 'low'
  if (quantity > reorderLevel * 3) return 'overstocked'
  return 'normal'
}

// Get Arabic status label
export function getStockStatusLabel(status: 'critical' | 'low' | 'normal' | 'overstocked'): string {
  switch (status) {
    case 'critical':
      return 'حرج'
    case 'low':
      return 'منخفض'
    case 'overstocked':
      return 'فائض'
    default:
      return 'طبيعي'
  }
}

// Get status badge variant based on stock status
export function getStockStatusVariant(
  status: 'critical' | 'low' | 'normal' | 'overstocked'
): 'destructive' | 'secondary' | 'default' | 'outline' {
  switch (status) {
    case 'critical':
      return 'destructive'
    case 'low':
      return 'secondary'
    case 'overstocked':
      return 'outline'
    default:
      return 'default'
  }
}
