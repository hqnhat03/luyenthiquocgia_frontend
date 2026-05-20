"use client"

import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import { useLayoutStore } from "@/store/layout-store"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    BookOpen,
    CheckIcon,
    ChevronsUpDown,
    ImageIcon,
    Layers,
    LayoutGrid,
    LinkIcon,
    Loader2,
    Plus,
    Save,
    Trash2,
    Upload
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { Controller, Resolver, useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AxiosError } from "axios"
import Image from "next/image"

type LevelType = {
    id: number;
    level: string;
};

type SubjectType = {
    id: number;
    name: string;
};

const courseSchema = z.object({
    name: z.string().min(1, "Tên khóa học không được để trống"),
    description: z.string().min(1, "Mô tả khóa học không được để trống"),
    status: z.enum(["draft", "published", "archived"]),
    target_student: z.enum(["student", "teacher", "all"]),
    price: z.coerce.number().min(0, "Giá bán phải lớn hơn hoặc bằng 0"),
    lesson_count: z.coerce.number().min(1, "Số bài học không được để trống"),
    completion_time: z.coerce.number().min(1, "Thời gian không được để trống"),
    image_url: z.string().min(1, "Vui lòng tải lên hình ảnh khóa học"),
    level_id: z.coerce.number({
        error: "Vui lòng chọn trình độ",
    }),
    subject_id: z.coerce.number({
        error: "Vui lòng chọn môn học",
    }),
    course_materials: z.array(
        z.object({
            id: z.string().optional(),
            name: z.string().optional(),
            link_url: z.string().url("URL không hợp lệ").min(1, "Vui lòng nhập Link URL"),
        })
    ).optional(),
})

type FormValues = z.infer<typeof courseSchema>

