"use client"

import {
  Award,
  Bell,
  ChevronDown,
  LogOut,
  User
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"


import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { useAuthStore } from "@/store/auth-store"

const pageTitles: Record<string, string> = {
  "/dashboard": "Tổng quan",
  "/schedule": "Lịch giảng dạy",
  "/classes": "Quản lý lớp học",
  "/exams": "Quản lý bài kiểm tra",
  "/profile": "Thông tin cá nhân",
  "/settings": "Cài đặt tài khoản",
}

export function TeacherHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const title = pageTitles[pathname] || "Teacher Portal"
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur-md transition-all duration-300">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="hover:bg-accent transition-colors" />
        <div className="h-6 w-px bg-border/60 mx-1 hidden md:block" />
        <h1 className="text-xl font-bold tracking-tight text-foreground/90">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">

        <Button variant="ghost" size="icon" className="relative hover:bg-accent rounded-full border border-border/20">
          <Bell className="size-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="relative flex items-center gap-2 h-auto py-1.5 px-2 rounded-full border-2 border-primary/20 p-0 overflow-hidden hover:border-primary/40 transition-all">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop"} alt={user?.name || "Teacher"} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : "T"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start pr-1 text-left">
                <span className="text-xs font-bold leading-none">{user?.name || "Giảng viên"}</span>
                <span className="text-[10px] text-muted-foreground leading-none mt-1 uppercase tracking-wider font-medium">Teacher</span>
              </div>
              <ChevronDown className="size-3 text-muted-foreground mr-1" />
            </Button>
          }>

          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-semibold leading-none">{user?.name || "Giảng viên"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || "teacher@goedu.edu.vn"}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="opacity-50" />
            <DropdownMenuItem className="cursor-pointer py-2 px-3 focus:bg-primary/5 focus:text-primary transition-colors" onClick={() => router.push('/teacher/profile')}>
              <User className="mr-3 h-4 w-4" />
              <span className="font-medium">Thông tin cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2 px-3 focus:bg-primary/5 focus:text-primary transition-colors">
              <Award className="mr-3 h-4 w-4" />
              <span className="font-medium">Chứng chỉ</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="opacity-50" />
            <DropdownMenuItem
              className="cursor-pointer py-2 px-3 text-destructive focus:bg-destructive/5 focus:text-destructive transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="font-medium">Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
