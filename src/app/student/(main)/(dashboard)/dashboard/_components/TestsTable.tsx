"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { studentAxios as api } from "@/api/student"

interface StudentTest {
  id: number;
  student_id: number;
  title: string;
  start_time: string;
  end_time: string;
  duration: number;
  created_at: string;
  total_questions: number;
  correct_answers: number;
}

export default function TestsTable() {
  const [tests, setTests] = useState<StudentTest[]>([])
  const [selectedDays, setSelectedDays] = useState<number>(-1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setIsLoading(true)
        const testsRes = await api.get(`/tests?page=1&pagination=10&selected_days=${selectedDays}&from_date=&to_date=`)

        if (testsRes.data.status === 'success' || testsRes.data.success) {
          const testData = testsRes.data.data?.data || testsRes.data.data || []
          setTests(testData)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard tests:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTests()
  }, [selectedDays])

  return (
    <div className="space-y-4 pt-6 border-t border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">Tiến trình của bạn</h2>
        
        <div className="w-[180px]">
          <Select
            value={String(selectedDays)}
            onValueChange={(val) => setSelectedDays(Number(val))}
          >
            <SelectTrigger className="bg-white border-slate-200 text-slate-700 font-medium h-9 rounded-lg shadow-sm">
              <SelectValue>
                {selectedDays === -1 ? "Tất cả" : 
                 selectedDays === 1 ? "Hôm nay" : 
                 selectedDays === 7 ? "7 ngày qua" : 
                 selectedDays === 30 ? "30 ngày qua" : 
                 selectedDays === 90 ? "90 ngày qua" : "Lọc theo ngày"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="-1" className="focus:bg-slate-50 focus:text-slate-900 cursor-pointer">Tất cả</SelectItem>
              <SelectItem value="1" className="focus:bg-slate-50 focus:text-slate-900 cursor-pointer">Hôm nay</SelectItem>
              <SelectItem value="7" className="focus:bg-slate-50 focus:text-slate-900 cursor-pointer">7 ngày qua</SelectItem>
              <SelectItem value="30" className="focus:bg-slate-50 focus:text-slate-900 cursor-pointer">30 ngày qua</SelectItem>
              <SelectItem value="90" className="focus:bg-slate-50 focus:text-slate-900 cursor-pointer">90 ngày qua</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 py-3.5 pl-6">Hoạt động</TableHead>
                <TableHead className="font-semibold text-slate-700 py-3.5">Ngày/Giờ</TableHead>
                <TableHead className="font-semibold text-slate-700 py-3.5 text-center">Đúng/Tổng</TableHead>
                <TableHead className="font-semibold text-slate-700 py-3.5 text-center">Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : tests.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-slate-500">Chưa ghi nhận hoạt động kiểm tra nào trong thời gian này.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/75 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-700 py-3.5 pl-6">Hoạt động</TableHead>
                <TableHead className="font-bold text-slate-700 py-3.5">Ngày/Giờ</TableHead>
                <TableHead className="font-bold text-slate-700 py-3.5 text-center">Đúng/Tổng</TableHead>
                <TableHead className="font-bold text-slate-700 py-3.5 text-center">Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => {
                const progressPercentage = test.total_questions > 0 
                  ? Math.round((test.correct_answers / test.total_questions) * 100)
                  : 0;

                const badgeColor = progressPercentage >= 80 
                  ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                  : progressPercentage >= 50 
                  ? "text-blue-700 bg-blue-50 border-blue-100"
                  : "text-amber-700 bg-amber-50 border-amber-100";

                return (
                  <TableRow key={test.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
                    <TableCell className="font-semibold text-slate-900 py-4 pl-6 min-w-[200px]">
                      {test.title}
                    </TableCell>
                    <TableCell className="text-slate-500 py-4 text-xs font-medium">
                      {new Date(test.created_at).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span className={`inline-flex items-center font-bold px-2.5 py-0.5 rounded-full text-xs border ${badgeColor}`}>
                        {test.correct_answers}/{test.total_questions}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-slate-600 py-4 text-xs">
                      {test.duration} phút
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
