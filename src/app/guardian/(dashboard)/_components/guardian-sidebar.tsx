"use client"

import {
  ArrowLeft,
  Bell,
  Calendar,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  User,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Bảng điều khiển",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Thông báo",
    url: "/notifications",
    icon: Bell,
  },
]

export function GuardianSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  // Check if we are in student detail view
  // Path format: /guardian/students/[id]... or /students/[id]...
  const pathSegments = pathname.split('/').filter(Boolean)
  const hasGuardianPrefix = pathSegments[0] === 'guardian'
  
  const isStudentDetail = hasGuardianPrefix 
    ? (pathSegments[1] === 'students' && pathSegments.length >= 3)
    : (pathSegments[0] === 'students' && pathSegments.length >= 2)

  const studentId = isStudentDetail 
    ? (hasGuardianPrefix ? pathSegments[2] : pathSegments[1])
    : null

  const prefix = hasGuardianPrefix ? '/guardian' : ''

  const studentSubItems = studentId ? [
    {
      title: "Hồ sơ học sinh",
      url: `${prefix}/students/${studentId}`,
      icon: User,
    },
    {
      title: "Lịch học",
      url: `${prefix}/students/${studentId}/sessions`,
      icon: Calendar,
    },
    {
      title: "Bài kiểm tra",
      url: `${prefix}/students/${studentId}/exams`,
      icon: ClipboardList,
    },
  ] : []

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar shadow-xl">
      <SidebarHeader className="flex items-center py-6 px-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center transition-all duration-300">
        <Link href={`${prefix}/dashboard`} className="flex items-center gap-3 font-bold text-xl group-data-[collapsible=icon]:gap-0">
          <div className="size-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 shrink-0 transition-all hover:scale-105 active:scale-95 group-hover:rotate-3">
            <GraduationCap className="size-6" />
          </div>
          <span className={`flex flex-col leading-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">GoEdu</span>
            <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">Guardian Portal</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="group-data-[collapsible=icon]:p-0">
          <SidebarMenu className="gap-1">
            {isStudentDetail ? (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href={`${prefix}/dashboard`} />}
                    tooltip="Quay lại bảng điều khiển"
                    className="h-11 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground mb-2 group group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                  >
                    <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" />
                    <span className={`font-bold text-xs uppercase tracking-wider ${isCollapsed ? "hidden" : "block"}`}>
                      Quay lại
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {studentSubItems.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        isActive={isActive}
                        tooltip={item.title}
                        className={`
                          h-11 px-3 transition-all duration-200 flex items-center gap-3
                          group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0
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
                const itemUrl = `${prefix}${item.url}`
                const isActive = pathname === itemUrl
                return (
                  <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                    <SidebarMenuButton
                      render={<Link href={itemUrl} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className={`
                        h-11 px-3 transition-all duration-200 flex items-center gap-3
                        group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0
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
