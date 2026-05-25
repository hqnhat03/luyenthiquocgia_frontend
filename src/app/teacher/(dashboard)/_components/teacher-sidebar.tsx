"use client"

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ClipboardList,
  GraduationCap,
  Layers,
  Newspaper
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Lịch giảng dạy",
    url: "/schedule",
    icon: Calendar,
  },
  {
    title: "Quản lý lớp học",
    url: "/classes",
    icon: Layers,
  },
  {
    title: "Quản lý bài kiểm tra",
    url: "/exams",
    icon: ClipboardList,
  },
]

export function TeacherSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  // Check if we are in class detail view
  // Path format: /classes/[id] or /classes/[id]/...
  const pathSegments = pathname.split('/').filter(Boolean)
  const isClassDetail = pathSegments[0] === 'classes' && pathSegments.length >= 2
  const classId = isClassDetail ? pathSegments[1] : null

  const classSubItems = classId ? [
    {
      title: "Thông tin chung",
      url: `/classes/${classId}`,
      icon: Layers,
    },
    {
      title: "Quản lý bài học",
      url: `/classes/${classId}/lessons`,
      icon: BookOpen,
    },
    {
      title: "Bài kiểm tra",
      url: `/classes/${classId}/exams`,
      icon: ClipboardList,
    },
    {
      title: "Điểm danh",
      url: `/classes/${classId}/attendance`,
      icon: Calendar,
    },
    {
      title: "Tin tức lớp học",
      url: `/classes/${classId}/news`,
      icon: Newspaper,
    },
  ] : []

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarHeader className="flex items-center py-6 px-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center transition-all duration-300">
        <Link href="/" className="flex items-center gap-3 font-bold text-xl group-data-[collapsible=icon]:gap-0">
          <div className="size-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 shrink-0 transition-all hover:scale-105 active:scale-95 group-hover:rotate-3">
            <GraduationCap className="size-6" />
          </div>
          <span className={`flex flex-col leading-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">GoEdu</span>
            <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">Teacher Portal</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="group-data-[collapsible=icon]:p-0">
          {isClassDetail && !isCollapsed && (
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
              Chế độ lớp học
            </SidebarGroupLabel>
          )}
          <SidebarMenu className="gap-1">
            {isClassDetail ? (
              <>
                <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                  <SidebarMenuButton
                    render={<Link href="/classes" />}
                    tooltip="Quay lại danh sách"
                    className="h-11 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground mb-2 group"
                  >
                    <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" />
                    <span className={`font-bold text-xs uppercase tracking-wider ${isCollapsed ? "hidden" : "block"}`}>
                      Quay lại lớp học
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {classSubItems.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        isActive={isActive}
                        tooltip={item.title}
                        className={`
                          h-11 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center transition-all duration-200 flex items-center gap-3
                          ${isActive
                            ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-medium shadow-sm ring-1 ring-primary/20"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}
                        `}
                      >
                        <item.icon className={`size-5 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                        <span className={`transition-all duration-300 font-medium ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"}`}>
                          {item.title}
                        </span>
                        {isActive && !isCollapsed && (
                          <div className="ml-auto w-1 h-5 bg-primary rounded-full" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </>
            ) : (
              navItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className={`
                        h-11 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center transition-all duration-200 flex items-center gap-3
                        ${isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-medium shadow-sm ring-1 ring-primary/20"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}
                      `}
                    >
                      <item.icon className={`size-5 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                      <span className={`transition-all duration-300 font-medium ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"}`}>
                        {item.title}
                      </span>
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-1 h-5 bg-primary rounded-full" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
