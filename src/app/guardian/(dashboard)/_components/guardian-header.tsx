"use client"

import {
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
  "/guardian": "Bảng điều khiển",
  "/guardian/notifications": "Thông báo",
  "/guardian/settings": "Cài đặt tài khoản",
  "/guardian/profile": "Hồ sơ cá nhân",
  "/guardian/profile/edit": "Cập nhật hồ sơ",
  "/guardian/profile/security": "Bảo mật tài khoản",
}

export function GuardianHeader() {
  const router = useRouter()
  const pathname = usePathname()

  // Dynamic title for student detail
  const pathSegments = pathname.split('/').filter(Boolean)
  let title = pageTitles[pathname] || "Guardian Portal"

  if (pathSegments[1] === 'students' && pathSegments.length >= 3) {
    if (pathSegments.length === 3) title = "Hồ sơ học sinh"
    else if (pathSegments[3] === 'schedule') title = "Lịch học của con"
    else if (pathSegments[3] === 'exams') title = "Bài kiểm tra của con"
  }

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
          <DropdownMenuTrigger>
            <div className="relative flex items-center gap-2 h-auto py-1.5 px-2 rounded-full border-2 border-primary/20 overflow-hidden hover:border-primary/40 transition-all">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || ""} alt={user?.name || "Guardian"} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : "PH"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start pr-1 text-left">
                <span className="text-xs font-bold leading-none">{user?.name || "Phụ huynh"}</span>
                <span className="text-[10px] text-muted-foreground leading-none mt-1 uppercase tracking-wider font-medium">Guardian</span>
              </div>
              <ChevronDown className="size-3 text-muted-foreground mr-1" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-semibold leading-none">{user?.name || "Phụ huynh"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || "guardian@goedu.edu.vn"}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="opacity-50" />
            <DropdownMenuItem className="cursor-pointer py-2 px-3 focus:bg-primary/5 focus:text-primary transition-colors" onClick={() => router.push('/guardian/profile')}>
              <User className="mr-3 h-4 w-4" />
              <span className="font-medium">Thông tin cá nhân</span>
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
