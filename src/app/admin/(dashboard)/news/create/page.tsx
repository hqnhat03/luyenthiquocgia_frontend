"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
    ChevronLeft,
    Image as ImageIcon,
    Loader2,
    Save
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { QuillEditor } from "@/components/quill-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import api from "@/lib/axios"
import { useLayoutStore } from "@/store/layout-store"
import { AxiosError } from "axios"
import Image from "next/image"

const articleSchema = z.object({
    title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự"),
    content: z.string().min(10, "Nội dung phải có ít nhất 10 ký tự"),
    image: z.any().optional(),
    status: z.coerce.number(),
})

type FormValues = z.infer<typeof articleSchema>

export default function CreateArticlePage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const setHeaderContent = useLayoutStore((state) => state.setHeaderContent)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const quillInsertFnRef = React.useRef<((url: string) => void) | null>(null)
    const uploadTargetRef = React.useRef<"banner" | "quill">("banner")

    const form = useForm<FormValues>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            title: "",
            content: "",
            image: "",
            status: 0,
        },
    })

    const statusOptions = [
        { value: 0, label: "Bản nháp", color: "bg-slate-500" },
        { value: 2, label: "Đã xuất bản", color: "bg-emerald-500" },
        { value: 1, label: "Lưu trữ", color: "bg-rose-500" },
    ]

    const onImageUploadClick = (target: "banner" | "quill") => {
        uploadTargetRef.current = target
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (uploadTargetRef.current === "banner") {
            setSelectedFile(file)
            form.setValue("image", URL.createObjectURL(file))
            if (e.target) e.target.value = ""
        } else {
            setIsUploading(true)
            const formData = new FormData()
            formData.append("file", file)
            formData.append("path", "news")

            try {
                const res = await api.post("/storage/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })

                const url = res.data?.data?.public_url || res.data?.data?.url || res.data?.url
                if (url && quillInsertFnRef.current) {
                    quillInsertFnRef.current(url)
                    toast.success("Tải ảnh lên thành công")
                }
            } catch (err) {
                console.error("Upload error:", err)
                toast.error("Không thể tải ảnh lên")
            } finally {
                setIsUploading(false)
                if (e.target) e.target.value = ""
            }
        }
    }

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("title", data.title)
            formData.append("content", data.content)
            formData.append("status", data.status.toString())
            if (selectedFile) {
                formData.append("image_url", selectedFile)
            }

            const res = await api.post("/admin/news/create", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            if (!res.data?.success && res.status !== 201 && res.status !== 200) {
                throw new Error(res.data?.message || "Có lỗi xảy ra khi tạo bài viết")
            }
            toast.success("Tạo bài viết thành công")
            router.push("/admin/news")
            router.refresh()
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const pageHeader = (
        <div className="flex flex-1 items-center justify-between w-full animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center gap-4">
                <Link href="/admin/news">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold tracking-tight">Tạo bài viết mới</h1>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Select
                    value={form.watch("status")?.toString()}
                    onValueChange={(val) => form.setValue("status", Number(val))}
                >
                    <SelectTrigger className="h-10 w-[160px] bg-muted/50 border-none shadow-none focus:ring-0 text-sm font-medium">
                        <SelectValue placeholder="Trạng thái">
                            {form.watch("status") !== undefined && statusOptions.find((opt) => opt.value === form.watch("status")) ? (
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${statusOptions.find((opt) => opt.value === form.watch("status"))?.color}`} />
                                    {statusOptions.find((opt) => opt.value === form.watch("status"))?.label}
                                </div>
                            ) : "Trạng thái"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent side="bottom" align="end">
                        {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value.toString()} className="text-sm">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${opt.color}`} />
                                    {opt.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="h-10 px-6 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            <span className="text-sm font-bold">Lưu bài viết</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    )

    React.useEffect(() => {
        setHeaderContent(pageHeader)
        return () => setHeaderContent(null)
    }, [setHeaderContent, pageHeader])

    return (
        <div className="flex flex-col gap-6 p-6 w-full mx-auto animate-in fade-in duration-500">
            <div className="w-full space-y-8">
                {/* Banner Image */}
                <div className="space-y-4">
                    <div
                        onClick={() => onImageUploadClick("banner")}
                        className={`
                            aspect-[21/5] w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group
                            ${form.watch("image") ? 'border-transparent bg-muted' : 'border-muted-foreground/20 hover:border-primary/50 bg-background/50'}
                        `}
                    >
                        {form.watch("image") ? (
                            <>
                                <Image
                                    src={form.watch("image")}
                                    alt="Banner Preview"
                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
                                    <div className="bg-primary/90 text-white text-sm font-medium px-6 py-2.5 rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                        Thay đổi ảnh banner
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-center p-4">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary mb-2 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                                    <ImageIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-base font-semibold">Thêm ảnh banner</h3>
                                <p className="text-xs text-muted-foreground">Kích thước đề xuất: 1200x300px</p>
                            </div>
                        )}

                        {isUploading && uploadTargetRef.current === "banner" && (
                            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                    <div className="relative group">
                        <Input
                            placeholder="Nhập tiêu đề bài viết..."
                            className="border-none bg-transparent !text-5xl font-bold p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/10 selection:bg-primary/20 tracking-tighter leading-none py-4"
                            {...form.register("title")}
                        />
                        {form.formState.errors.title && (
                            <p className="text-sm font-medium text-destructive mt-2">
                                {form.formState.errors.title.message}
                            </p>
                        )}
                    </div>

                    <div className="min-h-[600px] border-none rounded-2xl overflow-hidden bg-background shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                        <QuillEditor
                            value={form.watch("content")}
                            onChange={(html) => form.setValue("content", html, { shouldValidate: true })}
                            onImageUpload={() => onImageUploadClick("quill")}
                            onInsertImageReady={(fn) => {
                                quillInsertFnRef.current = fn
                            }}
                            minHeight={550}
                        />
                    </div>
                    {form.formState.errors.content && (
                        <p className="text-sm font-medium text-destructive">
                            {form.formState.errors.content.message}
                        </p>
                    )}
                </div>
            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    )
}
