"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
    Briefcase,
    Calendar,
    CalendarIcon,
    Edit,
    FileText,
    Globe,
    GraduationCap,
    Info,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    User,
    Users
} from "lucide-react"
import Image from "next/image"
import * as React from "react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
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
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { Teacher } from "@/types/TeacherType"
import { AxiosError } from "axios"

// ─────────────────────────── Schema ───────────────────────────

const teacherSchema = z.object({
    first_name: z.string().min(1, { message: "Vui lòng nhập họ và tên đệm" }),
    last_name: z.string().min(1, { message: "Vui lòng nhập tên" }),
    email: z.email({ message: "Email không hợp lệ" }),
    tel: z.string().min(10, { message: "Số điện thoại không hợp lệ" }).max(12, { message: "Số điện thoại tối đa 12 chữ số" }),
    address: z.string().min(1, { message: "Vui lòng nhập địa chỉ" }),
    nationality: z.string().min(1, { message: "Vui lòng nhập quốc tịch" }),
    gender: z
        .enum(["male", "female", "other"], { error: "Vui lòng chọn giới tính" })
        .or(z.string()),
    specialization: z.array(z.number()).min(1, { message: "Vui lòng chọn ít nhất một chuyên môn" }),
    expertise: z.string().optional(),
    experience: z.string().min(1, { message: "Vui lòng nhập kinh nghiệm" }),
    target_student: z.string().min(1, { message: "Vui lòng chọn đối tượng học sinh" }),
    status: z.enum(["active", "inactive"], {
        error: "Vui lòng chọn trạng thái",
    }),
    date_of_birth: z.string().min(1, { message: "Vui lòng chọn ngày sinh" }),
    avatar: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
})

type TeacherFormValues = z.infer<typeof teacherSchema>

// ─────────────────────────── Helpers ───────────────────────────

const genderOptions = [
    {
        value: "male",
        label: "Nam",
        activeClass:
            "bg-blue-500/10 border-blue-500/50 text-blue-600 dark:bg-blue-950 dark:border-blue-500 dark:text-blue-300",
    },
    {
        value: "female",
        label: "Nữ",
        activeClass:
            "bg-pink-500/10 border-pink-500/50 text-pink-600 dark:bg-pink-950 dark:border-pink-500 dark:text-pink-300",
    },
]

const statusOptions = [
    {
        value: "active",
        label: "Hoạt động",
        activeClass:
            "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-500 dark:text-emerald-300",
    },
    {
        value: "inactive",
        label: "Bị khóa",
        activeClass:
            "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:border-rose-500 dark:text-rose-300",
    },
]

const targetStudentOptions = [
    { value: "all", label: "Tất cả", icon: Globe },
    { value: "student", label: "Học sinh", icon: GraduationCap },
    { value: "employee", label: "Nhân viên", icon: Briefcase },
]

function getLabel(options: { value: string; label: string }[], val?: string) {
    return options.find((o) => o.value === val)?.label ?? val ?? "—"
}

// ─────────────────────────── Props ───────────────────────────

type DrawerMode = "create" | "edit" | "view"

interface TeacherDrawerProps {
    /** Controls which mode is open; undefined = closed */
    mode?: DrawerMode
    /** Required for edit / view */
    teacher?: Teacher | null
    /** Callback after successful create/edit */
    onSuccess?: (data?: Teacher) => void
    onClose?: () => void
    /** Custom trigger element — wrapping will open the drawer.
     *  If omitted, you must control open state externally via `mode`. */
    trigger?: React.ReactNode
}

// ─────────────────────────── Component ───────────────────────────

