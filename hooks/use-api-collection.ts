'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api-client'

// Generic server-backed collection: GET list on mount + create/update/delete.
export function useApiCollection<T extends { id: number }>(path: string) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const rows = await api<T[]>(path)
      setData(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر التحميل')
    } finally {
      setIsLoading(false)
    }
  }, [path])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (body: unknown): Promise<T> => {
      const row = await api<T>(path, { method: 'POST', body })
      setData((prev) => [row, ...prev])
      return row
    },
    [path]
  )

  const update = useCallback(
    async (id: number, body: unknown, method: 'PUT' | 'PATCH' = 'PUT'): Promise<T> => {
      const row = await api<T>(`${path}/${id}`, { method, body })
      setData((prev) => prev.map((r) => (r.id === id ? row : r)))
      return row
    },
    [path]
  )

  const remove = useCallback(
    async (id: number) => {
      await api(`${path}/${id}`, { method: 'DELETE' })
      setData((prev) => prev.filter((r) => r.id !== id))
    },
    [path]
  )

  return { data, setData, isLoading, error, refresh, create, update, remove }
}
