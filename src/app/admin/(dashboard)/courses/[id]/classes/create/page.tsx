"use client"

import { useLayoutStore } from "@/store/layout-store"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { usePermission } from "@/hooks/use-permission"
import { toast } from "sonner"
import { ClassForm } from "./_components/class-form"

export default function CreateClassPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()

  // Kiểm tra quyền
  React.useEffect(() => {
    if (!hasPermission("class_create")) {
      toast.error("Bạn không có quyền thực hiện chức năng này")
      router.back()
    }
  }, [hasPermission, router])

  const { setHeaderContent } = useLayoutStore()

  React.useEffect(() => {
    setHeaderContent(
      <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Tạo lớp học mới
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            type="button"
            className="h-10 px-6 bg-background hover:bg-muted transition-colors border"
            onClick={() => router.back()}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            form="create-class-form"
            className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 transition-all active:scale-95 text-sm font-bold"
          >
            Lưu
          </Button>
        </div>
      </div>
    )
    return () => {
      setHeaderContent(null)
    }
  }, [setHeaderContent, router])

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10 
      animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Form Content */}
      <ClassForm />
    </div>
  )
}
