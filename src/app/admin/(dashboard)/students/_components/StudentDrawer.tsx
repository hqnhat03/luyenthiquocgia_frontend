"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid } from "date-fns"
import {
    Briefcase,
    Calendar,
    Edit,
    GraduationCap,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    School,
    ShieldCheck,
    Trophy,
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
import { AxiosError } from "axios"
import { AddCourseModal } from "./AddCourseModal"

import { Student, mapBackendStudentToFrontend } from "@/types/StudentType"


// ─────────────────────────── Schema ───────────────────────────

const studentSchema = z.object({
    first_name: z.string().min(1, "Tên không được để trống"),
    last_name: z.string().min(1, "Họ không được để trống"),
    email: z.email("Email không hợp lệ"),
    phone: z.string().min(10, "Số điện thoại không hợp lệ"),
    address: z.string().min(1, "Địa chỉ không được để trống"),
    gender: z.enum(["male", "female", "other"]),
    status: z.enum(["active", "inactive"]),
    date_of_birth: z.string().min(1, { message: "Vui lòng chọn ngày sinh" }),
    avatar: z.string().optional().nullable(),
    student_type: z.enum(["student", "employee"]),
    school: z.string().optional(),
    grade: z.string().optional(),
    work: z.string().optional(),
    position: z.string().optional(),
})

type StudentFormValues = z.infer<typeof studentSchema>

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
    {
        value: "other",
        label: "Khác",
        activeClass:
            "bg-gray-500/10 border-gray-500/50 text-gray-600 dark:bg-gray-950 dark:border-gray-500 dark:text-gray-300",
    },
]

