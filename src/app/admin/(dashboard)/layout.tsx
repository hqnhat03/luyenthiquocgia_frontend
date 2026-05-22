"use client"

import { AdminSidebar } from "@/components/admin-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import api from "@/lib/axios"
import { codeToPermissionKey } from "@/lib/permission-helper"
import { useAuthStore } from "@/store/auth-store"
import { useLayoutStore } from "@/store/layout-store"
import { usePermissionStore } from "@/store/permission-store"
import { useRouter } from "next/navigation"
import * as React from "react"

/**
 * AdminLayout — Khởi tạo quyền sau khi mount
 *
 * Luồng:
 * 1. Kiểm tra access_token cookie → redirect login nếu không có
 * 2. GET /admin/permissions?per_page=500
 * 3. Lọc kết quả theo role_id của user hiện tại
 * 4. usePermissionStore.setPermissionStores([screen_codes]) → Route guard
 * 5. Build permissionKeys Set → truyền xuống AdminSidebar để ẩn menu
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const { headerContent } = useLayoutStore()
  const { user } = useAuthStore()
  const { setPermissionStores, setLoading } = usePermissionStore()

  // Set<permissionKey> để filter sidebar menu (ví dụ: "admin:view", "course:view")
  const [sidebarPermissions, setSidebarPermissions] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    setMounted(true)

    const hasToken = document.cookie.includes("access_token")
    if (!hasToken) {
      router.replace("/login")
      return
    }

    const fetchPermissions = async () => {
      try {
        setLoading(true)

        const res = await api.get("/admin/permissions", {
          params: { page: 1, per_page: 500 },
        })

        const items: Array<{
          role_id: number;
          screen_id: number;
          screen_code: string;
        }> = res.data?.data?.items || []

        const roleId = user?.role_id ?? null

        // Lọc theo role_id của user hiện tại
        const myItems = roleId !== null
          ? items.filter((item) => item.role_id === roleId)
          : items

        // ① usePermissionStore — Set<screen_code> cho PermissionRoute
        const screenCodes = myItems.map((item) => item.screen_code)
        setPermissionStores(screenCodes)

        // ② Build permissionKey Set cho sidebar menu
        const permissionKeys = screenCodes
          .map((code) => codeToPermissionKey[code])
          .filter(Boolean) as string[]

        setSidebarPermissions(new Set(permissionKeys))
      } catch (err) {
        console.error("Failed to fetch permissions:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [router, user?.role_id, setPermissionStores, setLoading])

  if (!mounted) return null

  const hasToken =
    typeof window !== "undefined" ? document.cookie.includes("access_token") : false
  if (!hasToken) return null

  return (
    <SidebarProvider style={{ "--sidebar-width": "13rem" } as React.CSSProperties}>
      <AdminSidebar sidebarPermissions={sidebarPermissions} />
      <SidebarInset>
        <header className="flex h-20 shrink-0 items-center gap-2 border-b px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-6" />
          <div className="flex-1 flex items-center gap-4 overflow-hidden">
            {headerContent || (
              <h1 className="text-3xl font-bold tracking-tight whitespace-nowrap">
                Admin Panel
              </h1>
            )}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-8 pt-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
