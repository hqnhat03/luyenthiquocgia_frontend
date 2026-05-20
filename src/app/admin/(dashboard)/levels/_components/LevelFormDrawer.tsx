import api from "@/lib/axios"
import { Level } from "@/store/level-store"
import { Subject } from "@/store/subject-store"
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
import { AxiosError } from "axios"

const levelSchema = z.object({
    name: z.string().min(1, "Tên trình độ không được để trống"),
    subject_id: z.string().min(1, "Vui lòng chọn môn học"),
    status: z.string().min(1, "Vui lòng chọn trạng thái"),
})

type FormValues = z.infer<typeof levelSchema>

const statusOptions = [
    {
        value: "0",
        label: "Bản nháp",
        activeClass:
            "bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-800 dark:border-slate-500 dark:text-slate-200",
    },
    {
        value: "2",
        label: "Đã xuất bản",
        activeClass:
            "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-500 dark:text-emerald-300",
    },
    {
        value: "1",
        label: "Lưu trữ",
        activeClass:
            "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:border-rose-500 dark:text-rose-300",
    },
]

type DrawerMode = "create" | "edit" | "view"

interface LevelFormDrawerProps {
    /** Controls which mode is open; undefined = closed */
    mode?: DrawerMode
    /** If provided, the drawer is in "edit" mode; otherwise "create" mode */
    level?: Level | null
    /** Called after a successful create or update */
    onSuccess?: () => void
    onClose?: () => void
    /** Custom trigger element */
    trigger?: React.ReactNode
}

export function LevelFormDrawer({
    mode: externalMode,
    level,
    onSuccess,
    onClose,
    trigger,
}: LevelFormDrawerProps) {
    const isEdit = externalMode === "edit" || (!!level && !externalMode)

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
        resolver: zodResolver(levelSchema),
        defaultValues: {
            name: level?.level ?? "",
            subject_id: level?.subject_id?.toString() ?? "",
            status: level?.status?.toString() ?? "0",
        },
    })

    // Reset form when level changes (switching between rows)
    React.useEffect(() => {
        if (actualOpen) {
            form.reset({
                name: level?.level ?? "",
                subject_id: level?.subject_id?.toString() ?? "",
                status: level?.status?.toString() ?? "0",
            })
        }
    }, [level, form, actualOpen])

    const [subjects, setSubjects] = React.useState<Subject[]>([])

    const fetchSubjects = React.useCallback(async () => {
        try {
            const response = await api.get("/admin/subjects")
            if (response.status === 200) {
                setSubjects(response.data.data || [])
            }
        } catch (error) {
            console.error("Failed to fetch subjects:", error)
        }
    }, [])

    // Fetch subjects when drawer opens
    React.useEffect(() => {
        if (actualOpen) {
            fetchSubjects()
        }
    }, [actualOpen, fetchSubjects])


    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            const payload = {
                level: data.name,
                subject_id: parseInt(data.subject_id),
                status: parseInt(data.status),
            }

            if (level?.id && (isEdit)) {
                const res = await api.put("/admin/subject-levels/update", {
                    ...payload,
                    id: level.id
                })
                if (res.status !== 200) {
                    throw new Error(
                        res.data?.message || "Có lỗi xảy ra khi cập nhật trình độ"
                    )
                }
                toast.success("Cập nhật trình độ thành công")
            } else {
                const res = await api.post("/admin/subject-levels/create", payload)
                if (res.status !== 200 && res.status !== 201) {
                    throw new Error(
                        res.data?.message || "Có lỗi xảy ra khi tạo trình độ"
                    )
                }
                toast.success("Tạo trình độ thành công")
                form.reset({ name: "", subject_id: "", status: "0" })
            }

            handleOpenChange(false)
            onSuccess?.()
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                toast.error(err.response?.data?.message || "Không thể kết nối đến máy chủ")
            } else if (err instanceof Error) {
                toast.error(err.message)
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
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
        </Button>
    ) : (
        <Button className="h-10 px-6 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" />
            <span className="text-sm font-bold">Thêm trình độ</span>
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
                                <Layers className="h-4 w-4" />
                            </div>
                            {isEdit ? "Chỉnh sửa trình độ" : "Thêm trình độ mới"}
                        </SheetTitle>
                        <SheetDescription>
                            {isEdit
                                ? `Cập nhật thông tin trình độ.`
                                : "Điền thông tin chi tiết để tạo một trình độ mới."}
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Level Name */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                Tên trình độ <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    placeholder="VD: Lớp 1, Lớp 2, Đại học năm 1..."
                                    className="focus-visible:ring-primary/30"
                                    {...form.register("name")}
                                />
                            </FieldContent>
                            <FieldError errors={[{ message: form.formState.errors.name?.message }]} />
                        </Field>

                        {/* Subject */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                Môn học <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <div className="grid gap-2">
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        {...form.register("subject_id")}
                                    >
                                        <option value="">Chọn môn học</option>
                                        {subjects.map((subject) => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.name} - {subject.education_level}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </FieldContent>
                            <FieldError
                                errors={[{ message: form.formState.errors.subject_id?.message }]}
                            />
                        </Field>

                        {/* Status — radio-style buttons */}
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
                                                onClick={() =>
                                                    form.setValue("status", opt.value as "draft" | "published" | "archived", {
                                                        shouldValidate: true,
                                                    })
                                                }
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
                            <FieldError
                                errors={[{ message: form.formState.errors.status?.message }]}
                            />
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
                                        {isEdit ? "Lưu thay đổi" : "Lưu trình độ"}
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
