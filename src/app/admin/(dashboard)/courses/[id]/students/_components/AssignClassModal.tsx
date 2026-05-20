"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { AxiosError } from "axios"
import { Check, LayoutGrid, Loader2, Search, Users } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

interface ClassItem {
    id: number
    class_code: string
    student_count: number
    teachers: { name: string }[]
    status: string
}

interface AssignClassModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    courseId: string | number
    studentIds: (string | number)[]
    onSuccess?: () => void
}

export function AssignClassModal({
    open,
    onOpenChange,
    courseId,
    studentIds,
    onSuccess,
}: AssignClassModalProps) {
    const [classes, setClasses] = React.useState<ClassItem[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [selectedClassId, setSelectedClassId] = React.useState<number | null>(null)

    const fetchClasses = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await api.get(`/admin/classes/classes-of-course`, {
                params: { course_id: courseId }
            })
            const result = response.data
            const classData = result?.data || result
            let rawClasses: any[] = []
            if (Array.isArray(classData)) {
                rawClasses = classData
            } else if (classData && Array.isArray(classData.data)) {
                rawClasses = classData.data
            } else {
                rawClasses = []
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedClasses: ClassItem[] = rawClasses.map((item: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const teachers = (item.teachers_basic_info || []).map((t: any) => ({
                    name: `${t.last_name || ""} ${t.first_name || ""}`.trim()
                }))

                return {
                    id: item.id,
                    class_code: item.class_code,
                    status: item.status,
                    teachers: teachers,
                    student_count: Number(item.total_students) || 0
                }
            })

            setClasses(mappedClasses)
        } catch (error) {
            console.error("Failed to fetch classes:", error)
            toast.error("Không thể tải danh sách lớp học")
        } finally {
            setIsLoading(false)
        }
    }, [courseId])

    React.useEffect(() => {
        if (open) {
            fetchClasses()
            setSelectedClassId(null)
            setSearch("")
        }
    }, [open, fetchClasses])

    const filteredClasses = classes.filter((c) =>
        c.class_code.toLowerCase().includes(search.toLowerCase())
    )

    const handleAssign = async () => {
        if (!selectedClassId) {
            toast.error("Vui lòng chọn một lớp học")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await api.post(`/admin/students/assign-class`, {
                student_ids: studentIds.map(Number),
                class_id: Number(selectedClassId),
                course_id: Number(courseId)
            })

            if (res.data?.status === "success" || res.data?.success) {
                toast.success(res.data?.message || `Đã thêm ${studentIds.length} học sinh vào lớp ${classes.find(c => c.id === selectedClassId)?.class_code}`)
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(res.data?.message || "Không thể thêm vào lớp")
            }
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                console.error("Assign error:", error)
                toast.error(error.response?.data?.message || "Đã có lỗi xảy ra")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <LayoutGrid className="h-5 w-5 text-primary" />
                        Xếp lớp cho học sinh
                    </DialogTitle>
                    <DialogDescription>
                        Chọn một lớp học trong khóa học này để xếp cho <strong>{studentIds.length}</strong> học sinh đã chọn.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm mã lớp học..."
                            className="pl-9 bg-muted/30 border-none focus-visible:ring-1"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="rounded-xl border border-muted bg-background/50">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="w-[80px]">Chọn</TableHead>
                                    <TableHead>Mã lớp</TableHead>
                                    <TableHead>Giáo viên</TableHead>
                                    <TableHead className="text-center">Sĩ số</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-40 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                                                <span className="text-muted-foreground text-sm">Đang tìm lớp học...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredClasses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                                            Không có lớp học nào phù hợp.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredClasses.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            className={cn(
                                                "cursor-pointer transition-colors hover:bg-primary/5",
                                                selectedClassId === item.id && "bg-primary/5"
                                            )}
                                            onClick={() => setSelectedClassId(item.id)}
                                        >
                                            <TableCell>
                                                <div className={cn(
                                                    "size-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                    selectedClassId === item.id
                                                        ? "border-primary bg-primary text-white"
                                                        : "border-muted-foreground/30 bg-transparent"
                                                )}>
                                                    {selectedClassId === item.id && <Check className="size-3" />}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold">{item.class_code}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {item.teachers?.[0]?.name || "Chưa có giáo viên"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-mono">
                                                    <Users className="size-3 mr-1" />
                                                    {item.student_count || 0}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedClassId || isSubmitting}
                        className="min-w-[140px] shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang xếp lớp...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Xác nhận xếp lớp
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