export function TeacherDrawer({
    mode: externalMode,
    teacher,
    onSuccess,
    onClose,
    trigger,
}: TeacherDrawerProps) {
    const [internalMode, setInternalMode] = useState<DrawerMode | undefined>(
        externalMode
    )
    const open = !!internalMode

    // Keep in sync with external control
    useEffect(() => {
        setInternalMode(externalMode)
    }, [externalMode])

    const handleOpenChange = (val: boolean) => {
        if (!val) {
            setInternalMode(undefined)
            onClose?.()
        }
    }

    // ── Form ──
    const form = useForm<TeacherFormValues>({
        resolver: zodResolver(teacherSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            tel: "",
            address: "",
            nationality: "Việt Nam",
            gender: "male",
            specialization: [],
            expertise: "",
            experience: "",
            target_student: "all",
            status: "active",
            date_of_birth: "",
            avatar: "",
            bio: "",
        },
    })

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        watch,
        setValue,
    } = form

    const currentAvatar = watch("avatar")
    const fullName = `${watch("first_name") || ""} ${watch("last_name") || ""}`.trim() || "Giáo viên"

    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [allSubjects, setAllSubjects] = useState<{ id: number; name: string }[]>([])
    const [isFetching, setIsFetching] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const fetchedTeacherIdRef = React.useRef<string | null>(null)

    // Load subjects when drawer opens
    useEffect(() => {
        if (!open) return
        api.get("/common/subjects")
            .then((res) => {
                const data = res.data?.data || res.data || []
                setAllSubjects(data)
            })
            .catch((err) => {
                console.error("Lỗi khi tải môn học:", err)
            })
    }, [open])

    // Reset + load data when drawer opens
    useEffect(() => {
        if (!open) {
            fetchedTeacherIdRef.current = null
            setAvatarFile(null)
            return
        }

        if ((internalMode === "edit" || internalMode === "view") && teacher) {
            const cacheKey = `${internalMode}-${teacher.id}`
            if (fetchedTeacherIdRef.current === cacheKey) return

            setIsFetching(true)
            const endpoint = internalMode === "view" ? "/admin/teachers/detail" : "/admin/teachers/form-update"
            api.get(endpoint, { params: { id: teacher.id } })
                .then((res) => {
                    const data = res.data?.data || res.data
                    
                    let ts = "all"
                    if (data.target_student === 0) ts = "student"
                    else if (data.target_student === 1) ts = "employee"

                    const spec = Array.isArray(data.teaching_abilities)
                        ? data.teaching_abilities.map((ta: any) => Number(ta.subject_id))
                        : Array.isArray(data.teachingAbilities)
                            ? data.teachingAbilities.map((ta: any) => Number(ta.subject_id))
                            : []

                    reset({
                        first_name: data.first_name || "",
                        last_name: data.last_name || "",
                        email: data.email || "",
                        tel: data.tel || "",
                        address: data.address || "",
                        nationality: data.nationality || "Việt Nam",
                        gender: data.gender === 0 ? "female" : "male",
                        specialization: spec,
                        experience: data.experience_years?.toString() || "",
                        target_student: ts,
                        status: data.status === 1 ? "active" : "inactive",
                        date_of_birth: data.birth_date
                            ? format(new Date(data.birth_date), "yyyy-MM-dd")
                            : "",
                        avatar: data.avatar_url || "",
                        bio: data.introduction || "",
                    })
                    fetchedTeacherIdRef.current = cacheKey
                })
                .catch((err) => {
                    toast.error(
                        err.response?.data?.message ||
                        "Không thể tải thông tin giáo viên"
                    )
                    handleOpenChange(false)
                })
                .finally(() => setIsFetching(false))
        } else {
            if (fetchedTeacherIdRef.current === "create") return

            reset({
                first_name: "",
                last_name: "",
                email: "",
                tel: "",
                address: "",
                nationality: "Việt Nam",
                gender: "male",
                specialization: [],
                expertise: "",
                experience: "",
                target_student: "all",
                status: "active",
                date_of_birth: "",
                avatar: "",
                bio: "",
            })
            setAvatarFile(null)
            fetchedTeacherIdRef.current = "create"
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, internalMode, teacher?.id])

    // Revoke local object URL to avoid leaks
    useEffect(() => {
        return () => {
            if (currentAvatar && currentAvatar.startsWith("blob:")) {
                URL.revokeObjectURL(currentAvatar)
            }
        }
    }, [currentAvatar])

    // ── Submit ──
    const onSubmit = async (data: TeacherFormValues) => {
        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("first_name", data.first_name)
            formData.append("last_name", data.last_name)
            formData.append("email", data.email)
            formData.append("tel", data.tel)
            formData.append("address", data.address)
            formData.append("nationality", data.nationality)
            formData.append("gender", data.gender === "female" ? "0" : "1")
            formData.append("birth_date", data.date_of_birth)
            formData.append("experience_years", data.experience)
            formData.append("status", data.status === "active" ? "1" : "0")
            
            let ts = "2"
            if (data.target_student === "student") ts = "0"
            else if (data.target_student === "employee") ts = "1"
            formData.append("target_student", ts)

            if (data.bio) {
                formData.append("introduction", data.bio)
            }

            // Append specialization subject IDs array
            data.specialization.forEach((subId) => {
                formData.append("specialization[]", subId.toString())
            })

            // Append avatar file
            if (avatarFile) {
                formData.append("avatar_url", avatarFile)
            } else if (data.avatar === null || data.avatar === "") {
                formData.append("avatar_url", "")
            }

            if (internalMode === "edit" && teacher) {
                formData.append("id", teacher.id.toString())
                const res = await api.post(`/admin/teachers/update`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
                if (res.data?.success === false || res.data?.status === "error")
                    throw new Error(res.data.message || "Lỗi khi cập nhật")
                toast.success("Cập nhật giáo viên thành công!")
                setInternalMode("view")
                onSuccess?.()
            } else {
                const res = await api.post("/admin/teachers/create", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
                if (res.data?.success === false || res.data?.status === "error")
                    throw new Error(res.data.message || "Lỗi khi tạo")
                toast.success("Thêm giáo viên thành công!")
                reset()
                handleOpenChange(false)
                onSuccess?.()
            }
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                const msg = err.response?.data?.message || "Đã có lỗi xảy ra."
                toast.error(msg)
                if (err.response?.data?.errors) {
                    Object.entries(err.response.data.errors).forEach(
                        ([key, val]) => {
                            // Translate backend errors keys to form fields
                            let formKey = key as keyof TeacherFormValues
                            if (key === "tel") formKey = "tel"
                            if (key === "birth_date") formKey = "date_of_birth"
                            if (key === "nationality") formKey = "nationality"
                            if (key === "experience_years") formKey = "experience"
                            if (key === "introduction") formKey = "bio"
                            
                            form.setError(formKey, {
                                message: (val as string[] | string)[0],
                            })
                        }
                    )
                }
            } else {
                toast.error(err instanceof Error ? err.message : "Đã có lỗi xảy ra")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    // ── Upload ──
    const handleAvatarClick = () => {
        if (isDisabled || isView) return
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setAvatarFile(file)
        const localUrl = URL.createObjectURL(file)
        form.setValue("avatar", localUrl, { shouldValidate: true })
    }

    // ── Title & icon per mode ──
    const modeConfig: Record<
        DrawerMode,
        { title: string; description: string }
    > = {
        create: {
            title: "Thêm giáo viên mới",
            description: "Điền thông tin để tạo hồ sơ giáo viên.",
        },
        edit: {
            title: "Chỉnh sửa giáo viên",
            description: "Cập nhật thông tin chi tiết của giáo viên.",
        },
        view: {
            title: "Chi tiết giáo viên",
            description: "Xem toàn bộ thông tin của giáo viên.",
        },
    }

    const isView = internalMode === "view"
    const isDisabled = isSubmitting || isFetching

    // ── Render detail info row ──
    const DetailRow = ({
        icon: Icon,
        label,
        value,
    }: {
        icon: React.ElementType
        label: string
        value?: string | null
    }) => (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {label}
                </span>
                <span className="text-sm font-medium text-foreground break-words">
                    {value || "—"}
                </span>
            </div>
        </div>
    )

    // ─── Trigger wrapping ────────
    const triggerEl = trigger ? (
        <span
            onClick={() => setInternalMode(externalMode ?? "create")}
            style={{ display: "contents" }}
        >
            {trigger}
        </span>
    ) : null

    return (
        <>
            {triggerEl}
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent className="w-full sm:max-w-xl overflow-y-auto overflow-x-hidden px-6 pb-6">
                    {/* Header */}
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <GraduationCap className="h-4 w-4" />
                            </div>
                            {internalMode
                                ? modeConfig[internalMode].title
                                : "Giáo viên"}
                        </SheetTitle>
                        <SheetDescription>
                            {internalMode
                                ? modeConfig[internalMode].description
                                : ""}
                        </SheetDescription>
                    </SheetHeader>

                    {/* Loading skeleton */}
                    {isFetching ? (
                        <div className="space-y-4">
                            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : isView ? (
                        /* ──────────── VIEW MODE ──────────── */
                        <div className="space-y-6">
                            {/* Avatar + name */}
                            <div className="flex flex-col items-center gap-3 py-4">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-lg ring-2 ring-primary/20">
                                    <AvatarImage
                                        src={currentAvatar ? (currentAvatar.startsWith('http') || currentAvatar.startsWith('blob:') ? currentAvatar : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${currentAvatar}`) : undefined}
                                        alt={fullName}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                        {watch("last_name")?.substring(0, 2).toUpperCase() || "GV"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-foreground">
                                        {fullName}
                                    </h3>
                                    <Badge
                                        className={cn(
                                            "mt-1 text-xs",
                                            watch("status") === "active"
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-200/50"
                                                : "bg-rose-500/10 text-rose-600 border-rose-200/50"
                                        )}
                                        variant="outline"
                                    >
                                        {watch("status") === "active"
                                            ? "Đang hoạt động"
                                            : "Bị khóa"}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                                        <Info className="h-4 w-4" /> Thông tin cơ bản
                                    </h4>
                                    <div className="space-y-5">
                                        <DetailRow
                                            icon={Mail}
                                            label="Email"
                                            value={watch("email")}
                                        />
                                        <DetailRow
                                            icon={Phone}
                                            label="Số điện thoại"
                                            value={watch("tel")}
                                        />
                                        <DetailRow
                                            icon={MapPin}
                                            label="Địa chỉ"
                                            value={watch("address")}
                                        />
                                        <DetailRow
                                            icon={Globe}
                                            label="Quốc tịch"
                                            value={watch("nationality")}
                                        />
                                        <DetailRow
                                            icon={User}
                                            label="Giới tính"
                                            value={getLabel(genderOptions, watch("gender"))}
                                        />
                                        <DetailRow
                                            icon={Calendar}
                                            label="Ngày sinh"
                                            value={
                                                watch("date_of_birth")
                                                    ? format(
                                                        new Date(watch("date_of_birth")),
                                                        "dd/MM/yyyy"
                                                    )
                                                    : undefined
                                            }
                                        />
                                    </div>
                                </div>

                                <Separator className="opacity-50" />

                                <div className="space-y-6">
                                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" /> Chuyên môn & Giảng dạy
                                    </h4>
                                    <div className="space-y-5">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                                <GraduationCap className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                                    Chuyên môn
                                                </span>
                                                <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                    {watch("expertise") ? (
                                                        watch("expertise")?.split(",").map((exp: string, idx: number) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs font-semibold py-0.5 px-2.5">
                                                                {exp.trim()}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm font-medium text-foreground">—</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <DetailRow
                                            icon={CalendarIcon}
                                            label="Kinh nghiệm"
                                            value={`${watch("experience")} năm`}
                                        />
                                        <DetailRow
                                            icon={Users}
                                            label="Đối tượng học sinh"
                                            value={getLabel(targetStudentOptions, watch("target_student"))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {watch("bio") && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Giới thiệu (Bio)
                                    </h4>
                                    <div className="rounded-xl bg-muted/30 p-4 border text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                        {watch("bio")}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleOpenChange(false)}
                                >
                                    Đóng
                                </Button>
                                <Can permission="teacher_edit">
                                    <Button
                                        onClick={() => setInternalMode("edit")}
                                        className="shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform"
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Chỉnh sửa
                                    </Button>
                                </Can>
                            </div>
                        </div>
                    ) : (
                        /* ──────────── CREATE / EDIT MODE ──────────── */
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            {/* Avatar selector at the top */}
                            <div className="flex flex-col items-center gap-2 py-2">
                                <div
                                    className={cn(
                                        "relative group cursor-pointer",
                                        isDisabled && "cursor-not-allowed opacity-70"
                                    )}
                                    onClick={handleAvatarClick}
                                >
                                    <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-background shadow-lg ring-2 ring-primary/10 transition-all hover:ring-primary/40">
                                        {currentAvatar ? (
                                            <Image
                                                src={currentAvatar.startsWith('http') || currentAvatar.startsWith('blob:') ? currentAvatar : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${currentAvatar}`}
                                                alt="Avatar"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-primary/5 flex items-center justify-center">
                                                <User className="h-12 w-12 text-primary/30" />
                                            </div>
                                        )}
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Click để {currentAvatar ? "đổi" : "tải"} ảnh đại diện
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

                            <div className="flex flex-col gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <Field data-invalid={!!errors.first_name}>
                                        <FieldLabel>
                                            Họ<span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                {...register("first_name")}
                                                placeholder="VD: Nguyễn Văn"
                                                disabled={isDisabled}
                                                className="focus-visible:ring-primary/30"
                                            />
                                        </FieldContent>
                                        <FieldError
                                            errors={[
                                                { message: errors.first_name?.message },
                                            ]}
                                        />
                                    </Field>

                                    {/* Tên */}
                                    <Field data-invalid={!!errors.last_name}>
                                        <FieldLabel>
                                            Tên <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                {...register("last_name")}
                                                placeholder="VD: E"
                                                disabled={isDisabled}
                                                className="focus-visible:ring-primary/30"
                                            />
                                        </FieldContent>
                                        <FieldError
                                            errors={[
                                                { message: errors.last_name?.message },
                                            ]}
                                        />
                                    </Field>
                                </div>

                                {/* Email */}
                                <Field data-invalid={!!errors.email}>
                                    <FieldLabel>
                                        Email <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("email")}
                                            type="email"
                                            placeholder="VD: giaovien@gmail.com"
                                            disabled={isDisabled}
                                            className="focus-visible:ring-primary/30"
                                        />
                                    </FieldContent>
                                    <FieldError
                                        errors={[
                                            { message: errors.email?.message },
                                        ]}
                                    />
                                </Field>

                                {/* Số điện thoại */}
                                <Field data-invalid={!!errors.tel}>
                                    <FieldLabel>
                                        Số điện thoại <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("tel")}
                                            placeholder="VD: 0789123456"
                                            disabled={isDisabled}
                                            className="focus-visible:ring-primary/30"
                                        />
                                    </FieldContent>
                                    <FieldError
                                        errors={[
                                            { message: errors.tel?.message },
                                        ]}
                                    />
                                </Field>

                                {/* Ngày sinh */}
                                <Field data-invalid={!!errors.date_of_birth}>
                                    <FieldLabel>
                                        Ngày sinh <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="date"
                                            {...register("date_of_birth")}
                                            disabled={isDisabled}
                                            className="focus-visible:ring-primary/30"
                                        />
                                    </FieldContent>
                                    <FieldError
                                        errors={[
                                            { message: errors.date_of_birth?.message },
                                        ]}
                                    />
                                </Field>

                                {/* Giới tính */}
                                <Field data-invalid={!!errors.gender}>
                                    <FieldLabel>
                                        Giới tính <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <div className="flex gap-2">
                                            {genderOptions.map((opt) => {
                                                const isSelected = watch("gender") === opt.value
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        disabled={isDisabled}
                                                        onClick={() =>
                                                            setValue("gender", opt.value, { shouldValidate: true })
                                                        }
                                                        className={cn(
                                                            "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all disabled:opacity-50",
                                                            isSelected
                                                                ? opt.activeClass
                                                                : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                                                        )}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </FieldContent>
                                    <FieldError
                                        errors={[
                                            { message: errors.gender?.message },
                                        ]}
                                    />
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Quốc tịch */}
                                    <Field data-invalid={!!errors.nationality}>
                                        <FieldLabel>
                                            Quốc tịch <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                {...register("nationality")}
                                                placeholder="VD: Việt Nam"
                                                disabled={isDisabled}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: errors.nationality?.message }]} />
                                    </Field>

                                    {/* Địa chỉ */}
                                    <Field data-invalid={!!errors.address}>
                                        <FieldLabel>
                                            Địa chỉ <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                {...register("address")}
                                                placeholder="VD: Số nhà, đường..."
                                                disabled={isDisabled}
                                            />
                                        </FieldContent>
                                        <FieldError
                                            errors={[
                                                { message: errors.address?.message },
                                            ]}
                                        />
                                    </Field>
                                </div>

                                {/* Trạng thái */}
                                <Field data-invalid={!!errors.status}>
                                    <FieldLabel>Trạng thái</FieldLabel>
                                    <FieldContent>
                                        <div className="flex gap-2">
                                            {statusOptions.map((opt) => {
                                                const isSelected = watch("status") === opt.value
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        disabled={isDisabled}
                                                        onClick={() => setValue("status", opt.value as "active" | "inactive", { shouldValidate: true })}
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
                                    </FieldContent>
                                </Field>

                                {/* Chuyên môn */}
                                <Field data-invalid={!!errors.specialization}>
                                    <FieldLabel>
                                        Chuyên môn / Môn học giảng dạy <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-muted/20">
                                            {allSubjects.length === 0 ? (
                                                <span className="text-xs text-muted-foreground py-1">Đang tải danh sách môn học...</span>
                                            ) : (
                                                allSubjects.map((sub) => {
                                                    const isSelected = (watch("specialization") || []).includes(sub.id)
                                                    return (
                                                        <Button
                                                            key={sub.id}
                                                            type="button"
                                                            variant="outline"
                                                            disabled={isDisabled}
                                                            onClick={() => {
                                                                const current = watch("specialization") || []
                                                                if (isSelected) {
                                                                    setValue("specialization", current.filter((id: number) => id !== sub.id), { shouldValidate: true })
                                                                } else {
                                                                    setValue("specialization", [...current, sub.id], { shouldValidate: true })
                                                                }
                                                            }}
                                                            className={cn(
                                                                "h-8 px-3 text-xs rounded-full font-medium transition-all",
                                                                isSelected
                                                                    ? "bg-primary border-primary text-primary-foreground hover:bg-primary/95"
                                                                    : "border-input bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                                            )}
                                                        >
                                                            {sub.name}
                                                        </Button>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </FieldContent>
                                    <FieldError errors={[{ message: errors.specialization?.message }]} />
                                </Field>

                                {/* Kinh nghiệm */}
                                <Field data-invalid={!!errors.experience}>
                                    <FieldLabel>
                                        Kinh nghiệm (năm) <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("experience")}
                                            placeholder="VD: 5"
                                            disabled={isDisabled}
                                            className="focus-visible:ring-primary/30"
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: errors.experience?.message }]} />
                                </Field>

                                {/* Đối tượng học sinh */}
                                <Field data-invalid={!!errors.target_student}>
                                    <FieldLabel>
                                        Đối tượng học sinh <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            control={control}
                                            name="target_student"
                                            render={({ field }: { field: any }) => (
                                                <div className="grid grid-cols-3 gap-2">
                                                    {targetStudentOptions.map((opt) => {
                                                        const isSelected = field.value === opt.value
                                                        const Icon = opt.icon
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                disabled={isDisabled}
                                                                onClick={() => field.onChange(opt.value)}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center gap-1 rounded-lg border p-2 text-xs font-medium transition-all",
                                                                    isSelected
                                                                        ? "bg-primary/10 border-primary text-primary"
                                                                        : "border-input bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                                                )}
                                                            >
                                                                <Icon className="h-4 w-4" />
                                                                {opt.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: errors.target_student?.message }]} />
                                </Field>

                                {/* Bio */}
                                <Field data-invalid={!!errors.bio}>
                                    <FieldLabel>Giới thiệu (Bio)</FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            {...register("bio")}
                                            placeholder="Giới thiệu sơ lược về bản thân..."
                                            rows={4}
                                            disabled={isDisabled}
                                            className="resize-none focus-visible:ring-primary/30"
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: errors.bio?.message }]} />
                                </Field>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isDisabled}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isDisabled}
                                    className="min-w-[120px] shadow-md shadow-primary/20"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            {internalMode === "edit" ? "Cập nhật" : "Lưu hồ sơ"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </>
    )
}
