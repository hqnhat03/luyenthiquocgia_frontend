"use client"

import { PermissionApi } from "@/api/admin/permission-api"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useLayoutStore } from "@/store/layout-store"
import { usePermissionStore } from "@/store/permission-store"
import { useRouter } from "next/navigation"
import * as React from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const { headerContent } = useLayoutStore()

  const { setPermissions, setLoading } = usePermissionStore()

  React.useEffect(() => {
    setMounted(true)

    const hasToken = document.cookie.includes('access_token')

    if (!hasToken) {
      router.replace('/login')
      return;
    }

    // Fetch permissions
    const fetchPermissions = async () => {
      try {
        setLoading(true)
        const result = await PermissionApi.getPermissions()
        if (result.success && result.data?.items) {
          setPermissions(result.data.items)
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [router, setPermissions, setLoading])

  // Tránh render nội dung khi chưa mounted hoặc không có token
  if (!mounted) return null

  const hasToken = typeof window !== 'undefined' ? document.cookie.includes('access_token') : false
  if (!hasToken) return null

  return (
    <SidebarProvider style={{ "--sidebar-width": "13rem" } as React.CSSProperties}>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-20 shrink-0 items-center gap-2 border-b px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-6" />
          <div className="flex-1 flex items-center gap-4 overflow-hidden">
            {headerContent || <h1 className="text-3xl font-bold tracking-tight whitespace-nowrap">Admin Panel</h1>}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-8 pt-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider >
  )
}
