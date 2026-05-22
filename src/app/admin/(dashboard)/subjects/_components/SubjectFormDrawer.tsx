"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Activity, BookOpen, Layers, Loader2, Plus, Save } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import api from "@/lib/axios"
import { Subject } from "@/store/subject-store"
import { AxiosError } from "axios"

const subjectSchema = z.object({
    name: z.string().min(2, "Tên môn học phải có ít nhất 2 ký tự"),
    category: z.string().min(1, "Vui lòng chọn danh mục"),
    education_level: z.string().min(1, "Vui lòng nhập cấp độ học vấn"),
    target_student: z.string().min(1, "Vui lòng chọn đối tượng học sinh"),
    status: z.enum(["draft", "published", "archived"], {
        error: "Vui lòng chọn trạng thái",
    }),
})

type FormValues = z.infer<typeof subjectSchema>

const statusOptions = [
    { value: "draft", label: "Bản nháp", activeClass: "bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-800 dark:border-slate-500 dark:text-slate-200" },
    { value: "published", label: "Đã xuất bản", activeClass: "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-500 dark:text-emerald-300" },
    { value: "archived", label: "Lưu trữ", activeClass: "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:border-rose-500 dark:text-rose-300" },
]

const targetStudentOptions = [
    { value: "0", label: "Học sinh" },
    { value: "1", label: "Nhân viên" },
    { value: "2", label: "Cả hai" },
]

type DrawerMode = "create" | "edit" | "view"

interface SubjectFormDrawerProps {
    /** Controls which mode is open; undefined = closed */
    mode?: DrawerMode
    /** If provided, the drawer is in "edit" mode; otherwise "create" mode */
    subject?: Subject | null
    /** Called after a successful create or update */
    onSuccess?: () => void
    onClose?: () => void
    trigger?: React.ReactNode
}

