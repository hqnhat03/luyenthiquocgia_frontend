"use client"

import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { useLayoutStore } from "@/store/layout-store"
import { AxiosError } from "axios"
import {
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Edit2,
    RefreshCcw,
    Search,
    SearchX,
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useDebounce } from "@/hooks/use-debounce"
import { usePermission } from "@/hooks/use-permission"
import { useRouter } from "next/navigation"

interface CourseRegistration {
    id: number
    course_id: number
    name: string
    email: string
    phone: string
    status: "pending" | "completed" | "cancelled"
    course_name: string
}


const statusConfig = {
    pending: {
        label: "Chưa xử lý",
        color: "bg-amber-500/10 text-amber-600 border-amber-200",
    },
    completed: {
        label: "Hoàn Thành",
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    },
    cancelled: {
        label: "Hủy",
        color: "bg-rose-500/10 text-rose-600 border-rose-200",
    },
}

export default function CourseRegistrationsPage() {
    const router = useRouter()
    const { hasPermission } = usePermission()
  const setHeaderContent = useLayoutStore((state) => state.setHeaderContent)

    // Kiểm tra quyền truy cập trang
    React.useEffect(() => {
        if (!hasPermission("course_registration_list")) {
            toast.error("Bạn không có quyền truy cập trang này")
            router.push("/admin")
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]) // Remove hasPermission to avoid loop

    const [registrations, setRegistrations] = React.useState<CourseRegistration[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<string>("all")

    // Pagination and Sorting State
    const [currentPage, setCurrentPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(10)
    const [sortBy, setSortBy] = React.useState("created_at")
    const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
    const [totalItems, setTotalItems] = React.useState(0)
    const [lastPage, setLastPage] = React.useState(1)

    const debouncedSearch = useDebounce(search, 500)

    // Edit status state
    const [editingRegistration, setEditingRegistration] = React.useState<CourseRegistration | null>(null)
    const [selectedStatus, setSelectedStatus] = React.useState<CourseRegistration["status"] | null>(null)
    const [isUpdating, setIsUpdating] = React.useState(false)

    React.useEffect(() => {
        if (editingRegistration) {
            setSelectedStatus(editingRegistration.status)
        } else {
            setSelectedStatus(null)
        }
    }, [editingRegistration])

    const fetchRegistrations = React.useCallback(async () => {
        // We check permission inside but don't depend on the function reference
        if (!hasPermission("course_registration_list")) return

        setIsLoading(true)
        try {
            const response = await api.get("/admin/course-registrations", {
                params: {
                    page: currentPage,
                    per_page: pageSize,
                    search: debouncedSearch,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                },
            })

            const result = response.data
            if (result.success) {
                setRegistrations(result.data || [])
                setTotalItems(result.meta?.total || 0)
                setLastPage(result.meta?.last_page || 1)
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.message || "Không thể tải danh sách đăng ký")
            }
        } finally {
            setIsLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, pageSize, debouncedSearch, statusFilter, sortBy, sortOrder]) // Remove hasPermission

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
        setCurrentPage(1)
    }

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        return sortOrder === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4 text-primary" />
        ) : (
            <ChevronDown className="ml-2 h-4 w-4 text-primary" />
        )
    }

    React.useEffect(() => {
        fetchRegistrations()
    }, [fetchRegistrations])

    const pageHeader = React.useMemo(() => (
        <div className="flex flex-1 items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Quản lý đăng ký khóa học
            </h2>
        </div>
    ), []);

    React.useEffect(() => {
        setHeaderContent(pageHeader)
        return () => setHeaderContent(null)
    }, [setHeaderContent, pageHeader])

    if (!hasPermission("course_registration_list")) return null

    const handleUpdateStatus = async () => {
        if (!editingRegistration || !selectedStatus) return

        setIsUpdating(true)
        try {
            const response = await api.patch(`/admin/course-registrations/${editingRegistration.id}`, {
                status: selectedStatus
            })

            if (response.data.success) {
                toast.success("Cập nhật trạng thái thành công")
                setRegistrations(prev => prev.map(reg => reg.id === editingRegistration.id ? { ...reg, status: selectedStatus } : reg))
                setEditingRegistration(null)
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái")
            }
        } finally {
            setIsUpdating(false)
        }
    }

    const statusLabels: Record<string, string> = {
        "all": "Tất cả trạng thái",
        "pending": "Chưa xử lý",
        "completed": "Hoàn Thành",
        "cancelled": "Hủy",
    }

    const handleReset = () => {
        setSearch("")
        setStatusFilter("all")
        setCurrentPage(1)
        setSortBy("created_at")
        setSortOrder("desc")
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700">

            {/* Filter Section */}
            <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
                <CardContent className="p-4">
                    <div className="flex flex-wrap justify-start gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm tên, email hoặc SĐT..."
                                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Select
                            value={statusLabels[statusFilter]}
                            onValueChange={(val) => {
                                const key = Object.keys(statusLabels).find(k => statusLabels[k] === val);
                                setStatusFilter(key || "all");
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="bg-background border-muted-foreground/20">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(statusLabels).map((label) => (
                                    <SelectItem key={label} value={label}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex-1">
                        </div>

                        <Button
                            variant="outline"
                            className="w-full md:w-fit bg-background hover:bg-muted transition-colors border-dashed"
                            onClick={handleReset}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" /> Làm mới
                        </Button>
                    </div>



                </CardContent>
            </Card>

            {/* Main Table */}
            <div className="relative rounded-xl border bg-background/50 backdrop-blur-sm shadow-md overflow-hidden border-muted/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                <Table className="relative">
                    <TableHeader className="bg-muted/50 backdrop-blur-md">
                        <TableRow className="hover:bg-transparent border-muted/20">
                            <TableHead
                                className="font-bold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleSort("course_id")}
                            >
                                <div className="flex items-center">
                                    Khóa học
                                    <SortIcon field="course_id" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="font-bold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleSort("name")}
                            >
                                <div className="flex items-center">
                                    Khách hàng
                                    <SortIcon field="name" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="font-bold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleSort("email")}
                            >
                                <div className="flex items-center">
                                    Email
                                    <SortIcon field="email" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="font-bold cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleSort("phone")}
                            >
                                <div className="flex items-center">
                                    Số điện thoại
                                    <SortIcon field="phone" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="font-bold text-center cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleSort("status")}
                            >
                                <div className="flex items-center justify-center">
                                    Trạng thái
                                    <SortIcon field="status" />
                                </div>
                            </TableHead>
                            <TableHead className="text-center font-bold">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-muted/10">
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><div className="flex justify-center"><Skeleton className="h-7 w-24 rounded-full" /></div></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-8 w-32 mx-auto rounded-md" /></TableCell>
                                </TableRow>
                            ))
                        ) : registrations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-80 text-center">
                                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground animate-in zoom-in-95 duration-500">
                                        <div className="p-4 bg-muted rounded-full">
                                            <SearchX className="h-12 w-12 opacity-20" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xl font-semibold text-foreground/80">Không tìm thấy đăng ký nào</p>
                                            <p className="text-sm">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleReset} className="mt-2 border-dashed">
                                            Xóa tất cả bộ lọc
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            registrations.map((reg) => {
                                const config = statusConfig[reg.status]
                                return (
                                    <TableRow key={reg.id} className="hover:bg-primary/[0.02] transition-all duration-300 group border-muted/10">
                                        <TableCell>
                                            <span className="text-sm font-semibold text-foreground/90">{reg.course_name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                                {reg.name}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground/80">
                                                {reg.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground/80">
                                                {reg.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={cn(
                                                "font-bold border shadow-sm px-4 py-1.5 rounded-full transition-all duration-300 group-hover:scale-105 text-sm",
                                                config.color
                                            )}>
                                                {config.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {hasPermission("course_registration_edit") && (
                                                <div className="flex justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all active:scale-90 shadow-none"
                                                        onClick={() => setEditingRegistration(reg)}
                                                        title="Chỉnh sửa trạng thái"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 mt-6 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                    <p>
                        Hiển thị <strong>{registrations.length}</strong> / <strong>{totalItems}</strong> đăng ký
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">Số hàng:</span>
                        <Select
                            value={pageSize.toString()}
                            onValueChange={(val) => {
                                setPageSize(parseInt(val || "10"))
                                setCurrentPage(1)
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px] bg-background">
                                <SelectValue placeholder={pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentPage === 1 || isLoading}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                        Trước
                    </Button>
                    <div className="flex items-center gap-1">
                        {(() => {
                            const maxVisible = 5;
                            let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                            const end = Math.min(lastPage, start + maxVisible - 1);

                            if (end - start + 1 < maxVisible) {
                                start = Math.max(1, end - maxVisible + 1);
                            }

                            const pages: number[] = [];
                            for (let i = start; i <= end; i++) {
                                pages.push(i);
                            }

                            return pages.map((pageNum) => (
                                <Button
                                    key={`page-${pageNum}`}
                                    variant={currentPage === pageNum ? "default" : "ghost"}
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 text-xs font-medium",
                                        currentPage === pageNum && "shadow-md shadow-primary/20"
                                    )}
                                    onClick={() => setCurrentPage(pageNum)}
                                    disabled={isLoading}
                                >
                                    {pageNum}
                                </Button>
                            ));
                        })()}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentPage === lastPage || isLoading}
                        onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
                    >
                        Sau
                    </Button>
                </div>
            </div>

            {/* Edit Status Dialog */}
            <Dialog open={!!editingRegistration} onOpenChange={(open) => !open && setEditingRegistration(null)}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-primary">Cập nhật trạng thái</DialogTitle>
                        <DialogDescription className="text-base">
                            Vui lòng kiểm tra kỹ thông tin đăng ký bên dưới trước khi thay đổi trạng thái.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Info Section */}
                        <div className="space-y-3 p-4 rounded-xl bg-muted/40 border border-muted-foreground/10 shadow-inner">
                            <div className="flex flex-col gap-1.5 pb-2 border-b border-muted-foreground/5">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">Khóa học đăng ký</span>
                                <span className="text-sm font-bold text-foreground leading-snug">{editingRegistration?.course_name}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">Khách hàng</span>
                                    <span className="text-sm font-semibold">{editingRegistration?.name}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">Số điện thoại</span>
                                    <span className="text-sm font-semibold text-primary">{editingRegistration?.phone}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 pt-1">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">Địa chỉ Email</span>
                                <span className="text-sm font-medium text-muted-foreground">{editingRegistration?.email}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <p className="text-sm font-bold text-foreground/80 px-1">Chọn trạng thái xử lý:</p>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "flex items-center justify-center h-12 px-2 border-2 transition-all duration-300 rounded-xl relative overflow-hidden group",
                                        selectedStatus === "pending"
                                            ? "border-amber-500 bg-amber-500/5 text-amber-700 shadow-sm"
                                            : "hover:border-muted-foreground/30"
                                    )}
                                    onClick={() => setSelectedStatus("pending")}
                                    disabled={isUpdating}
                                >
                                    <span className="font-bold text-xs leading-tight">Chưa xử lý</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className={cn(
                                        "flex items-center justify-center h-12 px-2 border-2 transition-all duration-300 rounded-xl relative overflow-hidden group",
                                        selectedStatus === "completed"
                                            ? "border-emerald-500 bg-emerald-500/5 text-emerald-700 shadow-md shadow-emerald-500/10"
                                            : "hover:border-muted-foreground/30"
                                    )}
                                    onClick={() => setSelectedStatus("completed")}
                                    disabled={isUpdating}
                                >
                                    <span className="font-bold text-xs leading-tight">Hoàn Thành</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className={cn(
                                        "flex items-center justify-center h-12 px-2 border-2 transition-all duration-300 rounded-xl relative overflow-hidden group",
                                        selectedStatus === "cancelled"
                                            ? "border-rose-500 bg-rose-500/5 text-rose-700 shadow-md shadow-rose-500/10"
                                            : "hover:border-muted-foreground/30"
                                    )}
                                    onClick={() => setSelectedStatus("cancelled")}
                                    disabled={isUpdating}
                                >
                                    <span className="font-bold text-xs leading-tight">Hủy bỏ</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setEditingRegistration(null)}
                            disabled={isUpdating}
                            className="rounded-xl"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            className="bg-primary hover:bg-primary/90 text-white px-8 rounded-xl shadow-md shadow-primary/10 transition-all active:scale-95"
                            onClick={handleUpdateStatus}
                            disabled={isUpdating || selectedStatus === editingRegistration?.status}
                        >
                            {isUpdating ? (
                                <>
                                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                "Lưu thay đổi"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
