"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { format } from "date-fns"
import {
  Calendar,
  Clock,
  HelpCircle,
  Info
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Exam {
  id: number
  class_id: number
  name: string
  duration_minutes: number
  status: 'draft' | 'published' | 'archived'
  open_at: string
  close_at: string
  questions_count: number
  class?: {
    class_code: string
    course_name: string
  }
}

interface ExamDetailModalProps {
  exam: Exam | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExamDetailModal({ exam, open, onOpenChange }: ExamDetailModalProps) {
  const router = useRouter()

  if (!exam) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-xl">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2">
            <Info className="size-5 text-primary" />
            Chi tiết bài kiểm tra
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Lớp học</label>
              <div className="flex flex-col">
                <p className="font-bold text-primary">{exam.class?.class_code}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{exam.class?.course_name}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tên bài kiểm tra</label>
              <p className="text-xl font-black leading-tight">{exam.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Thời gian</label>
              <div className="flex items-center gap-2 font-bold text-primary">
                <Clock className="size-4" />
                {exam.duration_minutes} phút
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Trạng thái</label>
              <div>
                <StatusBadge status={exam.status} className="rounded-md" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <Calendar className="size-4" />
                Bắt đầu:
              </div>
              <span className="font-bold">{format(new Date(exam.open_at), 'dd/MM/yyyy HH:mm')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <Calendar className="size-4 text-destructive/60" />
                Kết thúc:
              </div>
              <span className="font-bold">{format(new Date(exam.close_at), 'dd/MM/yyyy HH:mm')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <HelpCircle className="size-4 text-primary/60" />
                Số câu hỏi:
              </div>
              <span className="font-bold">{exam.questions_count} câu</span>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 pb-6 border-t bg-muted/30 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="w-full sm:flex-1 rounded-lg font-bold"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
          <Button
            className="w-full sm:flex-1 rounded-lg font-bold shadow-lg shadow-primary/20"
            onClick={() => {
              router.push(`/teacher/exams/${exam.id}/questions`)
              onOpenChange(false)
            }}
          >
            <HelpCircle className="size-4 mr-2" />
            Cập nhật câu hỏi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
