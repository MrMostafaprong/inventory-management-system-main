import { AppSidebar } from '@/components/app-sidebar'
import { InventoryProvider } from '@/components/inventory-context'
import { ProtectedRoute } from '@/components/protected-route'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <InventoryProvider>
        <AppSidebar>{children}</AppSidebar>
      </InventoryProvider>
    </ProtectedRoute>
  )
}