export function SubjectFormDrawer({
    mode: externalMode,
    subject,
    onSuccess,
    onClose,
    trigger,
}: SubjectFormDrawerProps) {

    const isEdit = externalMode === "edit" || (!!subject && !externalMode)
    
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Separate state for internal open control when using trigger
    const [internalOpen, setInternalOpen] = React.useState(false)
    const isControlled = externalMode !== undefined
    const actualOpen = isControlled ? !!externalMode : internalOpen

    const handleOpenChange = (val: boolean) => {
        if (isControlled) {
            if (!val) onClose?.()
        } else {
            setInternalOpen(val)
        }
    }

    const form = useForm<FormValues>({
        resolver: zodResolver(subjectSchema),
        defaultValues: {
            name: subject?.name ?? "",
            category: subject?.category ?? "",
            education_level: subject?.education_level ?? "",
            target_student: subject?.target_student?.toString() ?? "0",
            status: subject?.status ?? "draft",
        },
    })

    // Mapping logic
    const statusMap: Record<string, number> = {
        draft: 0,
        archived: 1,
        published: 2,
    }

    // Reset form when subject changes (switching between rows)
    React.useEffect(() => {
        if (actualOpen) {
            form.reset({
                name: subject?.name ?? "",
                category: subject?.category ?? "",
                education_level: subject?.education_level ?? "",
                target_student: subject?.target_student?.toString() ?? "0",
                status: subject?.status ?? "draft",
            })
        }
    }, [subject, form, actualOpen])



    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            const payload = {
                ...data,
                status: statusMap[data.status],
                target_student: parseInt(data.target_student),
                id: subject?.id // Add ID for update
            }

            if (subject?.id && (isEdit)) {
                const res = await api.put(`/admin/subjects/update`, payload)
                if (!res.data?.success && res.status !== 200) {
                    throw new Error(res.data?.message || "Có lỗi xảy ra khi cập nhật môn học")
                }
                toast.success("Cập nhật môn học thành công")
            } else {
                const res = await api.post("/admin/subjects/create", payload)
                if (!res.data?.success && res.status !== 201) {
                    throw new Error(res.data?.message || "Có lỗi xảy ra khi tạo môn học")
                }
                toast.success("Tạo môn học thành công")
                form.reset({ name: "", category: "", education_level: "", target_student: "0", status: "draft" })
            }
            handleOpenChange(false)
            onSuccess?.()
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                toast.error(err.response?.data?.message || "Đã có lỗi xảy ra")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const defaultTrigger = isEdit ? (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors"
            title="Chỉnh sửa"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
        </Button>
    ) : (
        <Button className="h-10 px-6 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" /> 
            <span className="text-sm font-bold">Thêm môn học</span>
        </Button>
    )

    const triggerEl = trigger !== undefined ? (
        trigger ? (
            <span onClick={() => handleOpenChange(true)} style={{ display: "contents" }}>
                {trigger}
            </span>
        ) : null
    ) : (
        <span onClick={() => handleOpenChange(true)} style={{ display: "contents" }}>
            {defaultTrigger}
        </span>
    )

    return (
        <>
            {triggerEl}
            <Sheet open={actualOpen} onOpenChange={handleOpenChange}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-6 pb-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <BookOpen className="h-4 w-4" />
                            </div>
                            {isEdit ? "Chỉnh sửa môn học" : "Thêm môn học mới"}
                        </SheetTitle>
                        <SheetDescription>
                            {isEdit
                                ? `Cập nhật thông tin môn học.`
                                : "Điền thông tin chi tiết để tạo một môn học mới."}
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Subject Name */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                Tên môn học <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    placeholder="VD: Toán học cao cấp, Tiếng Anh giao tiếp..."
                                    className="focus-visible:ring-primary/30"
                                    {...form.register("name")}
                                />
                            </FieldContent>
                            <FieldError errors={[{ message: form.formState.errors.name?.message }]} />
                        </Field>

                        {/* Category */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-muted-foreground" />
                                Danh mục <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    placeholder="VD: Khoa học tự nhiên, Kỹ năng mềm..."
                                    className="focus-visible:ring-primary/30"
                                    {...form.register("category")}
                                />
                            </FieldContent>
                            <FieldError errors={[{ message: form.formState.errors.category?.message }]} />
                        </Field>

                        {/* Education Level */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                Cấp độ học vấn <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    placeholder="VD: Tiểu học, Trung học, Đại học..."
                                    className="focus-visible:ring-primary/30"
                                    {...form.register("education_level")}
                                />
                            </FieldContent>
                            <FieldError errors={[{ message: form.formState.errors.education_level?.message }]} />
                        </Field>

                        {/* Target Student */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                Đối tượng học sinh <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <div className="flex gap-2">
                                    {targetStudentOptions.map((opt) => {
                                        const isSelected = form.watch("target_student") === opt.value
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => form.setValue("target_student", opt.value, { shouldValidate: true })}
                                                className={[
                                                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                                                    isSelected
                                                        ? "bg-primary/10 border-primary text-primary"
                                                        : "border-input bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                                                ].join(" ")}
                                            >
                                                {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </FieldContent>
                            <FieldError errors={[{ message: form.formState.errors.target_student?.message }]} />
                        </Field>

                        {/* Status */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                Trạng thái <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <div className="flex gap-2">
                                    {statusOptions.map((opt) => {
                                        const isSelected = form.watch("status") === opt.value
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => form.setValue("status", opt.value as FormValues["status"], { shouldValidate: true })}
                                                className={[
                                                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                                                    isSelected
                                                        ? opt.activeClass
                                                        : "border-input bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                                                ].join(" ")}
                                            >
                                                {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </FieldContent>
                            <FieldError errors={[{ message: form.formState.errors.status?.message }]} />
                        </Field>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t">
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => handleOpenChange(false)}
                                className="hover:bg-muted"
                                disabled={isSubmitting}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                type="submit"
                                className="min-w-[140px] shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isEdit ? "Lưu thay đổi" : "Lưu môn học"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </>
    )
}
