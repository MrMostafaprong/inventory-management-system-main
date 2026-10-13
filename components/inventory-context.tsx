'use client'

/**
 * inventory-context.tsx — server-backed.
 * الأصناف والتنبيهات من الـ Backend (SQLite) — لا بيانات في localStorage.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Item, Alert } from '@/lib/types'
import { api } from '@/lib/api-client'

interface ServerAlert extends Alert {
  key: string
}

interface InventoryContextType {
  items: Item[]
  isLoading: boolean
  refreshItems: () => Promise<void>
  addItem: (item: Omit<Item, 'id' | 'last_updated'>) => Promise<void>
  updateItem: (id: number, data: Omit<Item, 'id' | 'last_updated'>) => Promise<void>
  deleteItem: (id: number) => Promise<void>

  alerts: Alert[]
  markAlertRead: (id: number) => void
  markAllAlertsRead: () => void
  deleteAlert: (id: number) => void
  unreadAlertsCount: number

  highlightedItemId: number | null
  setHighlightedItemId: (id: number | null) => void
}

const InventoryContext = createContext<InventoryContextType | null>(null)

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const [alerts, setAlerts] = useState<ServerAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [highlightedItemId, setHighlightedItemId] = useState<number | null>(null)

  const refreshItems = useCallback(async () => {
    try {
      const rows = await api<Item[]>('/api/items')
      setItems(rows)
    } catch {
      // غير مسجل الدخول بعد — ProtectedRoute يتولى التوجيه
    }
  }, [])

  const refreshAlerts = useCallback(async () => {
    try {
      const rows = await api<ServerAlert[]>('/api/alerts')
      setAlerts(rows)
    } catch {}
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      await Promise.all([refreshItems(), refreshAlerts()])
      if (!cancelled) setIsLoading(false)
    })()
    return () => { cancelled = true }
  }, [refreshItems, refreshAlerts])

  // ── Items (الخادم هو مصدر الحقيقة + يعيد حساب التنبيهات) ────────────────────

  const addItem = useCallback(async (data: Omit<Item, 'id' | 'last_updated'>) => {
    const row = await api<Item>('/api/items', { method: 'POST', body: data })
    setItems((prev) => [...prev, row])
    await refreshAlerts()
  }, [refreshAlerts])

  const updateItem = useCallback(async (id: number, data: Omit<Item, 'id' | 'last_updated'>) => {
    const row = await api<Item>(`/api/items/${id}`, { method: 'PUT', body: data })
    setItems((prev) => prev.map((item) => (item.id === id ? row : item)))
    await refreshAlerts()
  }, [refreshAlerts])

  const deleteItem = useCallback(async (id: number) => {
    await api(`/api/items/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((item) => item.id !== id))
    await refreshAlerts()
  }, [refreshAlerts])

  // ── Alerts (الحالة محفوظة في الخادم) ─────────────────────────────────────────

  const markAlertRead = useCallback((id: number) => {
    const target = alerts.find((a) => a.id === id)
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)))
    if (target) void api('/api/alerts', { method: 'POST', body: { action: 'read', key: target.key } }).catch(() => {})
  }, [alerts])

  const markAllAlertsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
    void api('/api/alerts', { method: 'POST', body: { action: 'read-all' } }).catch(() => {})
  }, [])

  const deleteAlert = useCallback((id: number) => {
    const target = alerts.find((a) => a.id === id)
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    if (target) void api('/api/alerts', { method: 'POST', body: { action: 'dismiss', key: target.key } }).catch(() => {})
  }, [alerts])

  const unreadAlertsCount = alerts.filter((a) => !a.is_read).length

  return (
    <InventoryContext.Provider
      value={{
        items,
        isLoading,
        refreshItems,
        addItem,
        updateItem,
        deleteItem,
        alerts,
        markAlertRead,
        markAllAlertsRead,
        deleteAlert,
        unreadAlertsCount,
        highlightedItemId,
        setHighlightedItemId,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory(): InventoryContextType {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used inside <InventoryProvider>')
  return ctx
}
