"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { AxiosError } from "axios"
import {
    BookMarked,
    BookOpen,
    Layers,
    Loader2,
    Save,
    SlidersHorizontal
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

interface AddCourseModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    studentId: number | string | null
    studentName?: string
    onSuccess?: () => void
}

interface FilterOption {
    id: number | string
    name: string
}

interface Course {
    id: number
    name: string
    subject_name?: string
    level_name?: string
}

export function AddCourseModal({
    open,
    onOpenChange,
    studentId,
    onSuccess,
}: AddCourseModalProps) {
    const [subjects, setSubjects] = React.useState<FilterOption[]>([])
    const [levels, setLevels] = React.useState<FilterOption[]>([])
    const [courses, setCourses] = React.useState<Course[]>([])

    const [selectedSubject, setSelectedSubject] = React.useState<string>("")
    const [selectedLevel, setSelectedLevel] = React.useState<string>("")
    const [selectedCourse, setSelectedCourse] = React.useState<string>("")

    const [isLoadingSubjects, setIsLoadingSubjects] = React.useState(false)
    const [isLoadingLevels, setIsLoadingLevels] = React.useState(false)
    const [isLoadingCourses, setIsLoadingCourses] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Reset state and fetch initial subjects when modal opens
    React.useEffect(() => {
        if (open) {
            setSelectedSubject("")
            setSelectedLevel("")
            setSelectedCourse("")
            setLevels([])
            setCourses([])
            fetchSubjects()
        }
    }, [open])

    // Fetch initial list of subjects
    const fetchSubjects = async () => {
        setIsLoadingSubjects(true)
        try {
            const res = await api.get("/common/subjects")
            const subjectsData = res.data?.data || []
            setSubjects(subjectsData)
        } catch (error) {
            console.error("Failed to fetch subjects:", error)
            toast.error("Không thể tải danh sách môn học")
        } finally {
            setIsLoadingSubjects(false)
        }
    }

    // Step 2: Fetch levels dynamically when subject selection changes
    React.useEffect(() => {
        if (!open) return
        
        // Reset level and course selections synchronously when subject changes
        setSelectedLevel("")
        setCourses([])
        setSelectedCourse("")
        setLevels([])

        if (!selectedSubject) return

        const fetchLevelsForSubject = async () => {
            setIsLoadingLevels(true)
            try {
                const res = await api.get(`/common/levels-by-subject`, {
                    params: { subject_id: selectedSubject }
                })
                
                const levelsData = Array.isArray(res.data?.data) 
                    ? res.data.data 
                    : Array.isArray(res.data) 
                        ? res.data 
                        : []

                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setLevels(levelsData.map((l: any) => ({
                    id: l.id,
                    name: l.level || l.name || ""
                })))
            } catch (error) {
                console.error("Failed to fetch levels:", error)
                toast.error("Không thể tải danh sách trình độ môn học")
            } finally {
                setIsLoadingLevels(false)
            }
        }

        fetchLevelsForSubject()
    }, [selectedSubject, open])

    // Step 3: Fetch courses dynamically when subject level selection changes
    React.useEffect(() => {
        if (!open) return
        if (!selectedSubject || !selectedLevel) {
            setCourses([])
            setSelectedCourse("")
            return
        }

        const fetchCourses = async () => {
            setIsLoadingCourses(true)
            try {
                const res = await api.get(`/common/courses-by-level`, {
                    params: { subject_level_id: selectedLevel }
                })
                
                const coursesList = res.data?.data || []
                
                setCourses(coursesList)
                setSelectedCourse("") // Reset course selection
            } catch (error) {
                console.error("Failed to fetch courses:", error)
                toast.error("Không thể tải danh sách khóa học")
            } finally {
                setIsLoadingCourses(false)
            }
        }

        fetchCourses()
    }, [selectedSubject, selectedLevel, open])

    const handleAdd = async () => {
        if (!studentId || !selectedCourse) {
            toast.error("Vui lòng chọn khóa học")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await api.post(`/admin/students/add-student-to-course`, {
                student_id: Number(studentId),
                course_id: Number(selectedCourse),
            })

            if (res.data?.status === "success" || res.data?.success) {
                toast.success(res.data?.message || "Thêm học sinh vào khóa học thành công!")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(res.data?.message || "Không thể thêm vào khóa học")
            }
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.message || "Đã có lỗi xảy ra")
            } else {
                toast.error("Đăng ký khóa học thất bại")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border border-muted/80 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                
                {/* Decorative Header with Soft Gradient Backplate */}
                <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/5 via-violet-500/5 to-transparent border-b border-muted/50">
                    
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">
                            Thêm vào khóa học
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                            Bộ chọn thông tin liên kết
                        </Label>
                        { (selectedSubject || selectedLevel || selectedCourse) && (
                            <button
                                onClick={() => {
                                    setSelectedSubject("")
                                    setSelectedLevel("")
                                    setSelectedCourse("")
                                }}
                                className="text-[11px] font-semibold text-primary hover:underline transition-all"
                            >
                                Làm mới bộ chọn
                            </button>
                        )}
                    </div>

                    {/* Step-by-Step Select Boxes stacked vertically */}
                    <div className="space-y-5">
                        
                        {/* STEP 1: Subject Select Box */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <span className="bg-primary/20 text-primary h-4.5 w-4.5 flex items-center justify-center rounded-full text-[10px] font-mono font-black">1</span>
                                <BookOpen className="h-4 w-4 text-primary" />
                                Chọn Môn Học <span className="text-destructive">*</span>
                            </Label>
                            
                            <Select
                                value={selectedSubject}
                                onValueChange={(val) => setSelectedSubject(val || "")}
                                disabled={isLoadingSubjects}
                            >
                                <SelectTrigger className="w-full rounded-xl border-muted/80 bg-background/50 hover:bg-muted/30 focus:ring-1 focus:ring-primary shadow-sm h-11 transition-all">
                                    <SelectValue placeholder={isLoadingSubjects ? "Đang tải danh sách môn học..." : "-- Chọn Môn Học --"}>
                                        {selectedSubject && subjects.find(s => String(s.id) === selectedSubject)?.name}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-muted bg-background/95 backdrop-blur-xl shadow-xl max-h-[220px]">
                                    {subjects.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)} className="rounded-lg py-2.5 cursor-pointer">
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* STEP 2: Level Select Box */}
                        <div className="space-y-2">
                            <Label className={cn(
                                "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors",
                                selectedSubject ? "text-muted-foreground" : "text-muted-foreground/40"
                            )}>
                                <span className={cn(
                                    "h-4.5 w-4.5 flex items-center justify-center rounded-full text-[10px] font-mono font-black transition-colors",
                                    selectedSubject ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/30"
                                )}>2</span>
                                <Layers className={cn("h-4 w-4 transition-colors", selectedSubject ? "text-primary" : "text-muted-foreground/30")} />
                                Chọn Trình Độ Học <span className="text-destructive">*</span>
                            </Label>
                            
                            <Select
                                value={selectedLevel}
                                onValueChange={(val) => setSelectedLevel(val || "")}
                                disabled={!selectedSubject || isLoadingLevels}
                            >
                                <SelectTrigger className="w-full rounded-xl border-muted/80 bg-background/50 hover:bg-muted/30 focus:ring-1 focus:ring-primary shadow-sm h-11 transition-all">
                                    <SelectValue placeholder={
                                        !selectedSubject 
                                            ? "Vui lòng chọn môn học ở bước 1 trước..." 
                                            : isLoadingLevels 
                                                ? "Đang tải danh sách trình độ..." 
                                                : levels.length === 0 
                                                    ? "Môn học này chưa có trình độ học nào"
                                                    : "-- Chọn Trình Độ Học --"
                                    }>
                                        {selectedLevel && levels.find(l => String(l.id) === selectedLevel)?.name}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-muted bg-background/95 backdrop-blur-xl shadow-xl max-h-[220px]">
                                    {levels.map((l) => (
                                        <SelectItem key={l.id} value={String(l.id)} className="rounded-lg py-2.5 cursor-pointer">
                                            {l.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* STEP 3: Course Select Box */}
                        <div className="space-y-2">
                            <Label className={cn(
                                "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors",
                                selectedLevel ? "text-muted-foreground" : "text-muted-foreground/40"
                            )}>
                                <span className={cn(
                                    "h-4.5 w-4.5 flex items-center justify-center rounded-full text-[10px] font-mono font-black transition-colors",
                                    selectedLevel ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/30"
                                )}>3</span>
                                <BookMarked className={cn("h-4 w-4 transition-colors", selectedLevel ? "text-primary" : "text-muted-foreground/30")} />
                                Chọn Khóa Học Đăng Ký <span className="text-destructive">*</span>
                            </Label>
                            
                            <Select
                                value={selectedCourse}
                                onValueChange={(val) => setSelectedCourse(val || "")}
                                disabled={!selectedSubject || !selectedLevel || isLoadingCourses}
                            >
                                <SelectTrigger className="w-full rounded-xl border-muted/80 bg-background/50 hover:bg-muted/30 focus:ring-1 focus:ring-primary shadow-sm h-11 transition-all">
                                    <SelectValue placeholder={
                                        !selectedSubject || !selectedLevel 
                                            ? "Vui lòng chọn môn học và trình độ ở trên..." 
                                            : isLoadingCourses 
                                                ? "Đang tải danh sách khóa học..." 
                                                : courses.length === 0 
                                                    ? "Không tìm thấy khóa học nào phù hợp"
                                                    : "-- Chọn Khóa Học Đăng Ký --"
                                    }>
                                        {selectedCourse && courses.find(c => String(c.id) === selectedCourse)?.name}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-muted bg-background/95 backdrop-blur-xl shadow-xl max-h-[240px]">
                                    {courses.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)} className="rounded-lg py-2.5 cursor-pointer">
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                    </div>
                </div>

                {/* Styled Modern Footer */}
                <div className="flex items-center justify-end gap-3 p-5 bg-muted/10 border-t border-muted/50 rounded-b-2xl">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="rounded-xl font-medium px-5 transition-colors hover:bg-muted/70"
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        onClick={handleAdd}
                        disabled={isSubmitting || !selectedCourse}
                        className="min-w-[140px] rounded-xl font-semibold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/95 text-white transition-all active:scale-95 duration-150"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang đăng ký...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Thêm vào khóa
                            </>
                        )}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    )
}
