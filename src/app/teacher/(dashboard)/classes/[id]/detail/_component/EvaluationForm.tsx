"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import api from "@/lib/axios"

interface Student {
  id: number
  name: string
  avatar: string
  email?: string
  phone?: string
}

interface EvaluationFormProps {
  student: Student | null
  classId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const formSchema = z.object({
  rank: z.string().min(1, { message: "Vui lòng chọn xếp loại" }),
  evaluations: z.string().min(10, { message: "Đánh giá phải có ít nhất 10 ký tự" }),
})

type FormValues = z.infer<typeof formSchema>

const RANKS = [
  { value: "0", label: "Xuất sắc" },
  { value: "1", label: "Giỏi" },
  { value: "2", label: "Khá" },
  { value: "3", label: "Trung bình" },
  { value: "4", label: "Yếu" },
]

export function EvaluationForm({ student, classId, open, onOpenChange, onSuccess }: EvaluationFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rank: "",
      evaluations: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      reset({
        rank: "",
        evaluations: "",
      })
    }
  }, [open, reset])

  const onSubmit = async (data: FormValues) => {
    if (!student) return

    try {
      setIsSubmitting(true)
      const response = await api.post('/teacher/classes/student-evaluation', {
        class_id: classId,
        student_id: student.id,
        rank: parseInt(data.rank),
        evaluations: data.evaluations,
      })

      if (response.data?.status === "success" || response.data?.success) {
        toast.success(response.data?.message || "Đánh giá học sinh thành công")
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.error(response.data?.message || "Không thể gửi đánh giá")
      }
    } catch (error: any) {
      console.error("Failed to submit evaluation:", error)
      toast.error(error.response?.data?.message || "Đã có lỗi xảy ra khi kết nối đến máy chủ")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Đánh giá cuối khóa</DialogTitle>
          <DialogDescription>
            Đánh giá kết quả học tập của học sinh <span className="font-bold text-foreground">{student?.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <Field>
            <FieldLabel>Xếp loại</FieldLabel>
            <Controller
              control={control}
              name="rank"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger className={errors.rank ? "border-destructive" : ""}>
                    <SelectValue placeholder="Chọn xếp loại">
                      {field.value ? RANKS.find((r) => r.value === field.value)?.label : "Chọn xếp loại"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {RANKS.map((rank) => (
                      <SelectItem key={rank.value} value={rank.value}>
                        {rank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.rank && <FieldError>{errors.rank.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Nhận xét chi tiết</FieldLabel>
            <Controller
              control={control}
              name="evaluations"
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Nhập nhận xét chi tiết về tình hình học tập của học sinh..."
                  className={`min-h-[120px] resize-none ${errors.evaluations ? "border-destructive" : ""}`}
                />
              )}
            />
            {errors.evaluations && <FieldError>{errors.evaluations.message}</FieldError>}
          </Field>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
