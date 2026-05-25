"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { AxiosError } from "axios"
import { Calendar, Loader2 } from "lucide-react"
import * as React from "react"
import { Resolver, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

const examSchema = z.object({
  class_id: z.preprocess(
    (val) => (val === undefined || val === null || val === "" ? undefined : Number(val)),
    z.number({ error: "Vui lòng chọn lớp học" }).min(1, "Vui lòng chọn lớp học")
  ),
  name: z.string().min(1, "Vui lòng nhập tên bài kiểm tra"),
  duration_minutes: z.coerce.number().positive("Thời gian phải lớn hơn 0"),
  status: z.enum(["draft", "published", "archived"]),
  open_at: z.string().min(1, "Vui lòng chọn thời gian bắt đầu"),
  close_at: z.string().min(1, "Vui lòng chọn thời gian kết thúc"),
}).refine((data) => {
  return new Date(data.open_at) < new Date(data.close_at)
}, {
  message: "Thời gian kết thúc phải sau thời gian bắt đầu",
  path: ["close_at"],
})

type ExamFormValues = z.infer<typeof examSchema>

interface CreateExamModalProps {
  onSuccess?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: (Partial<ExamFormValues> & { 
    id: number;
    class?: { class_code: string; course_name?: string } 
  }) | null // For edit mode if needed
}

export function CreateExamModal({ onSuccess, open, onOpenChange, initialData }: CreateExamModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [classes, setClasses] = React.useState<{ id: number; class_code: string; course_name?: string }[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = React.useState(false)

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema) as unknown as Resolver<ExamFormValues>,
    defaultValues: {
      class_id: undefined as unknown as number,
      name: "",
      duration_minutes: 60,
      status: "draft",
      open_at: "",
      close_at: "",
    },
  })

  // Fetch classes when modal opens
  React.useEffect(() => {
    if (open) {
      const fetchClasses = async () => {
        setIsLoadingClasses(true)
        try {
          const response = await api.get("/teacher/classes", {
            params: {
              page: 1,
              per_page: 100,
            }
          })
          if (response.data?.status === "success" || response.data?.success) {
            const data = response.data.data
            const classList = Array.isArray(data) ? data : data?.data || []
            setClasses(classList)
            
            if (initialData && (!initialData.class_id || initialData.class_id === 0) && initialData.class?.class_code) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const matchedClass = classList.find((c: any) => c.class_code === initialData.class?.class_code)
              if (matchedClass) {
                form.setValue('class_id', matchedClass.id)
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch classes:", error)
          toast.error("Không thể tải danh sách lớp học")
        } finally {
          setIsLoadingClasses(false)
        }
      }
      fetchClasses()
    }
  }, [open, initialData, form])

  const formatToLocalDatetime = (dateString?: string) => {
    if (!dateString) return ""
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return ""

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Watch open status to reset form when opened
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          class_id: (initialData.class_id === 0 ? undefined : initialData.class_id) as unknown as number,
          name: initialData.name,
          duration_minutes: initialData.duration_minutes,
          status: initialData.status,
          open_at: formatToLocalDatetime(initialData.open_at),
          close_at: formatToLocalDatetime(initialData.close_at),
        })
      } else {
        form.reset({
          class_id: undefined as unknown as number,
          name: "",
          duration_minutes: 60,
          status: "draft",
          open_at: "",
          close_at: "",
        })
      }
    }
  }, [open, form, initialData])

  const onSubmit = async (values: ExamFormValues) => {
    setIsSubmitting(true)
    try {
      const statusMap: Record<string, number> = {
        draft: 0,
        published: 2,
        archived: 1,
      }

      const formatDateToSql = (dateTimeStr: string) => {
        if (!dateTimeStr) return ""
        const formatted = dateTimeStr.replace('T', ' ')
        return formatted.length === 16 ? `${formatted}:00` : formatted
      }

      const payload = {
        class_id: values.class_id,
        title: values.name,
        duration: values.duration_minutes,
        status: statusMap[values.status],
        start_time: formatDateToSql(values.open_at),
        end_time: formatDateToSql(values.close_at),
      }

      if (initialData) {
        await api.put(`/teacher/class-tests/update`, {
          id: initialData.id,
          ...payload
        }, {
          params: { id: initialData.id }
        })
        toast.success("Cập nhật bài kiểm tra thành công")
      } else {
        await api.post(`/teacher/class-tests/create`, payload)
        toast.success("Tạo bài kiểm tra thành công")
      }
      form.reset()
      onSuccess?.()
      onOpenChange(false)
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error)
        toast.error(error.response?.data?.message || "Đã có lỗi xảy ra")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-lg">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            {initialData ? "Cập nhật bài kiểm tra" : "Tạo bài kiểm tra"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            <Field>
              <FieldLabel>Lớp học</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) => value && form.setValue("class_id", parseInt(value))}
                  value={form.watch("class_id")?.toString() || ""}
                  disabled={isSubmitting || isLoadingClasses || !!initialData}
                >
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue placeholder={isLoadingClasses ? "Đang tải lớp học..." : "Chọn lớp"}>
                      {(() => {
                        const selected = classes.find(cls => cls.id === form.watch("class_id"))
                        if (!selected) return null
                        return selected.course_name 
                          ? `${selected.class_code} (${selected.course_name})`
                          : selected.class_code
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.course_name ? `${cls.class_code} (${cls.course_name})` : cls.class_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.class_id]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Tên bài kiểm tra</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("name")}
                  placeholder="Nhập tên bài kiểm tra"
                  disabled={isSubmitting}
                  className="rounded-lg"
                />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Thời gian làm bài (phút)</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    {...form.register("duration_minutes")}
                    placeholder="60"
                    disabled={isSubmitting}
                    className="rounded-lg"
                  />
                  <FieldError errors={[form.formState.errors.duration_minutes]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Trạng thái</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2 w-full">
                    {[
                      { value: "draft", label: "Bản nháp", activeClass: "bg-slate-50 border-slate-500 text-slate-700" },
                      { value: "published", label: "Công khai", activeClass: "bg-emerald-50 border-emerald-500 text-emerald-700" },
                      { value: "archived", label: "Lưu trữ", activeClass: "bg-blue-50 border-blue-500 text-blue-700" },
                    ].map((opt) => {
                      const isSelected = form.watch("status") === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => form.setValue("status", opt.value as ExamFormValues["status"])}
                          disabled={isSubmitting}
                          className={cn(
                            "flex-1 rounded-lg border px-2 py-1.5 text-sm font-medium transition-all",
                            isSelected
                              ? opt.activeClass
                              : "border-input bg-background/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  <FieldError errors={[form.formState.errors.status]} />
                </FieldContent>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Thời gian bắt đầu</FieldLabel>
                <FieldContent>
                  <Input
                    type="datetime-local"
                    {...form.register("open_at")}
                    disabled={isSubmitting}
                    className="rounded-lg"
                  />
                  <FieldError errors={[form.formState.errors.open_at]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Thời gian kết thúc</FieldLabel>
                <FieldContent>
                  <Input
                    type="datetime-local"
                    {...form.register("close_at")}
                    disabled={isSubmitting}
                    className="rounded-lg"
                  />
                  <FieldError errors={[form.formState.errors.close_at]} />
                </FieldContent>
              </Field>
            </div>
          </div>

          <DialogFooter className="px-6 pt-4 pb-6 border-t bg-muted/30 mt-0">
            <div className="flex w-full sm:w-auto gap-3">
              <DialogClose render={
                <Button variant="outline" className="flex-1 sm:flex-none rounded-lg min-w-[100px]" type="button" disabled={isSubmitting}>
                  Hủy
                </Button>
              } />
              <Button className="flex-1 sm:flex-none rounded-lg min-w-[120px]" type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Cập nhật" : "Tạo bài kiểm tra"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
