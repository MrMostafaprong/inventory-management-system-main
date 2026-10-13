'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { AuthUser, UserRole } from '@/lib/types'
import { api, ApiError } from '@/lib/api-client'

// ─── Session user (public only — never includes a password) ──────────────────
export interface SessionUser {
  id: number
  name: string
  username: string
  role: UserRole
  permissions: string[]
  created_at?: string
}

interface AuthContextType {
  user: SessionUser | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void

  hasPermission: (permission: string) => boolean
  canManageUsers: () => boolean

  allUsers: AuthUser[]
  addUser: (data: Omit<AuthUser, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>
  updateUser: (id: number, data: Partial<Omit<AuthUser, 'id' | 'created_at'>>) => Promise<{ success: boolean; error?: string }>
  deleteUser: (id: number) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

function toErr(e: unknown): string {
  if (e instanceof ApiError) return e.message
  return 'حدث خطأ غير متوقع'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUsers = useCallback(async () => {
    try {
      const rows = await api<AuthUser[]>('/api/users')
      setUsers(rows)
    } catch {
      // غير مصرح (مستخدم عادي) → قائمة فارغة، وهذا طبيعي
      setUsers([])
    }
  }, [])

  // الجلسة من الخادم (cookie httpOnly) — لا شيء حساس في المتصفح
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const me = await api<SessionUser>('/api/auth/me')
        if (!cancelled) {
          setCurrentUser(me)
          await refreshUsers()
        }
      } catch {
        if (!cancelled) setCurrentUser(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [refreshUsers])

  const login = useCallback(
    async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const me = await api<SessionUser>('/api/auth/login', {
          method: 'POST',
          body: { username, password },
        })
        setCurrentUser(me)
        await refreshUsers()
        return { success: true }
      } catch (e) {
        return { success: false, error: toErr(e) }
      }
    },
    [refreshUsers]
  )

  const logout = useCallback(() => {
    void api('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setCurrentUser(null)
    setUsers([])
  }, [])

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!currentUser) return false
      if (currentUser.role === 'owner') return true
      return currentUser.permissions.includes(permission)
    },
    [currentUser]
  )

  const canManageUsers = useCallback((): boolean => {
    if (!currentUser) return false
    return currentUser.role === 'owner' || currentUser.permissions.includes('manage_users')
  }, [currentUser])

  const addUser = useCallback(
    async (data: Omit<AuthUser, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> => {
      try {
        await api('/api/users', { method: 'POST', body: data })
        await refreshUsers()
        return { success: true }
      } catch (e) {
        return { success: false, error: toErr(e) }
      }
    },
    [refreshUsers]
  )

  const updateUser = useCallback(
    async (
      id: number,
      data: Partial<Omit<AuthUser, 'id' | 'created_at'>>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // فارغ = إبقاء الحالية — لا نرسلها أصلاً
        const payload: Record<string, unknown> = { ...data }
        if (payload.password === '') delete payload.password
        const updated = await api<SessionUser>(`/api/users/${id}`, { method: 'PATCH', body: payload })
        await refreshUsers()
        if (currentUser?.id === id) setCurrentUser(updated)
        return { success: true }
      } catch (e) {
        return { success: false, error: toErr(e) }
      }
    },
    [refreshUsers, currentUser]
  )

  const deleteUser = useCallback(
    async (id: number): Promise<{ success: boolean; error?: string }> => {
      try {
        await api(`/api/users/${id}`, { method: 'DELETE' })
        await refreshUsers()
        return { success: true }
      } catch (e) {
        return { success: false, error: toErr(e) }
      }
    },
    [refreshUsers]
  )

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        hasPermission,
        canManageUsers,
        allUsers: users,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