const studentTypeOptions = [
    { value: "student", label: "Học sinh", icon: GraduationCap },
    { value: "employee", label: "Nhân viên", icon: Briefcase },
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

function getGenderLabel(g?: string) {
    return genderOptions.find((o) => o.value === g)?.label ?? g ?? "—"
}

// ─────────────────────────── Props ───────────────────────────

type DrawerMode = "create" | "edit" | "view"

interface StudentDrawerProps {
    mode?: DrawerMode
    studentId?: number | string | null
    onSuccess?: (data?: Student) => void
    onClose?: () => void
    trigger?: React.ReactNode
}

// ─────────────────────────── Component ───────────────────────────

export function StudentDrawer({
    mode: externalMode,
    studentId,
    onSuccess,
    onClose,
    trigger,
}: StudentDrawerProps) {
    const [internalMode, setInternalMode] = useState<DrawerMode | undefined>(
        externalMode
    )
    const open = !!internalMode
    const [isAddCourseOpen, setIsAddCourseOpen] = useState(false)

    useEffect(() => {
        setInternalMode(externalMode)
    }, [externalMode])

    const handleOpenChange = (val: boolean) => {
        if (!val) {
            setInternalMode(undefined)
            onClose?.()
        }
    }

    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            address: "",
            gender: "male",
            status: "active",
            date_of_birth: "",
            student_type: "student",
            avatar: "",
            school: "",
            grade: "",
            work: "",
            position: "",
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

    const currentAvatar = watch("avatar")
    const studentType = watch("student_type")

    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
    const displayAvatar = previewAvatar || (
        typeof currentAvatar === "string" && currentAvatar
            ? (currentAvatar.startsWith("http") || currentAvatar.startsWith("data:")
                ? currentAvatar
                : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${currentAvatar}`)
            : null
    )

    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [isFetching, setIsFetching] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const fetchedStudentIdRef = React.useRef<string | number | null>(null)

    useEffect(() => {
        setAvatarFile(null)
        setPreviewAvatar(null)
        if (!open) {
            fetchedStudentIdRef.current = null
            return
        }

        if ((internalMode === "edit" || internalMode === "view") && studentId) {
            if (fetchedStudentIdRef.current === studentId) return

            setIsFetching(true)
            api.get(`/admin/students/detail`, { params: { id: studentId } })
                .then((res) => {
                    const data = res.data?.data || res.data
                    const mapped = mapBackendStudentToFrontend(data)
                    reset({
                        first_name: mapped.first_name || "",
                        last_name: mapped.last_name || "",
                        email: mapped.email || "",
                        phone: mapped.phone || "",
                        address: mapped.address || "",
                        gender: mapped.gender || "male",
                        status: mapped.status || "active",
                        date_of_birth: mapped.date_of_birth || "",
                        avatar: mapped.avatar || "",
                        student_type: mapped.student_type || "student",
                        school: mapped.school || "",
                        grade: mapped.grade || "",
                        work: mapped.work || "",
                        position: mapped.position || "",
                    })
                    fetchedStudentIdRef.current = studentId
                })
                .catch((err) => {
                    toast.error(
                        err.response?.data?.message ||
                        "Không thể tải thông tin học sinh"
                    )
                    handleOpenChange(false)
                })
                .finally(() => setIsFetching(false))
        } else {
            if (fetchedStudentIdRef.current === "create") return

            reset({
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                address: "",
                gender: "male",
                status: "active",
                student_type: "student",
                avatar: "",
                date_of_birth: "",
                school: "",
                grade: "",
                work: "",
                position: "",
            })
            fetchedStudentIdRef.current = "create"
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, internalMode, studentId])

    const onSubmit = async (data: StudentFormValues) => {
        setIsSubmitting(true)
        try {
            const dayOfBirth = data.date_of_birth

            const formData = new FormData()
            formData.append("first_name", data.first_name)
            formData.append("last_name", data.last_name)
            formData.append("email", data.email)
            formData.append("tel", data.phone)
            formData.append("address", data.address)
            formData.append("gender", data.gender === "female" ? "0" : "1")
            formData.append("birth_date", dayOfBirth)
            formData.append("status", data.status === "active" ? "1" : "0")
            formData.append("type", data.student_type === "employee" ? "2" : "1")

            if (data.student_type === "student") {
                if (data.school) formData.append("school_name", data.school)
                const gradeLevel = data.grade ? parseInt(data.grade, 10) : null
                if (gradeLevel !== null && !isNaN(gradeLevel)) {
                    formData.append("grade_level", gradeLevel.toString())
                }
            } else {
                if (data.work) formData.append("company_name", data.work)
                if (data.position) formData.append("position", data.position)
            }

            if (avatarFile) {
                formData.append("avatar_url", avatarFile)
            } else if (data.avatar === null || data.avatar === "") {
                formData.append("avatar_url", "")
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const checkResponseError = (resData: any, defaultMsg: string) => {
                if (resData?.success === false || resData?.status === "error") {
                    if (resData.code === 422 || (resData.message && typeof resData.message === "object")) {
                        const validationErrors = resData.message || resData.errors || {}
                        Object.entries(validationErrors).forEach(([key, val]) => {
                            let fieldName = key
                            if (key === "tel") fieldName = "phone"
                            if (key === "birth_date") fieldName = "date_of_birth"
                            if (key === "type") fieldName = "student_type"
                            if (key === "school_name") fieldName = "school"
                            if (key === "grade_level") fieldName = "grade"
                            if (key === "company_name") fieldName = "work"

                            const errMsg = Array.isArray(val)
                                ? val[0]
                                : (typeof val === "string" ? val : "Trường thông tin không hợp lệ")

                            form.setError(fieldName as keyof StudentFormValues, {
                                message: errMsg,
                            })
                        })
                        throw new Error("Thông tin nhập vào không hợp lệ. Vui lòng kiểm tra lại.")
                    }
                    const errMsg = typeof resData.message === "string" ? resData.message : defaultMsg
                    throw new Error(errMsg)
                }
            }

            if (internalMode === "edit" && studentId) {
                formData.append("id", studentId.toString())
                const res = await api.post(`/admin/students/update`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
                checkResponseError(res.data, "Lỗi khi cập nhật")
                toast.success("Cập nhật học sinh thành công!")
                setInternalMode("view")
                onSuccess?.()
            } else {
                const res = await api.post("/admin/students/create", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
                checkResponseError(res.data, "Lỗi khi tạo")
                toast.success("Thêm học sinh thành công!")
                handleOpenChange(false)
                onSuccess?.()
            }
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                const resData = err.response?.data
                const msg = resData?.message
                toast.error(typeof msg === "string" ? msg : "Thông tin nhập vào không hợp lệ. Vui lòng kiểm tra lại.")

                const validationErrors = resData?.errors || (typeof msg === "object" ? msg : null)
                if (validationErrors) {
                    Object.entries(validationErrors).forEach(([key, val]) => {
                        let fieldName = key
                        if (key === "tel") fieldName = "phone"
                        if (key === "birth_date") fieldName = "date_of_birth"
                        if (key === "type") fieldName = "student_type"
                        if (key === "school_name") fieldName = "school"
                        if (key === "grade_level") fieldName = "grade"
                        if (key === "company_name") fieldName = "work"

                        const errMsg = Array.isArray(val)
                            ? val[0]
                            : (typeof val === "string" ? val : "Trường thông tin không hợp lệ")

                        form.setError(fieldName as keyof StudentFormValues, { message: errMsg })
                    })
                }
            } else if (err instanceof Error) {
                toast.error(err.message)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAvatarClick = () => {
        if (isDisabled || isView) return
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setAvatarFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64Url = reader.result as string
            setPreviewAvatar(base64Url)
            form.setValue("avatar", base64Url, { shouldValidate: true })
        }
        reader.readAsDataURL(file)
    }

    const modeConfig: Record<DrawerMode, { title: string; description: string }> = {
        create: {
            title: "Thêm học sinh mới",
            description: "Điền đầy đủ thông tin để tạo hồ sơ học sinh mới.",
        },
        edit: {
            title: "Chỉnh sửa học sinh",
            description: "Cập nhật thông tin chi tiết của học sinh.",
        },
        view: {
            title: "Chi tiết học sinh",
            description: "Xem toàn bộ thông tin cá nhân và học tập.",
        },
    }

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

    const triggerEl = trigger ? (
        <span onClick={() => setInternalMode(externalMode ?? "create")} style={{ display: "contents" }}>
            {trigger}
        </span>
    ) : null

    return (
        <>
            {triggerEl}
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto overflow-x-hidden px-6 pb-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <GraduationCap className="h-4 w-4" />
                            </div>
                            {internalMode ? modeConfig[internalMode].title : "Học sinh"}
                        </SheetTitle>
                        <SheetDescription>
                            {internalMode ? modeConfig[internalMode].description : ""}
                        </SheetDescription>
                    </SheetHeader>

                    {isFetching ? (
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : isView ? (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center gap-3">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-lg ring-2 ring-primary/20">
                                    <AvatarImage
                                        src={displayAvatar || undefined}
                                        alt={`${watch("last_name") || ""} ${watch("first_name") || ""}`.trim()}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                        {watch("first_name")?.substring(0, 2).toUpperCase() || "HS"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-foreground">{`${watch("last_name") || ""} ${watch("first_name") || ""}`.trim()}</h3>
                                    <div className="flex items-center justify-center gap-2 mt-1">
                                        <Badge variant="secondary" className="capitalize">
                                            {studentType === "student" ? "Học sinh" : "Nhân viên"}
                                        </Badge>
                                        <Badge
                                            className={cn(
                                                "text-xs",
                                                watch("status") === "active"
                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-200/50"
                                                    : "bg-rose-500/10 text-rose-600 border-rose-200/50"
                                            )}
                                            variant="outline"
                                        >
                                            {watch("status") === "active" ? "Đang hoạt động" : "Bị khóa"}
                                        </Badge>
                                    </div>
                                    <Can permission="student_in_course_create">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsAddCourseOpen(true)}
                                            className="mt-4"
                                        >
                                            <GraduationCap className="mr-2 h-4 w-4" />
                                            Thêm vào khóa học
                                        </Button>
                                    </Can>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 gap-4">
                                <DetailRow icon={Mail} label="Email" value={watch("email")} />
                                <DetailRow icon={Phone} label="Số điện thoại" value={watch("phone")} />
                                <DetailRow icon={MapPin} label="Địa chỉ" value={watch("address")} />
                                <DetailRow icon={User} label="Giới tính" value={getGenderLabel(watch("gender"))} />
                                <DetailRow
                                    icon={Calendar}
                                    label="Ngày sinh"
                                    value={(() => {
                                        const dob = watch("date_of_birth");
                                        if (!dob) return "—";
                                        const d = new Date(typeof dob === "string" ? dob.replace(/-/g, "/") : dob);
                                        return isValid(d) ? format(d, "dd/MM/yyyy") : "—";
                                    })()}
                                />
                                <DetailRow
                                    icon={ShieldCheck}
                                    label="Trạng thái"
                                    value={watch("status") === "active" ? "Hoạt động" : "Bị khóa"}
                                />

                                {studentType === "student" && (
                                    <>
                                        <DetailRow icon={School} label="Trường học" value={watch("school")} />
                                        <DetailRow icon={Trophy} label="Lớp/Khối" value={watch("grade")} />
                                    </>
                                )}

                                {studentType === "employee" && (
                                    <>
                                        <DetailRow icon={Briefcase} label="Nơi làm việc" value={watch("work")} />
                                        <DetailRow icon={User} label="Chức vụ" value={watch("position")} />
                                    </>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                <Button variant="ghost" onClick={() => handleOpenChange(false)}>Đóng</Button>
                                <Can permission="student_edit">
                                    <Button onClick={() => setInternalMode("edit")} className="shadow-md shadow-primary/20">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Chỉnh sửa
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

                                    </Avatar>
                                    {!isDisabled && (
                                        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center shadow-md">
                                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Click để {displayAvatar ? "đổi" : "tải"} ảnh đại diện
                                </p>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <Field data-invalid={!!errors.last_name}>
                                    <FieldLabel>Họ <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <Input {...register("last_name")} placeholder="VD: Nguyễn" disabled={isDisabled} />
                                    </FieldContent>
                                    <FieldError errors={[{ message: errors.last_name?.message }]} />
                                </Field>

                                <Field data-invalid={!!errors.first_name}>
                                    <FieldLabel>Tên <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <Input {...register("first_name")} placeholder="VD: Văn A" disabled={isDisabled} />
                                    </FieldContent>
                                    <FieldError errors={[{ message: errors.first_name?.message }]} />
                                </Field>
                            </div>

                            {/* Email */}
                            <Field data-invalid={!!errors.email}>
                                <FieldLabel>Email <span className="text-destructive">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register("email")} type="email" placeholder="example@gmail.com" disabled={isDisabled} />
                                </FieldContent>
                                <FieldError errors={[{ message: errors.email?.message }]} />
                            </Field>

                            {/* Số điện thoại */}
                            <Field data-invalid={!!errors.phone}>
                                <FieldLabel>Số điện thoại <span className="text-destructive">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register("phone")} placeholder="0905xxxxxx" disabled={isDisabled} />
                                </FieldContent>
                                <FieldError errors={[{ message: errors.phone?.message }]} />
                            </Field>

                            <Field data-invalid={!!errors.address}>
                                <FieldLabel>Địa chỉ <span className="text-destructive">*</span></FieldLabel>
                                <FieldContent>
                                    <Input {...register("address")} placeholder="VD: 123 Nguyễn Tất Thành, Đà Nẵng" disabled={isDisabled} />
                                </FieldContent>
                                <FieldError errors={[{ message: errors.address?.message }]} />
                            </Field>

                            {/* Ngày sinh */}
                            <Field data-invalid={!!errors.date_of_birth}>
                                <FieldLabel>Ngày sinh <span className="text-destructive">*</span></FieldLabel>
                                <FieldContent>
                                    <Input
                                        type="date"
                                        {...register("date_of_birth")}
                                        disabled={isDisabled}
                                        className="block w-full"
                                    />
                                </FieldContent>
                                <FieldError errors={[{ message: errors.date_of_birth?.message }]} />
                            </Field>

                            {/* Giới tính */}
                            <Field data-invalid={!!errors.gender}>
                                <FieldLabel>Giới tính <span className="text-destructive">*</span></FieldLabel>
                                <FieldContent>
                                    <div className="flex gap-2">
                                        {genderOptions.map((opt) => {
                                            const isSelected = watch("gender") === opt.value
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() => setValue("gender", opt.value as "male" | "female" | "other", { shouldValidate: true })}
                                                    className={cn(
                                                        "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
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
                                <FieldError errors={[{ message: errors.gender?.message }]} />
                            </Field>

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

                            <Field data-invalid={!!errors.student_type}>
                                <FieldLabel>Loại học sinh <span className="text-destructive">*</span></FieldLabel>
                                <FieldContent>
                                    <div className="flex gap-2">
                                        {studentTypeOptions.map((opt) => {
                                            const isSelected = studentType === opt.value
                                            const Icon = opt.icon
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() => setValue("student_type", opt.value as "student" | "employee", { shouldValidate: true })}
                                                    className={cn(
                                                        "flex-1 flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 transition-all",
                                                        isSelected
                                                            ? "bg-primary/10 border-primary text-primary"
                                                            : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                                                    )}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    <span className="text-xs font-semibold">{opt.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </FieldContent>
                                <FieldError errors={[{ message: errors.student_type?.message }]} />
                            </Field>

                            {studentType === "student" ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel>Trường học</FieldLabel>
                                        <Input {...register("school")} placeholder="VD: THPT Phan Châu Trinh" />
                                    </Field>
                                    <Field>
                                        <FieldLabel>Lớp/Khối</FieldLabel>
                                        <Input {...register("grade")} placeholder="VD: 12A1" />
                                    </Field>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel>Nơi làm việc</FieldLabel>
                                        <Input {...register("work")} placeholder="VD: Công ty ABC" />
                                    </Field>
                                    <Field>
                                        <FieldLabel>Chức vụ</FieldLabel>
                                        <Input {...register("position")} placeholder="VD: Nhân viên" />
                                    </Field>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <Button variant="ghost" type="button" onClick={() => handleOpenChange(false)}>Hủy</Button>
                                <Button type="submit" disabled={isDisabled} className="min-w-[120px] shadow-lg shadow-primary/20">
                                    {isSubmitting ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...</>
                                    ) : (
                                        <><Save className="mr-2 h-4 w-4" /> {internalMode === "edit" ? "Cập nhật" : "Lưu hồ sơ"}</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            <AddCourseModal
                open={isAddCourseOpen}
                onOpenChange={setIsAddCourseOpen}
                studentId={studentId ?? null}
                studentName={`${watch("last_name") || ""} ${watch("first_name") || ""}`.trim()}
                onSuccess={() => {
                    // Cùng có thể reload data ở đây nếu cần hiển thị danh sách khóa học của student
                }}
            />
        </>
    )
}
