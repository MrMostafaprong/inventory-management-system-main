'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Package,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  BarChart3,
  Bell,
  ClipboardList,
  LayoutDashboard,
  Warehouse,
  ChevronDown,
  Moon,
  Sun,
  LogOut,
  UserCog,
  Shield,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { useInventory } from '@/components/inventory-context'
import { ROLE_LABELS } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

// ─── Navigation Items ─────────────────────────────────────────────────────────

const navigationItems = [
  {
    title: 'لوحة التحكم',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: null,
  },
  {
    title: 'الأصناف',
    href: '/items',
    icon: Package,
    permission: 'manage_items',
  },
  {
    title: 'الموردين',
    href: '/suppliers',
    icon: Users,
    permission: 'manage_suppliers',
  },
  {
    title: 'المعاملات',
    icon: ArrowDownToLine,
    permission: 'manage_transactions',
    items: [
      { title: 'الوارد', href: '/transactions/incoming' },
      { title: 'الصادر', href: '/transactions/outgoing' },
    ],
  },
  {
    title: 'المصروفات',
    href: '/expenses',
    icon: Receipt,
    permission: 'manage_expenses',
  },
  {
    title: 'التقارير',
    icon: BarChart3,
    permission: 'view_reports',
    items: [
      { title: 'الرصيد اليومي', href: '/reports/daily-balance' },
      { title: 'الأرباح والخسائر', href: '/reports/profit-loss' },
      { title: 'حالة المخزون', href: '/reports/stock-status' },
    ],
  },
  {
    title: 'التنبيهات',
    href: '/alerts',
    icon: Bell,
    permission: 'view_alerts',
  },
  {
    title: 'قوائم المهام',
    href: '/checklists',
    icon: ClipboardList,
    permission: 'manage_checklists',
  },
]

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">تبديل المظهر</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setTheme('light')}>فاتح</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>داكن</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>تلقائي</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, hasPermission, canManageUsers } = useAuth()
  const { unreadAlertsCount } = useInventory()

  const handleLogout = () => {
    logout()
    toast.success('تم تسجيل الخروج بنجاح')
    router.replace('/login')
  }

  // فلترة عناصر التنقل بناءً على صلاحيات المستخدم
  const filteredNavItems = navigationItems.filter((item) => {
    if (!item.permission) return true
    return hasPermission(item.permission)
  })

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" side="right">

        {/* ─ Header ─ */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Warehouse className="size-4" />
                  </div>
                  <div className="grid flex-1 text-right text-sm leading-tight">
                    <span className="truncate font-semibold">إدارة المخازن</span>
                    <span className="truncate text-xs text-muted-foreground">نظام شامل</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ─ Content ─ */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>التنقل</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>

                {/* عناصر القائمة المفلترة */}
                {filteredNavItems.map((item) =>
                  item.items ? (
                    // عنصر قابل للطي (مثل المعاملات والتقارير)
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={item.items.some((sub) => pathname.startsWith(sub.href))}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            {item.icon && <item.icon className="size-4" />}
                            <span>{item.title}</span>
                            <ChevronDown className="mr-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.href}
                                >
                                  <Link href={subItem.href}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    // عنصر عادي
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.title}
                      >
                        <Link href={item.href!}>
                          {item.icon && <item.icon className="size-4" />}
                          <span>{item.title}</span>
                          {item.href === '/alerts' && unreadAlertsCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="mr-auto size-5 justify-center rounded-full p-0 text-xs"
                            >
                              {unreadAlertsCount}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                )}

                {/* إدارة المستخدمين — فقط للمالك والمدير */}
                {canManageUsers() && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/users'}
                      tooltip="إدارة المستخدمين"
                    >
                      <Link href="/users">
                        <UserCog className="size-4" />
                        <span>إدارة المستخدمين</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* ─ Footer (User Menu) ─ */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user ? getInitials(user.name) : '؟'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-right text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.name}</span>
                      <span className="truncate text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="size-3" />
                        {user ? ROLE_LABELS[user.role] : ''}
                      </span>
                    </div>
                    <ChevronDown className="mr-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-56"
                  side="top"
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-right">حسابي</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem className="flex items-center gap-2 justify-end cursor-default select-none">
                    <span className="font-mono text-sm">{user?.username}</span>
                    <span className="text-muted-foreground text-xs">اسم الدخول:</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="flex items-center gap-2 justify-end cursor-default select-none">
                    <Badge variant="secondary" className="text-xs">
                      {user ? ROLE_LABELS[user.role] : ''}
                    </Badge>
                    <span className="text-muted-foreground text-xs">الصلاحية:</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs text-muted-foreground">المظهر</span>
                    <ThemeToggle />
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="ml-2 size-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

      </Sidebar>

      {/* ─ Main Content ─ */}
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex-1" />
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>

    </SidebarProvider>
  )
}