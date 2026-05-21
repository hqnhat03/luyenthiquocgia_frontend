"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
    Camera,
    Check,
    Edit,
    Loader2,
    Mail,
    Save,
    Shield,
    ShieldCheck,
    User
} from "lucide-react"
import * as React from "react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Can } from "@/components/auth/can"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { type Admin } from "@/types/AdminType"
import { type Role } from "@/types/RoleType"
import { AxiosError } from "axios"

// ─────────────────────────── Schema ───────────────────────────

const adminSchema = z.object({
    first_name: z.string().min(1, "Họ phải có ít nhất 1 ký tự"),
    last_name: z.string().min(1, "Tên phải có ít nhất 1 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    avatar_url: z.any().nullable().optional(),
    status: z.union([z.literal("1"), z.literal("0")]),
    role_id: z.coerce.number().min(1, "Vui lòng chọn một vai trò"),
})

type AdminFormValues = z.infer<typeof adminSchema>

// ─────────────────────────── Helpers ───────────────────────────



const statusOptions = [
    {
        value: "1",
        label: "Hoạt động",
        activeClass:
            "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-500 dark:text-emerald-300",
    },
    {
        value: "0",
        label: "Bị chặn",
        activeClass:
            "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:border-rose-500 dark:text-rose-300",
    },
]



// ─────────────────────────── Props ───────────────────────────

type DrawerMode = "create" | "edit" | "view"

interface AdminDrawerProps {
    mode?: DrawerMode
    admin?: Admin | null
    onSuccess?: (data?: Admin) => void
    onClose?: () => void
    trigger?: React.ReactNode
    roles?: Role[]
    isLoadingRoles?: boolean
}

// ─────────────────────────── Component ───────────────────────────

export function AdminDrawer({
    mode: externalMode,
    admin,
    onSuccess,
    onClose,
    trigger,
    roles: externalRoles,
    isLoadingRoles: externalIsLoadingRoles,
}: AdminDrawerProps) {
    const [internalMode, setInternalMode] = useState<DrawerMode | undefined>(
        externalMode
    )
    const open = !!internalMode

    useEffect(() => {
        setInternalMode(externalMode)
    }, [externalMode])

    const handleOpenChange = (val: boolean) => {
        if (!val) {
            setInternalMode(undefined)
            onClose?.()
        }
    }

    const [internalRoles, setInternalRoles] = useState<Role[]>(externalRoles || [])
    const [internalIsLoadingRoles, setInternalIsLoadingRoles] = useState(externalIsLoadingRoles || false)

    useEffect(() => {
        if (externalRoles) setInternalRoles(externalRoles)
    }, [externalRoles])

    useEffect(() => {
        if (externalIsLoadingRoles !== undefined) setInternalIsLoadingRoles(externalIsLoadingRoles)
    }, [externalIsLoadingRoles])

    const form = useForm<AdminFormValues>({
        resolver: zodResolver(adminSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            avatar_url: null,
            status: "1" as const,
            role_id: 2, // Default to admin role if you know the ID
        },
    })

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue,
    } = form

    const currentAvatar = watch("avatar_url")
    const currentRoleId = watch("role_id")

    const [isFetching, setIsFetching] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const fetchedAdminIdRef = React.useRef<string | number | null>(null)

    // Reset + load data when drawer opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!open) {
            fetchedAdminIdRef.current = null
            return
        }

        // Fetch internalRoles if not already fetched
        if (internalRoles.length === 0) {
            setInternalIsLoadingRoles(true)
            api.get("/admin/roles")
                .then(res => {
                    const data = res.data?.data || res.data
                    if (Array.isArray(data)) setInternalRoles(data)
                })
                .catch(() => toast.error("Không thể tải danh sách vai trò"))
                .finally(() => setInternalIsLoadingRoles(false))
        }

        if ((internalMode === "edit" || internalMode === "view") && admin) {
            if (fetchedAdminIdRef.current === admin.id) return

            setIsFetching(true)
            api.get("/admin/admins/detail", { params: { id: admin.id } })
                .then((res) => {
                    const data = res.data?.data || res.data
                    reset({
                        first_name: data.first_name || "",
                        last_name: data.last_name || "",
                        email: data.email || "",
                        status: (String(data.status) === "0" ? "0" : "1") as "0" | "1",
                        avatar_url: data.avatar_url || null,
                        role_id: Number(data.role_id),
                    })
                    fetchedAdminIdRef.current = admin.id
                    setPreviewAvatar(null)
                })
                .catch((err) => {
                    toast.error(
                        err.response?.data?.message ||
                        "Không thể tải thông tin quản trị viên"
                    )
                    handleOpenChange(false)
                })
                .finally(() => setIsFetching(false))
        } else {
            if (fetchedAdminIdRef.current === "create") return

            reset({
                first_name: "",
                last_name: "",
                email: "",
                status: "1" as const,
                avatar_url: null,
                role_id: internalRoles.length > 0 ? internalRoles[0].id : 0,
            })
            fetchedAdminIdRef.current = "create"
            setPreviewAvatar(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, internalMode, admin?.id])

    const onSubmit = async (data: AdminFormValues) => {
        setIsSubmitting(true)
        try {
            // Chuyển đổi sang FormData để gửi file
            const formData = new FormData()
            
            // Append tất cả các trường vào FormData
            Object.entries(data).forEach(([key, value]) => {
                if (key === "avatar_url") {
                    if (value instanceof File) {
                        formData.append("avatar_url", value)
                    } else if (value === null || value === "") {
                        formData.append("avatar_url", "")
                    }
                } else if (key === "status") {
                    formData.append(key, String(Number(value)))
                } else if (value !== null && value !== undefined) {
                    formData.append(key, value.toString())
                }
            })

            if (internalMode === "edit" && admin) {
                formData.append("id", admin.id.toString())
                const res = await api.post("/admin/admins/update", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
                if (res.data?.status !== "success")
                    throw new Error(res.data.message || "Lỗi khi cập nhật")
                toast.success("Cập nhật quản trị viên thành công!")
                setInternalMode("view")
                onSuccess?.(res.data?.data || res.data)
            } else {
                const res = await api.post("/admin/admins/create", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
                if (res.data?.status !== "success")
                    throw new Error(res.data.message || "Lỗi khi tạo")
                toast.success("Thêm quản trị viên thành công!")
                handleOpenChange(false)
                onSuccess?.()
            }
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                toast.error(err.response?.data?.message || "Đã có lỗi xảy ra.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRoleSelect = (roleId: number) => {
        setValue("role_id", roleId, { shouldValidate: true })
    }

    const handleAvatarClick = () => {
        if (isDisabled || isView) return
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Chỉ set file vào form state, không gọi API upload
        setValue("avatar_url", file, { shouldValidate: true })
        
        // Tạo preview URL để hiển thị ngay trên UI
        const previewUrl = URL.createObjectURL(file)
        setPreviewAvatar(previewUrl)
    }

    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
    const displayAvatar = previewAvatar || (
        typeof currentAvatar === "string" && currentAvatar
            ? (currentAvatar.startsWith("http") || currentAvatar.startsWith("data:")
                ? currentAvatar
                : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${currentAvatar}`)
            : null
    )

    const isView = internalMode === "view"
    const isDisabled = isSubmitting || isFetching

    const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) => (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
                <span className="text-sm font-medium text-foreground break-words">{value || "—"}</span>
            </div>
        </div>
    )

    const modeConfig = {
        create: { title: "Thêm quản trị viên mới", description: "Tạo tài khoản mới cho nhân sự quản lý hệ thống." },
        edit: { title: "Chỉnh sửa quản trị viên", description: "Cập nhật thông tin tài khoản quản trị viên." },
        view: { title: "Chi tiết quản trị viên", description: "Xem thông tin chi tiết và quyền hạn của quản trị viên." },
    }

    return (
        <>
            {trigger && (
                <span onClick={() => setInternalMode(externalMode ?? "create")} style={{ display: "contents" }}>
                    {trigger}
                </span>
            )}
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-6 pb-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            {internalMode ? modeConfig[internalMode].title : "Quản trị viên"}
                        </SheetTitle>
                        <SheetDescription>
                            {internalMode ? modeConfig[internalMode].description : ""}
                        </SheetDescription>
                    </SheetHeader>

                    {isFetching ? (
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : isView ? (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center gap-3 py-4">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-lg ring-2 ring-primary/20">
                                    <AvatarImage src={displayAvatar || ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                        {watch("last_name")?.substring(0, 2).toUpperCase() || 
                                         watch("first_name")?.substring(0, 2).toUpperCase() || "AD"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold">{watch("first_name")} {watch("last_name")}</h3>
                                    <Badge className={cn("mt-1", watch("status") === "1" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")} variant="outline">
                                        {watch("status") === "1" ? "Hoạt động" : "Bị chặn"}
                                    </Badge>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <DetailRow icon={Mail} label="Email" value={watch("email")} />
                                <DetailRow
                                    icon={Shield}
                                    label="Trạng thái"
                                    value={watch("status") === "1" ? "Hoạt động" : "Bị chặn"}
                                />
                            </div>
                            <Separator />
                            <div className="space-y-3">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" /> Vai trò hệ thống
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {internalRoles.filter(r => r.id === currentRoleId).map(r => (
                                        <Badge key={r.id} variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-normal">
                                            {r.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="ghost" onClick={() => handleOpenChange(false)}>Đóng</Button>
                                <Can permission="admin_edit">
                                    <Button onClick={() => setInternalMode("edit")}>
                                        <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                                    </Button>
                                </Can>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="flex flex-col items-center gap-2 py-2">
                                <div
                                    className={cn(
                                        "relative group cursor-pointer",
                                        (isDisabled) && "cursor-not-allowed opacity-70"
                                    )}
                                    onClick={handleAvatarClick}
                                >
                                    <Avatar className="h-28 w-28 border-4 border-background shadow-lg ring-2 ring-primary/10 transition-all hover:ring-primary/40 relative">
                                        <AvatarImage src={displayAvatar || ""} className="object-cover" />
                                        <AvatarFallback className="bg-primary/5">
                                            <User className="h-12 w-12 text-primary/30" />
                                        </AvatarFallback>

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="h-8 w-8 text-white" />
                                        </div>
                                    </Avatar>
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Click để {displayAvatar ? "đổi" : "tải"} ảnh đại diện
                                </p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <Field data-invalid={!!errors.first_name}>
                                    <FieldLabel>Họ <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <Input {...register("first_name")} placeholder="VD: Nguyễn" disabled={isDisabled} />
                                    </FieldContent>
                                    <FieldError errors={[{ message: errors.first_name?.message }]} />
                                </Field>
                                <Field data-invalid={!!errors.last_name}>
                                    <FieldLabel>Tên <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <Input {...register("last_name")} placeholder="VD: Văn A" disabled={isDisabled} />
                                    </FieldContent>
                                    <FieldError errors={[{ message: errors.last_name?.message }]} />
                                </Field>
                            </div>
                            <Field data-invalid={!!errors.email}>
                                <FieldLabel>Email đăng nhập <span className="text-destructive">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register("email")} type="email" placeholder="admin@example.com" disabled={isDisabled} />
                                </FieldContent>
                                <FieldError errors={[{ message: errors.email?.message }]} />
                            </Field>
                            <Field>
                                <FieldLabel>Trạng thái</FieldLabel>
                                <div className="flex gap-2">
                                    {statusOptions.map((opt) => {
                                        const isSelected = watch("status") === opt.value
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => setValue("status", opt.value as "1" | "0", { shouldValidate: true })}
                                                className={cn(
                                                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all disabled:opacity-50",
                                                    isSelected
                                                        ? opt.activeClass
                                                        : "border-input bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </Field>

                            <Separator />
                            <div className="space-y-4">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" /> Phân quyền hệ thống <span className="text-destructive">*</span>
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {internalIsLoadingRoles ? (
                                        [1, 2].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                                    ) : (
                                        internalRoles.map((role) => (
                                            <div
                                                key={role.id}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                                                    currentRoleId === role.id
                                                        ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20 shadow-sm shadow-primary/5"
                                                        : "bg-muted/5 border-slate-200 dark:border-slate-800 hover:border-primary/30"
                                                )}
                                                onClick={() => handleRoleSelect(role.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                                        currentRoleId === role.id
                                                            ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                                                            : "border-slate-300 dark:border-slate-600"
                                                    )}>
                                                        {currentRoleId === role.id && <Check className="h-3 w-3 stroke-[3]" />}
                                                    </div>
                                                    <span className={cn(
                                                        "text-sm font-medium transition-colors",
                                                        currentRoleId === role.id ? "text-primary" : "text-slate-600 dark:text-slate-400"
                                                    )}>
                                                        {role.name}
                                                    </span>
                                                </div>
                                                {currentRoleId === role.id && <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] font-bold border-none uppercase tracking-wider">Active</Badge>}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <FieldError errors={[{ message: errors.role_id?.message }]} />
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t mt-8">
                                <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isDisabled}>Hủy</Button>
                                <Button type="submit" disabled={isDisabled} className="min-w-[120px] shadow-lg shadow-primary/20 transition-all active:scale-95">
                                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...</> : <><Save className="mr-2 h-4 w-4" /> Lưu</>}
                                </Button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </>
    )
}
