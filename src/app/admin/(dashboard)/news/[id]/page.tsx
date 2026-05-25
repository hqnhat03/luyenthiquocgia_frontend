"use client"

import {
    Calendar,
    ChevronLeft,
    Edit,
    Newspaper,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/axios"
import { useLayoutStore } from "@/store/layout-store"
import { News } from "@/types/NewsType"
import Image from "next/image"

export default function ArticleDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const setHeaderContent = useLayoutStore((state) => state.setHeaderContent)
    const [article, setArticle] = React.useState<News | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    const fetchArticle = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await api.get(`/admin/news/detail?id=${id}`)
            // Handle both response structures (nested data or direct)
            const data = response.data?.data || response.data
            setArticle(data)
        } catch (error) {
            console.error("Failed to fetch article:", error)
            toast.error("Không thể tải thông tin bài viết")
            router.push("/admin/news")
        } finally {
            setIsLoading(false)
        }
    }, [id, router])

    React.useEffect(() => {
        fetchArticle()
    }, [fetchArticle])

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

    const pageHeader = React.useMemo(() => (
        <div className="flex flex-1 items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center gap-4">
                <Link href="/admin/news">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted transition-colors">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Chi tiết bài viết
                    </h2>
                </div>
            </div>
            {article && (
                <Link href={`/admin/news/${id}/edit`}>
                    <Button className="h-10 px-6 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
                        <Edit className="mr-2 h-4 w-4" />
                        <span className="text-sm font-bold">Chỉnh sửa</span>
                    </Button>
                </Link>
            )}
        </div>
    ), [article, id]);

    React.useEffect(() => {
        setHeaderContent(pageHeader)
        return () => setHeaderContent(null)
    }, [setHeaderContent, pageHeader])

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8 p-6 w-full max-w-5xl mx-auto animate-in fade-in duration-500">
                <Skeleton className="aspect-[21/7] w-full rounded-3xl" />
                <div className="space-y-4">
                    <Skeleton className="h-12 w-3/4" />
                    <div className="flex gap-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                </div>
                <div className="space-y-4 mt-8">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
            </div>
        )
    }

    if (!article) return null

    return (
        <div className="flex flex-col gap-8 p-6 pb-20 w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Banner Image Section */}
            <div className="relative aspect-[21/7] w-full overflow-hidden rounded-3xl group">
                {article.image_url ? (
                    <>
                        <Image
                            src={article.image_url.startsWith('http') ? article.image_url : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}${article.image_url}`}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            priority
                        />
                    </>
                ) : (
                    <div className="w-full h-full bg-muted flex flex-col items-center justify-center text-muted-foreground/30">
                        <Newspaper className="h-20 w-20 mb-2" />
                        <span className="text-sm font-medium">Không có ảnh bìa</span>
                    </div>
                )}
            </div>

            {/* Content Header Section */}
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    {getStatusBadge(article.status)}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(article.created_at).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground">
                    {article.title}
                </h1>
            </div>

            {/* Article Content Section */}
            <div className="relative">
                <div 
                    className="prose prose-lg dark:prose-invert max-w-none 
                        prose-headings:font-bold prose-headings:tracking-tight
                        prose-p:leading-relaxed prose-p:text-muted-foreground/90
                        prose-img:rounded-2xl prose-img:shadow-lg
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        ql-editor !p-0" // Using ql-editor class for Quill compatibility
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />
            </div>
        </div>
    )
}
