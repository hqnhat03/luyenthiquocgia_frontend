"use client"

import {
    Edit,
    Eye,
    Loader2,
    Newspaper,
    Plus,
    RefreshCw,
    Search,
    Trash2
} from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { useLayoutStore } from "@/store/layout-store"
import { News } from "@/types/NewsType"
import Image from "next/image"

export default function NewsPage() {
    const setHeaderContent = useLayoutStore((state) => state.setHeaderContent)
    const [news, setNews] = React.useState<News[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [currentPage, setCurrentPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(10)
    const [totalItems, setTotalItems] = React.useState(0)
    const [lastPage, setLastPage] = React.useState(1)
    const [isDeleting, setIsDeleting] = React.useState<number | null>(null)
    const [newsToDelete, setNewsToDelete] = React.useState<News | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

    const fetchNews = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await api.get("/admin/news", {
                params: {
                    search: searchQuery,
                    page: currentPage,
                    per_page: pageSize,
                },
            })
            if (response.data?.status === "success" && response.data?.data) {
                const paginationData = response.data.data
                setNews(paginationData.data || [])
                setTotalItems(paginationData.total || 0)
                setLastPage(paginationData.last_page || 1)
            } else {
                setNews([])
                setTotalItems(0)
                setLastPage(1)
            }
        } catch (error) {
            console.error("Failed to fetch news:", error)
            toast.error("Không thể tải danh sách tin tức")
            setNews([])
            setTotalItems(0)
            setLastPage(1)
        } finally {
            setIsLoading(false)
        }
    }, [searchQuery, currentPage, pageSize])

    React.useEffect(() => {
        const timer = setTimeout(() => {
            fetchNews()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchNews])

    const pageHeader = React.useMemo(() => (
        <div className="flex flex-1 items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Quản lý bài viết
            </h2>
            <Link href="/admin/news/create">
                <Button className="h-10 px-6 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="text-sm font-bold">Thêm bài viết</span>
                </Button>
            </Link>
        </div>
    ), []);

    React.useEffect(() => {
        setHeaderContent(pageHeader)
        return () => setHeaderContent(null)
    }, [setHeaderContent, pageHeader])

    const handleDelete = async () => {
        if (!newsToDelete) return

        setIsDeleting(newsToDelete.id)
        try {
            await api.delete("/admin/news/delete", {
                params: { id: newsToDelete.id }
            })
            toast.success("Xóa bài viết thành công")
            fetchNews()
            setIsDeleteDialogOpen(false)
            setNewsToDelete(null)
        } catch (error) {
            console.error("Failed to delete article:", error)
            toast.error("Không thể xóa bài viết")
        } finally {
            setIsDeleting(null)
        }
    }

    const getStatusBadge = (status: any) => {
        const s = String(status);
        switch (s) {
            case "2":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600">Đã xuất bản</Badge>
            case "0":
                return <Badge variant="secondary">Bản nháp</Badge>
            case "1":
                return <Badge variant="destructive">Lưu trữ</Badge>
            default:
                return <Badge variant="outline">{s}</Badge>
        }
    }

    return (
        <div className="flex flex-col gap-6 p-1 animate-in fade-in duration-500">
            <Card className="border-none shadow-sm bg-muted/40">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row items-center justify-end gap-4">
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm theo tiêu đề..."
                                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setCurrentPage(1)
                                }}
                            />
                        </div>

                        <div className="flex-1"></div>

                        <Button
                            variant="outline"
                            className="w-full md:w-fit"
                            onClick={() => {
                                setSearchQuery("")
                                setCurrentPage(1)
                            }}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="rounded-xl border bg-background/50 shadow-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[220px]">Ảnh</TableHead>
                            <TableHead>Tiêu đề</TableHead>
                            <TableHead className="w-[150px]">Trạng thái</TableHead>
                            <TableHead className="w-[180px]">Ngày tạo</TableHead>
                            <TableHead className="w-[140px] text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="h-32 w-48 animate-pulse rounded bg-muted" /></TableCell>
                                    <TableCell><div className="h-4 w-full animate-pulse rounded bg-muted" /></TableCell>
                                    <TableCell><div className="h-6 w-20 animate-pulse rounded bg-muted" /></TableCell>
                                    <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
                                    <TableCell><div className="ml-auto h-8 w-8 animate-pulse rounded bg-muted" /></TableCell>
                                </TableRow>
                            ))
                        ) : news.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Newspaper className="mb-2 h-8 w-8 opacity-20" />
                                        <p>Không tìm thấy bài viết nào</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            news.map((article) => (
                                <TableRow key={article.id} className="group transition-colors">
                                    <TableCell>
                                        <div className="relative h-32 w-48 overflow-hidden rounded border bg-muted shadow-sm">
                                            {article.image_url ? (
                                                <Image
                                                    src={article.image_url.startsWith('http') ? article.image_url : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${article.image_url}`}
                                                    alt={article.title}
                                                    className="h-full w-full object-cover"
                                                    width={192}
                                                    height={128}
                                                />
                                            ) : (
                                                <Newspaper className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="group-hover:text-primary transition-colors">{article.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(article.status)}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(article.created_at).toLocaleDateString('vi-VN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors rounded-xl"
                                                title="Xem chi tiết"
                                            >
                                                <Link href={`/admin/news/${article.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-amber-600 transition-colors rounded-xl"
                                                title="Chỉnh sửa"
                                            >
                                                <Link href={`/admin/news/${article.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setNewsToDelete(article)
                                                    setIsDeleteDialogOpen(true)
                                                }}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors rounded-xl"
                                                title="Xóa"
                                            >
                                                {isDeleting === article.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4 text-sm text-muted-foreground border-t bg-muted/5 rounded-b-xl">
                <div className="flex items-center gap-4">
                    <p>
                        Hiển thị <strong>{news.length}</strong> / <strong>{totalItems}</strong> bài viết
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
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isLoading}
                        className="bg-background h-8"
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
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
                        disabled={currentPage === lastPage || isLoading}
                        className="bg-background h-8"
                    >
                        Sau
                    </Button>
                </div>
            </div>

            <ConfirmDeleteModal
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDelete}
                loading={isDeleting !== null}
                itemName={newsToDelete?.title}
            />
        </div>
    )
}