export default function EditCoursePage() {
    const params = useParams()
    const router = useRouter()
    const courseId = params.id
    const { hasPermission } = usePermission()

    // Kiểm tra quyền
    React.useEffect(() => {
        if (!hasPermission("course_edit")) {
            toast.error("Bạn không có quyền thực hiện chức năng này")
            router.push("/courses")
        }
    }, [hasPermission, router])


    const [isLoadingInit, setIsLoadingInit] = React.useState(true)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const [levels, setLevels] = React.useState<{ label: string; value: number }[]>([])
    const [subjects, setSubjects] = React.useState<{ label: string; value: number }[]>([])

    // Combobox popover states
    const [openLevel, setOpenLevel] = React.useState(false)
    const [openSubject, setOpenSubject] = React.useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(courseSchema) as unknown as Resolver<FormValues>,
        defaultValues: {
            name: "",
            description: "",
            status: "draft",
            target_student: "student",
            price: 0,
            lesson_count: 0,
            completion_time: 0,
            image_url: "",
            course_materials: []
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "course_materials",
    })

    const selectedSubjectId = form.watch("subject_id");
    const initialSubjectIdRef = React.useRef<number | null>(null);
    const [imageFile, setImageFile] = React.useState<File | null>(null)

    const currentImageUrl = form.watch("image_url")
    React.useEffect(() => {
        return () => {
            if (currentImageUrl && currentImageUrl.startsWith("blob:")) {
                URL.revokeObjectURL(currentImageUrl)
            }
        }
    }, [currentImageUrl])

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoadingInit(true)
            try {
                const [subjectRes, courseRes] = await Promise.all([
                    api.get("/admin/subjects"),
                    api.get(`/admin/courses/form-update`, { params: { id: courseId } })
                ]);

                const subjectsData = subjectRes.data.data || subjectRes.data || [];
                setSubjects(subjectsData.map((item: SubjectType) => ({
                    label: item.name,
                    value: Number(item.id)
                })));

                // Map course data to form
                const cData = courseRes.data.data || courseRes.data;
                if (cData) {
                    const defaultLevelId = Number(cData.subject_level_id || 0);
                    const defaultSubjectId = Number(cData.subject_id || 0);
                    initialSubjectIdRef.current = defaultSubjectId;

                    // Fetch levels dynamically for this subject
                    let levelsData = [];
                    if (defaultSubjectId) {
                        const levelRes = await api.get("/common/levels-by-subject", {
                            params: { subject_id: defaultSubjectId }
                        });
                        levelsData = levelRes.data.data || levelRes.data || [];
                    }

                    setLevels(levelsData.map((item: LevelType) => ({
                        label: item.level,
                        value: Number(item.id)
                    })));

                    // Map status integer to string "draft" | "published" | "archived"
                    let statusStr: "draft" | "published" | "archived" = "draft";
                    if (cData.status === 2) statusStr = "published";
                    else if (cData.status === 1) statusStr = "archived";

                    // Map target_student integer to string "student" | "teacher" | "all"
                    let targetStudentStr: "student" | "teacher" | "all" = "student";
                    if (cData.target_student === 1) targetStudentStr = "teacher";
                    else if (cData.target_student === 2) targetStudentStr = "all";

                    form.reset({
                        name: cData.name || "",
                        description: cData.description || "",
                        status: statusStr,
                        target_student: targetStudentStr,
                        price: Number(cData.price) || 0,
                        lesson_count: Number(cData.total_lessons) || 0,
                        completion_time: Number(cData.total_hours) || 0,
                        image_url: cData.image_url || "",
                        level_id: defaultLevelId,
                        subject_id: defaultSubjectId,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        course_materials: Array.isArray(cData.course_materials) ? cData.course_materials.map((m: any) => ({
                            id: m.id ? String(m.id) : uuidv4(),
                            name: m.title || "",
                            link_url: m.url || ""
                        })) : []
                    })
                }
            } catch (error) {
                console.error("Fetch data failed", error);
                toast.error("Không thể tải dữ liệu khóa học");
                router.push("/courses")
            } finally {
                setIsLoadingInit(false)
            }
        };

        if (courseId) {
            fetchData();
        }
    }, [courseId, form, router]);

    const { setHeaderContent } = useLayoutStore()

    React.useEffect(() => {
        setHeaderContent(
            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Chỉnh sửa khóa học
                </h2>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        type="button"
                        className="h-10 px-4 whitespace-nowrap text-sm font-medium"
                        onClick={() => router.back()}
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        type="submit"
                        form="edit-course-form"
                        className="h-10 px-6 bg-primary hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap gap-2 shadow-md shadow-primary/20"
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
                                <span className="text-sm font-bold">Cập nhật</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        )
        return () => {
            setHeaderContent(null)
        }
    }, [setHeaderContent, isSubmitting, router])

    // Fetch levels when selectedSubjectId changes
    React.useEffect(() => {
        if (isLoadingInit) return;

        const handleSubjectChange = async () => {
            if (!selectedSubjectId) {
                setLevels([]);
                form.setValue("level_id", undefined as any);
                return;
            }

            try {
                const levelRes = await api.get("/common/levels-by-subject", {
                    params: { subject_id: selectedSubjectId }
                });
                const levelsData = levelRes.data.data || levelRes.data || [];
                setLevels(levelsData.map((item: LevelType) => ({
                    label: item.level,
                    value: Number(item.id)
                })));

                // If user changed the subject to something else, clear the selected level
                if (selectedSubjectId !== initialSubjectIdRef.current) {
                    form.setValue("level_id", undefined as any);
                }
            } catch (error) {
                console.error("Fetch levels failed", error);
                toast.error("Không thể tải danh sách trình độ");
            }
        };

        handleSubjectChange();
    }, [selectedSubjectId, isLoadingInit, form]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImageFile(file)
        const localUrl = URL.createObjectURL(file)
        form.setValue("image_url", localUrl, { shouldValidate: true })
    }

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("id", String(courseId))
            formData.append("subject_level_id", String(data.level_id))
            formData.append("name", data.name)
            formData.append("title", data.name) // Set title same as name to satisfy backend validation
            if (data.description) {
                formData.append("description", data.description)
            }
            formData.append("total_lessons", String(data.lesson_count))
            formData.append("total_hours", String(data.completion_time))
            formData.append("price", String(data.price))

            // Map target_student string back to integer
            let targetStudentVal = 0; // student
            if (data.target_student === "teacher") {
                targetStudentVal = 1; // employee
            } else if (data.target_student === "all") {
                targetStudentVal = 2; // both
            }
            formData.append("target_student", String(targetStudentVal))

            // Map status string back to integer
            let statusVal = 0; // draft
            if (data.status === "archived") {
                statusVal = 1;
            } else if (data.status === "published") {
                statusVal = 2;
            }
            formData.append("status", String(statusVal))

            // Append image file if present, else send empty string if deleted, or don't append if unchanged
            if (imageFile) {
                formData.append("image_url", imageFile)
            } else if (!data.image_url) {
                formData.append("image_url", "")
            }

            // Append course materials array
            const materials = data.course_materials
                ?.filter(m => m.link_url && m.link_url.trim() !== "") || []
            materials.forEach((m, index) => {
                formData.append(`course_materials[${index}][url]`, m.link_url)
                formData.append(`course_materials[${index}][title]`, m.name || "")
                formData.append(`course_materials[${index}][type]`, "link")
                formData.append(`course_materials[${index}][is_public]`, "1")
                
                const parsedId = Number(m.id);
                if (!isNaN(parsedId) && parsedId > 0) {
                    formData.append(`course_materials[${index}][id]`, String(parsedId))
                }
            })

            await api.post("/admin/courses/update", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })

            toast.success("Cập nhật khóa học thành công!")
            router.push("/courses")
            router.refresh()
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                console.error(err.response?.data?.message)
                toast.error(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật khóa học")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoadingInit) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                        <div>
                            <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
                            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[400px] bg-muted animate-pulse rounded-lg" />
                    <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
            <form id="edit-course-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cột chính: Thông tin cơ bản */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    Thông tin chung
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Field data-invalid={!!form.formState.errors.name}>
                                    <FieldLabel>Tên khóa học <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <Input
                                            placeholder="VD: Khóa học Laravel từ cơ bản đến nâng cao"
                                            className="bg-background/50"
                                            {...form.register("name")}
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: form.formState.errors.name?.message }]} />
                                </Field>

                                <Field data-invalid={!!form.formState.errors.description}>
                                    <FieldLabel>Mô tả <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            placeholder="Nhập nội dung mô tả khóa học..."
                                            className="min-h-[160px] bg-background/50"
                                            {...form.register("description")}
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: form.formState.errors.description?.message }]} />
                                </Field>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field data-invalid={!!form.formState.errors.subject_id}>
                                        <FieldLabel>Môn học <span className="text-destructive">*</span></FieldLabel>
                                        <FieldContent>
                                            <Controller
                                                control={form.control}
                                                name="subject_id"
                                                render={({ field }) => (
                                                    <Popover open={openSubject} onOpenChange={setOpenSubject}>
                                                        <PopoverTrigger render={
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={openSubject}
                                                                className={cn(
                                                                    "w-full justify-between font-normal bg-background/50",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? subjects.find((s) => s.value === field.value)?.label
                                                                    : "Chọn môn học"}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        }>

                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Tìm kiếm môn học..." />
                                                                <CommandList>
                                                                    <CommandEmpty>Không tìm thấy môn học.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {subjects.map((subject) => (
                                                                            <CommandItem
                                                                                key={subject.value}
                                                                                value={subject.label}
                                                                                onSelect={() => {
                                                                                    field.onChange(subject.value)
                                                                                    setOpenSubject(false)
                                                                                }}
                                                                            >
                                                                                <CheckIcon
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        field.value === subject.value ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {subject.label}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: form.formState.errors.subject_id?.message }]} />
                                    </Field>

                                    <Field data-invalid={!!form.formState.errors.level_id}>
                                        <FieldLabel>Trình độ <span className="text-destructive">*</span></FieldLabel>
                                        <FieldContent>
                                            <Controller
                                                control={form.control}
                                                name="level_id"
                                                render={({ field }) => (
                                                    <Popover open={openLevel} onOpenChange={setOpenLevel}>
                                                        <PopoverTrigger render={
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={openLevel}
                                                                disabled={!selectedSubjectId}
                                                                className={cn(
                                                                    "w-full justify-between font-normal bg-background/50",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                                title={!selectedSubjectId ? "Vui lòng chọn môn học trước" : ""}
                                                            >
                                                                {field.value
                                                                    ? levels.find((l) => l.value === field.value)?.label
                                                                    : !selectedSubjectId ? "Vui lòng chọn môn học trước" : "Chọn trình độ"}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        }>

                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Tìm kiếm trình độ..." />
                                                                <CommandList>
                                                                    <CommandEmpty>Không tìm thấy trình độ.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {levels.map((level) => (
                                                                            <CommandItem
                                                                                key={level.value}
                                                                                value={level.label}
                                                                                onSelect={() => {
                                                                                    field.onChange(level.value)
                                                                                    setOpenLevel(false)
                                                                                }}
                                                                            >
                                                                                <CheckIcon
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        field.value === level.value ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {level.label}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: form.formState.errors.level_id?.message }]} />
                                    </Field>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tài liệu khóa học (Dynamic List) */}
                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-primary" />
                                        Tài liệu khóa học
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ id: uuidv4(), link_url: "" })}
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" /> Thêm tài liệu
                                    </Button>
                                </CardTitle>
                                <CardDescription>Các tài liệu tham khảo cho toàn bộ khóa học</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {fields.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/20">
                                        Chưa có tài liệu nào. Bấm Thêm tài liệu đểbắt đầu.
                                    </div>
                                ) : (
                                    fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-4 items-start bg-accent/30 p-3 rounded-lg border border-accent">
                                            <div className="flex-1">
                                                <Field>
                                                    <FieldContent>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <Input
                                                                placeholder="https://example.com/tai-lieu.zip"
                                                                className="pl-10 bg-background"
                                                                {...form.register(`course_materials.${index}.link_url` as const)}
                                                            />
                                                        </div>
                                                    </FieldContent>
                                                    {form.formState.errors.course_materials?.[index]?.link_url && (
                                                        <p className="text-[0.8rem] font-medium text-destructive mt-1">
                                                            {form.formState.errors.course_materials[index]?.link_url?.message}
                                                        </p>
                                                    )}
                                                </Field>
                                                {/* Hidden input for ID logic if needed */}
                                                <input type="hidden" {...form.register(`course_materials.${index}.id` as const)} value={field.id} />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="shrink-0"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cột bên phải: Thuộc tính bổ sung */}
                    <div className="space-y-6">
                        {/* Hình ảnh khóa học - Đưa lên trên */}
                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5 text-primary" />
                                    Hình ảnh khóa học
                                </CardTitle>
                                <CardDescription>Tải lên hình ảnh đại diện cho khóa học</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Controller
                                    control={form.control}
                                    name="image_url"
                                    render={({ field }) => (
                                        <Field data-invalid={!!form.formState.errors.image_url}>
                                            <FieldContent>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                />

                                                <div
                                                    className={cn(
                                                        "relative group cursor-pointer rounded-xl overflow-hidden border-2 border-dashed transition-all duration-300",
                                                        "hover:border-primary/50 hover:bg-primary/5",
                                                        field.value ? "border-primary/20" : "border-muted-foreground/20 py-12",
                                                        form.formState.errors.image_url && "border-destructive/50"
                                                    )}
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    {field.value ? (
                                                        <div className="relative aspect-[3/4] w-full max-w-[240px] mx-auto">
                                                            <Image
                                                                src={field.value.startsWith('http') || field.value.startsWith('blob:') ? field.value : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${field.value}`}
                                                                alt="Preview"
                                                                width={300}
                                                                height={400}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                                                                <Upload className="h-8 w-8" />
                                                                <span className="text-sm font-medium">Thay đổi hình ảnh</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground px-6 text-center">
                                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                                                                <Upload className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground">Click để tải ảnh lên</p>
                                                                <p className="text-xs mt-1">PNG, JPG hoặc WebP (Max 2MB)</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {field.value && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 mt-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            field.onChange("");
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Xóa ảnh
                                                    </Button>
                                                )}
                                            </FieldContent>
                                            <FieldError errors={[{ message: form.formState.errors.image_url?.message }]} />
                                        </Field>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Cài đặt thuộc tính */}
                        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <LayoutGrid className="h-5 w-5 text-primary" />
                                    Cài đặt thuộc tính
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Field data-invalid={!!form.formState.errors.status}>
                                    <FieldLabel>Trạng thái <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-9 px-2 text-xs md:text-sm font-medium transition-all bg-transparent",
                                                            field.value === "draft"
                                                                ? "border-slate-500 text-slate-700 dark:text-slate-300 ring-1 ring-slate-500 bg-slate-50 dark:bg-slate-900/50"
                                                                : "border-input text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                                                        )}
                                                        onClick={() => field.onChange("draft")}
                                                    >
                                                        Bản nháp
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-9 px-2 text-xs md:text-sm font-medium transition-all bg-transparent",
                                                            field.value === "published"
                                                                ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                                                                : "border-input text-muted-foreground hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
                                                        )}
                                                        onClick={() => field.onChange("published")}
                                                    >
                                                        Xuất bản
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-9 px-2 text-xs md:text-sm font-medium transition-all bg-transparent",
                                                            field.value === "archived"
                                                                ? "border-rose-500 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500 bg-rose-50 dark:bg-rose-950/30"
                                                                : "border-input text-muted-foreground hover:bg-rose-50/50 dark:hover:bg-rose-950/30"
                                                        )}
                                                        onClick={() => field.onChange("archived")}
                                                    >
                                                        Lưu trữ
                                                    </Button>
                                                </div>
                                            )}
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: form.formState.errors.status?.message }]} />
                                </Field>

                                <Field data-invalid={!!form.formState.errors.target_student}>
                                    <FieldLabel>Đối tượng <span className="text-destructive">*</span></FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            control={form.control}
                                            name="target_student"
                                            render={({ field }) => (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-9 text-sm font-medium transition-all bg-transparent",
                                                            field.value === "student"
                                                                ? "border-primary text-primary ring-1 ring-primary bg-primary/5"
                                                                : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                        )}
                                                        onClick={() => field.onChange("student")}
                                                    >
                                                        Học sinh
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-9 text-sm font-medium transition-all bg-transparent",
                                                            field.value === "teacher"
                                                                ? "border-primary text-primary ring-1 ring-primary bg-primary/5"
                                                                : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                        )}
                                                        onClick={() => field.onChange("teacher")}
                                                    >
                                                        Nhân viên
                                                    </Button>
                                                </div>
                                            )}
                                        />
                                    </FieldContent>
                                    <FieldError errors={[{ message: form.formState.errors.target_student?.message }]} />
                                </Field>

                                <div>
                                    <Field data-invalid={!!form.formState.errors.price}>
                                        <FieldLabel>Giá bán (VNĐ) <span className="text-destructive">*</span></FieldLabel>
                                        <FieldContent>
                                            <Controller
                                                control={form.control}
                                                name="price"
                                                render={({ field }) => (
                                                    <Input
                                                        type="number"
                                                        placeholder="1990000"
                                                        className="bg-background/50"
                                                        value={field.value}
                                                        onChange={(e) => { field.onChange(Number(e.target.value)) }}
                                                    />
                                                )}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: form.formState.errors.price?.message }]} />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field data-invalid={!!form.formState.errors.lesson_count}>
                                        <FieldLabel>Số bài học <span className="text-destructive">*</span></FieldLabel>
                                        <FieldContent>
                                            <Controller
                                                control={form.control}
                                                name="lesson_count"
                                                render={({ field }) => (
                                                    <Input
                                                        type="number"
                                                        placeholder="VD: 24"
                                                        className="bg-background/50"
                                                        value={field.value}
                                                        onChange={(e) => { field.onChange(Number(e.target.value)) }}
                                                    />
                                                )}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: form.formState.errors.lesson_count?.message }]} />
                                    </Field>

                                    <Field data-invalid={!!form.formState.errors.completion_time}>
                                        <FieldLabel>Thời gian (Giờ) <span className="text-destructive">*</span></FieldLabel>
                                        <FieldContent>
                                            <Controller
                                                control={form.control}
                                                name="completion_time"
                                                render={({ field }) => (
                                                    <Input
                                                        type="number"
                                                        placeholder="VD: 60"
                                                        className="bg-background/50"
                                                        value={field.value}
                                                        onChange={(e) => { field.onChange(Number(e.target.value)) }}
                                                    />
                                                )}
                                            />
                                        </FieldContent>
                                        <FieldError errors={[{ message: form.formState.errors.completion_time?.message }]} />
                                    </Field>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    )
}
