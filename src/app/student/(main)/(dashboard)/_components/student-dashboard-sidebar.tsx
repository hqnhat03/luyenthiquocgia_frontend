"use client"

import {
  BookOpen,
  Calendar,
  LayoutDashboard
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Bảng điều khiển",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Lớp học của tôi",
    url: "/classes",
    icon: BookOpen,
  },
  {
    title: "Lịch học",
    url: "/schedule",
    icon: Calendar,
  }
]

export default function StudentDashboardSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="relative border-r border-slate-200">
      <SidebarContent className="group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="group-data-[collapsible=icon]:p-0">
          <SidebarMenu className="gap-1 p-2 group-data-[collapsible=icon]:p-0">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className={`h-11 rounded-lg transition-all duration-200 hover:bg-slate-100 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 data-[active=true]:font-semibold group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0`}
                >
                  <Link href={item.url} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                    <item.icon className="size-5 shrink-0" />
                    <span className="truncate text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
