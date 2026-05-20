"use client"

import { studentAxios as api } from "@/api/student"
import {
  BookOpen,
  ChevronLeft,
  ClipboardList,
  Info,
  Newspaper
} from "lucide-react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar"

export default function StudentClassSidebar() {
  const pathname = usePathname()
  const params = useParams()

  const id = params?.id as string

  const [classCode, setClassCode] = useState<string>("Lớp học")

  useEffect(() => {
    if (!id) return;
    const fetchClassInfo = async () => {
      try {
        const response = await api.get(`/classes/base-info?id=${id}`)
        if (response.data.status === 'success') {
          setClassCode(response.data.data.class_code)
        }
      } catch (error) {
        console.error("Failed to fetch class info", error)
      }
    }
    fetchClassInfo()
  }, [id])

  const classNavItems = [
    {
      title: classCode,
      url: "/dashboard",
      icon: ChevronLeft,
      className: "font-bold text-slate-900 border-b border-slate-100 mb-2 pb-2 rounded-none hover:bg-transparent",
    },
    {
      title: "Bảng tin",
      url: `/class/${id}/bulletin`,
      icon: Newspaper,
    },
    {
      title: "Bài kiểm tra",
      url: `/class/${id}/tests`,
      icon: ClipboardList,
    },
    {
      title: "Bài giảng",
      url: `/class/${id}/lectures`,
      icon: BookOpen,
    },
    {
      title: "Thông tin chi tiết",
      url: `/class/${id}/detail`,
      icon: Info,
    },
  ]

  return (
    <Sidebar collapsible="icon" className="relative border-r border-slate-200">
      <SidebarContent className="group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="group-data-[collapsible=icon]:p-0">
          <SidebarMenu className="gap-1 p-2 group-data-[collapsible=icon]:p-0">
            {classNavItems.map((item) => (
              <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className={`h-11 rounded-lg transition-all duration-200 hover:bg-slate-100 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 data-[active=true]:font-semibold group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 ${item.className || ''}`}
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
