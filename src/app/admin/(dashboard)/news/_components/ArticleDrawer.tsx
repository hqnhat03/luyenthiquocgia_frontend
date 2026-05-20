"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, Image as ImageIcon, Loader2, Newspaper, Plus, Save } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/axios"
import { Article } from "@/types/NewsType"
import { AxiosError } from "axios"

const articleSchema = z.object({
    title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự"),
    content: z.string().min(10, "Nội dung phải có ít nhất 10 ký tự"),
    image: z.string().url("Vui lòng nhập URL ảnh hợp lệ").or(z.literal("")).optional(),
    status: z.number(),
})

type FormValues = z.infer<typeof articleSchema>

const statusOptions = [
    { value: 0, label: "Bản nháp", activeClass: "bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-800 dark:border-slate-500 dark:text-slate-200" },
    { value: 1, label: "Đã xuất bản", activeClass: "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-500 dark:text-emerald-300" },
    { value: 2, label: "Lưu trữ", activeClass: "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:border-rose-500 dark:text-rose-300" },
]

interface ArticleDrawerProps {
    article?: Article | null
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function ArticleDrawer({
    article,
    onSuccess,
    trigger,
}: ArticleDrawerProps) {
    const isEdit = !!article
    const [open, setOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            title: article?.title ?? "",
            content: article?.content ?? "",
            image: article?.image ?? "",
            status: article?.status ?? 0,
        },
    })

    React.useEffect(() => {
        if (open) {
            form.reset({
                title: article?.title ?? "",
                content: article?.content ?? "",
                image: article?.image ?? "",
                status: article?.status ?? 0,
            })
        }
    }, [article, form, open])

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            if (isEdit) {
                const res = await api.put(`/admin/articles/${article!.id}`, data)
                if (!res.data?.success && res.status !== 200) {
                    throw new Error(res.data?.message || "Có lỗi xảy ra khi cập nhật bài viết")
                }
                toast.success("Cập nhật bài viết thành công")
            } else {
                const res = await api.post("/admin/articles", data)
                if (!res.data?.success && res.status !== 201) {
                    throw new Error(res.data?.message || "Có lỗi xảy ra khi tạo bài viết")
                }
                toast.success("Tạo bài viết thành công")
                form.reset()
            }
            setOpen(false)
            onSuccess?.()
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                toast.error(err.response?.data?.message || "Đã có lỗi xảy ra")
            } else {
                toast.error("Có lỗi xảy ra, vui lòng thử lại sau")
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
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" /> Thêm bài viết
        </Button>
    )

    const triggerEl = trigger ?? defaultTrigger

    return (
        <>
            <span onClick={() => setOpen(true)} style={{ display: "contents" }}>
                {triggerEl}
            </span>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto px-6 pb-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Newspaper className="h-4 w-4" />
                            </div>
                            {isEdit ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
                        </SheetTitle>
                        <SheetDescription>
                            {isEdit
                                ? `Cập nhật nội dung bài viết.`
                                : "Điền thông tin chi tiết để tạo bài viết mới."}
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Title */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                Tiêu đề <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    placeholder="Nhập tiêu đề bài viết..."
                                    className="focus-visible:ring-primary/30"
                                    {...form.register("title")}
                                />
                            </FieldContent>
                            <FieldError errors={[{ message: form.formState.errors.title?.message }]} />
                        </Field>

                        {/* Image URL */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                URL Hình ảnh
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    placeholder="https://example.com/image.jpg"
                                    className="focus-visible:ring-primary/30"
                                    {...form.register("image")}
                                />
                            </FieldContent>
                            <FieldError errors={[{ message: form.formState.errors.image?.message }]} />
                        </Field>

                        {/* Status */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
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
                                                onClick={() => form.setValue("status", opt.value, { shouldValidate: true })}
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

                        {/* Content */}
                        <Field>
                            <FieldLabel className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Nội dung <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    placeholder="Nhập nội dung bài viết..."
                                    className="min-h-[300px] focus-visible:ring-primary/30"
                                    {...form.register("content")}
                                />
                            </FieldContent>
                            <FieldError errors={[{ message: form.formState.errors.content?.message }]} />
                        </Field>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background pb-2">
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setOpen(false)}
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
                                        {isEdit ? "Lưu thay đổi" : "Lưu bài viết"}
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
