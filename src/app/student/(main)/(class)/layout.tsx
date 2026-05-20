"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import * as React from "react"
import StudentClassSidebar from "./_components/student-class-sidebar"


export default function StudentDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)

        // Check for auth token (simple check for now, matching admin pattern)
        const hasToken = document.cookie.includes('access_token')

        if (!hasToken) {
            router.replace('/login')
        }
    }, [router])

    // Avoid flash of unauthenticated content
    if (!mounted) return null

    const hasToken = typeof window !== 'undefined' ? document.cookie.includes('access_token') : false
    if (!hasToken) return null

    return (
        <div className="mx-auto w-full max-w-7xl border">
            <SidebarProvider style={{ "--sidebar-width": "14rem" } as React.CSSProperties}>
                <StudentClassSidebar />
                <SidebarInset className="bg-slate-50/50 overflow-hidden">
                    <main className="flex-1 overflow-y-auto p-4 md:p-8">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}
