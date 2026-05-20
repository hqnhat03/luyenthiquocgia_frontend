"use client"

import { useAuthStore } from "@/store/auth-store"
import { useState } from "react"
import ClassesTable from "./_components/ClassesTable"
import TestsTable from "./_components/TestsTable"

export default function StudentDashboardPage() {
  const { user } = useAuthStore()
  const [registrationsCount, setRegistrationsCount] = useState<number>(0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Chào mừng trở lại, {user?.name}! 👋</h1>
        <p className="text-slate-500 mt-2">
          {registrationsCount > 0
            ? `Bạn đang có ${registrationsCount} khóa học đăng ký đang chờ sắp xếp lớp.`
            : "Học tập chăm chỉ mỗi ngày để đạt kết quả tốt nhất nhé!"}
        </p>
      </div>

      <div className="space-y-8 max-w-5xl">
        {/* Classes & Pending Registrations */}
        <ClassesTable onRegistrationsLoad={setRegistrationsCount} />

        {/* Tests / Progress */}
        <TestsTable />
      </div>
    </div>
  )
}
