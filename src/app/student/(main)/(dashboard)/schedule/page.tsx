"use client"

import { studentAxios } from "@/api/student"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    GraduationCap,
    RefreshCw,
    Search,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

// ── Types ─────────────────────────────────────────────────────────────────────
interface ScheduleItem {
    id: number
    course_name: string
    class_code: string
    day_of_week: number   // 2=Mon … 7=Sat, 8=Sun
    start_time: string    // "HH:mm:ss"
    end_time: string
    class_id: number
}

interface PaginationMeta {
    current_page: number
    last_page: number
    total: number
    per_page: number
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DAY_LABEL: Record<number, string> = {
    2: "Thứ Hai",
    3: "Thứ Ba",
    4: "Thứ Tư",
    5: "Thứ Năm",
    6: "Thứ Sáu",
    7: "Thứ Bảy",
    8: "Chủ Nhật",
}



const PAGE_SIZE = 10

function formatTime(t: string) {
    return t.slice(0, 5)
}

function getTodayDow(): number {
    const d = new Date().getDay() // 0=Sun,1=Mon...6=Sat
    return d === 0 ? 8 : d + 1
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SchedulePage() {
    const router = useRouter()

    const [loading, setLoading] = React.useState(true)
    const [refreshing, setRefreshing] = React.useState(false)
    const [schedules, setSchedules] = React.useState<ScheduleItem[]>([])
    const [meta, setMeta] = React.useState<PaginationMeta>({
        current_page: 1, last_page: 1, total: 0, per_page: PAGE_SIZE,
    })
    const [page, setPage] = React.useState(1)
    const [search, setSearch] = React.useState("")
    const todayDow = React.useMemo(getTodayDow, [])

    const fetchSchedules = React.useCallback(async (p: number, isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)
        try {
            const res = await studentAxios.get("/schedules", {
                params: { page: p, pagination: PAGE_SIZE },
            })
            if (res.data?.status === "success") {
                const d = res.data.data
                setSchedules(d.data)
                setMeta({
                    current_page: d.current_page,
                    last_page: d.last_page,
                    total: d.total,
                    per_page: d.per_page,
                })
            }
        } catch (err) {
            console.error("Failed to fetch schedules:", err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    React.useEffect(() => {
        fetchSchedules(page)
    }, [fetchSchedules, page])

    // Client-side search filter
    const filtered = React.useMemo(() => {
        if (!search.trim()) return schedules
        const q = search.toLowerCase()
        return schedules.filter(s =>
            s.course_name.toLowerCase().includes(q) ||
            s.class_code.toLowerCase().includes(q)
        )
    }, [schedules, search])

    const sortedFiltered = React.useMemo(() =>
        [...filtered].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)),
        [filtered]
    )

    return (
        <div className="min-h-[calc(100vh-140px)] space-y-6 animate-in fade-in duration-500">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-200">
                            <GraduationCap className="size-4" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                            Học sinh
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Thời Khóa Biểu</h1>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">
                        {format(new Date(), "EEEE, dd MMMM yyyy", { locale: vi })}
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-[11px] font-black uppercase tracking-widest border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 self-start sm:self-auto"
                    onClick={() => fetchSchedules(page, true)}
                    disabled={refreshing}
                >
                    <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
                    Làm mới
                </Button>
            </div>

            {/* ── Main Card ── */}
            <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">

                {/* Toolbar */}
                <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm khóa học, mã lớp..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 h-9 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400 font-medium"
                            />
                        </div>
                        {!loading && (
                            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                                {sortedFiltered.length} buổi học
                            </span>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="text-left px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-8">
                                        #
                                    </th>
                                    <th className="text-left px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                                        Tên khóa học
                                    </th>
                                    <th className="text-left px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                                        Mã lớp học
                                    </th>
                                    <th className="text-left px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                                        Thời gian dạy
                                    </th>
                                    <th className="text-right px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    // Skeleton rows
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-50">
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-4 rounded" /></td>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-40 rounded" /></td>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-28 rounded" /></td>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-36 rounded" /></td>
                                            <td className="px-6 py-4 flex justify-end"><Skeleton className="h-8 w-24 rounded-lg" /></td>
                                        </tr>
                                    ))
                                ) : sortedFiltered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <GraduationCap className="size-7 text-slate-300" />
                                                </div>
                                                <p className="font-bold text-slate-500">Không tìm thấy lịch học</p>
                                                <p className="text-sm text-slate-400">
                                                    {search ? "Thử thay đổi từ khóa tìm kiếm." : "Bạn chưa được xếp lịch học nào."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedFiltered.map((item, idx) => {
                                        const isToday = item.day_of_week === todayDow
                                        const rowNum = (meta.current_page - 1) * meta.per_page + idx + 1

                                        return (
                                            <tr
                                                key={item.id}
                                                className={cn(
                                                    "border-b border-slate-50 transition-colors duration-150 group",
                                                    isToday ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-slate-50/60"
                                                )}
                                            >
                                                {/* STT */}
                                                <td className="px-6 py-4">
                                                    <span className="text-[12px] font-bold text-slate-400">
                                                        {rowNum}
                                                    </span>
                                                </td>

                                                {/* Tên khóa học */}
                                                <td className="px-4 py-4">
                                                    <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                                                        {item.course_name}
                                                    </p>
                                                    {isToday && (
                                                        <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                                            Hôm nay
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Mã lớp */}
                                                <td className="px-4 py-4">
                                                    <code className="text-[12px] font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md tracking-wider">
                                                        {item.class_code}
                                                    </code>
                                                </td>

                                                {/* Thứ + Thời gian (gộp) */}
                                                <td className="px-4 py-4">
                                                    <p className="font-bold text-slate-700 text-sm">
                                                        {DAY_LABEL[item.day_of_week] ?? `Thứ ${item.day_of_week}`}
                                                    </p>
                                                    <p className="text-slate-400 text-[12px] tabular-nums mt-0.5">
                                                        {formatTime(item.start_time)} – {formatTime(item.end_time)}
                                                    </p>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 gap-1.5 text-[11px] font-black uppercase tracking-wide border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 rounded-lg"
                                                        onClick={() => router.push(`/student/class/${item.class_id}/bulletin`)}
                                                    >
                                                        <ExternalLink className="size-3" />
                                                        Chi tiết
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Pagination ── */}
                    {!loading && meta.last_page > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
                            <p className="text-[11px] font-bold text-slate-400">
                                Trang <span className="text-slate-700">{meta.current_page}</span> / {meta.last_page}
                                {" "}· Tổng <span className="text-slate-700">{meta.total}</span> buổi
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 disabled:opacity-40"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                                {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === meta.last_page || Math.abs(p - page) <= 1)
                                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                                        if (i > 0 && arr[i - 1] !== p - 1) acc.push("...")
                                        acc.push(p)
                                        return acc
                                    }, [])
                                    .map((p, i) =>
                                        p === "..." ? (
                                            <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-xs">…</span>
                                        ) : (
                                            <Button
                                                key={p}
                                                variant="outline"
                                                size="icon"
                                                className={cn(
                                                    "size-8 text-[12px] font-black border-slate-200",
                                                    page === p
                                                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700"
                                                        : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                                )}
                                                onClick={() => setPage(p as number)}
                                            >
                                                {p}
                                            </Button>
                                        )
                                    )
                                }
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 disabled:opacity-40"
                                    disabled={page >= meta.last_page}
                                    onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}