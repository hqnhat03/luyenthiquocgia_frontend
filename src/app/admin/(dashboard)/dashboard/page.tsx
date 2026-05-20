"use client"

import { usePermission } from "@/hooks/use-permission"
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import React from "react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/axios"
import { AxiosError } from "axios"

interface DashboardData {
  total_teacher: number
  total_student: number
  total_course: number
  total_new_student: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { hasPermission, isInitialized, isLoading: isPermissionLoading } = usePermission()

  // Kiểm tra quyền truy cập dashboard
  React.useEffect(() => {
    if (isInitialized && !isPermissionLoading && !hasPermission("dashboard")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/profile")
    }
  }, [hasPermission, isInitialized, isPermissionLoading, router])

  const [data, setData] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true)
      try {
        const response = await api.get("/admin/dashboard")

        if (response.data.status === "success" || response.data.success) {
          const apiData = response.data.data;
          setData({
            total_teacher: apiData.total_teacher ?? 0,
            total_student: apiData.total_student ?? 0,
            total_course: apiData.total_course ?? 0,
            total_new_student: apiData.total_new_student ?? 0,
          });
        } else {
          toast.error(response.data.message || "Đã có lỗi xảy ra")
        }
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.message || "Không thể kết nối với máy chủ API")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const stats = [
    {
      title: "Số lượng giáo viên",
      value: data?.total_teacher ?? 0,
      description: "Đội ngũ chuyên gia giảng dạy",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      glow: "group-hover:ring-blue-500/30",
    },
    {
      title: "Số lượng khóa học",
      value: data?.total_course ?? 0,
      description: "Nội dung đào tạo chất lượng",
      icon: BookOpen,
      color: "text-orange-500",
      bg: "bg-orange-500/10 dark:bg-orange-500/20",
      glow: "group-hover:ring-orange-500/30",
    },
    {
      title: "Số lượng học sinh",
      value: data?.total_student?.toLocaleString() ?? 0,
      description: "Học viên đang tích cực học",
      icon: GraduationCap,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      glow: "group-hover:ring-emerald-500/30",
    },
    {
      title: "Số lượng học sinh mới",
      value: data?.total_new_student ?? 0,
      description: "Học viên đăng ký mới",
      icon: UserPlus,
      color: "text-purple-500",
      bg: "bg-purple-500/10 dark:bg-purple-500/20",
      glow: "group-hover:ring-purple-500/30",
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-lg border border-slate-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_40%)]" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            Chào mừng trở lại, Quản trị viên!
          </h2>
          <p className="text-indigo-200/80 text-sm max-w-xl">
            Dưới đây là tổng quan hiệu suất và dữ liệu phân tích hệ thống đào tạo GoEdu của bạn hôm nay.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden group hover:shadow-md hover:border-slate-200/80 dark:hover:border-slate-700/80 transition-all duration-300 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-800/30 dark:to-transparent rounded-bl-full pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</CardTitle>
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.glow} ring-2 ring-transparent transition-all duration-300 group-hover:scale-110`}>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <TrendingUp className="size-3 text-emerald-500" />
                <span>{stat.description}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
