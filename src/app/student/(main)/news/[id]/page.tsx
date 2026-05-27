"use client"

import { commonAxios } from "@/api/common"
import { Skeleton } from "@/components/ui/skeleton"
import { AxiosError } from "axios"
import {
   ArrowLeft,
   BookOpen,
   Calendar,
   ChevronRight,
   User,
} from "lucide-react"
import Link from "next/link"
import { use, useEffect, useState } from "react"

/* ─── Types ─── */
interface Author {
   id: number
   first_name: string
   last_name: string
   avatar_url: string | null
}

interface NewsItem {
   id: number
   title: string
   content: string
   image_url: string | null
   status: number
   created_at: string
   updated_at: string
   author: Author | null
}

interface NewsDetailResponse {
   detail: NewsItem
   related_news: NewsItem[]
}

/* ─── Helpers ─── */
const getImageUrl = (url?: string | null) => {
   if (!url) return null
   if (url.startsWith("http://") || url.startsWith("https://")) return url
   return `${process.env.NEXT_PUBLIC_API_IMAGE_URL || ""}${url}`
}

const formatDate = (dateStr: string) => {
   const d = new Date(dateStr)
   return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const getAuthorInitials = (author: Author) => {
   return `${author.first_name?.[0] ?? ""}${author.last_name?.[0] ?? ""}`.toUpperCase()
}

/* ─── Page ─── */
export default function NewsDetailPage({
   params,
}: {
   params: Promise<{ id: string }>
}) {
   const { id } = use(params)
   const [data, setData] = useState<NewsDetailResponse | null>(null)
   const [isLoading, setIsLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)

   useEffect(() => {
      const fetchDetail = async () => {
         try {
            setIsLoading(true)
            setError(null)
            const response = await commonAxios.get("/common/news/detail", {
               params: { id },
            })
            if (response.data.status === "success" || response.data.success) {
               setData(response.data.data)
            } else {
               setError("Không thể tải nội dung tin tức.")
            }
         } catch (err: unknown) {
            if (err instanceof AxiosError) {
               setError(err.response?.data?.message || "Không thể kết nối đến máy chủ.")
            } else {
               setError("Đã xảy ra lỗi. Vui lòng thử lại.")
            }
         } finally {
            setIsLoading(false)
         }
      }
      fetchDetail()
   }, [id])

   return (
      <div className="min-h-screen bg-background">
         {/* Top nav bar */}
         <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
            <div className="container mx-auto px-4 max-w-7xl h-14 flex items-center gap-3">
               <Link
                  href="/student/news"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
               >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại tin tức
               </Link>
               <span className="text-muted-foreground/50">/</span>
               {isLoading ? (
                  <Skeleton className="h-4 w-40" />
               ) : (
                  <span className="text-sm text-foreground font-medium line-clamp-1 max-w-xs md:max-w-sm lg:max-w-md">
                     {data?.detail?.title ?? "Chi tiết tin tức"}
                  </span>
               )}
            </div>
         </div>

         <div className="container mx-auto px-4 py-10 max-w-7xl">
            {/* Error state */}
            {error && (
               <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
                     <BookOpen className="w-9 h-9 text-destructive/50" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Không tìm thấy tin tức</h2>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm">{error}</p>
                  <Link
                     href="/student/news"
                     className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                     <ArrowLeft className="w-4 h-4" />
                     Về danh sách tin tức
                  </Link>
               </div>
            )}

            {/* Loading state */}
            {!error && isLoading && <ArticleSkeleton />}

            {/* Content */}
            {!error && !isLoading && data && (
               <div className="flex flex-col lg:flex-row gap-10">
                  {/* ── Main Article ── */}
                  <article className="flex-1 min-w-0">
                     {/* Hero image */}
                     {getImageUrl(data.detail.image_url) ? (
                        <div className="relative w-full aspect-[16/7] overflow-hidden rounded-2xl mb-8 shadow-md">
                           <img
                              src={getImageUrl(data.detail.image_url)!}
                              alt={data.detail.title}
                              className="w-full h-full object-cover"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        </div>
                     ) : (
                        <div className="w-full aspect-[16/7] rounded-2xl mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center border">
                           <BookOpen className="w-20 h-20 text-primary/20" />
                        </div>
                     )}

                     {/* Meta */}
                     <div className="flex flex-wrap items-center gap-4 mb-5">
                        {/* Author avatar + name */}
                        {data.detail.author && (
                           <div className="flex items-center gap-2.5">
                              {getImageUrl(data.detail.author.avatar_url) ? (
                                 <img
                                    src={getImageUrl(data.detail.author.avatar_url)!}
                                    alt={`${data.detail.author.first_name} ${data.detail.author.last_name}`}
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
                                 />
                              ) : (
                                 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold ring-2 ring-primary/20">
                                    {getAuthorInitials(data.detail.author)}
                                 </div>
                              )}
                              <span className="text-sm font-medium text-foreground">
                                 {data.detail.author.first_name} {data.detail.author.last_name}
                              </span>
                           </div>
                        )}

                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                           <Calendar className="w-3.5 h-3.5" />
                           {formatDate(data.detail.created_at)}
                        </span>

                        {data.detail.updated_at !== data.detail.created_at && (
                           <span className="text-xs text-muted-foreground/70 italic">
                              (Cập nhật: {formatDate(data.detail.updated_at)})
                           </span>
                        )}
                     </div>

                     {/* Title */}
                     <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-8">
                        {data.detail.title}
                     </h1>

                     {/* Body content */}
                     <div
                        id="news-detail-content"
                        className="prose prose-neutral dark:prose-invert max-w-none text-foreground/90 leading-relaxed
                           prose-headings:font-bold prose-headings:text-foreground
                           prose-p:mb-4 prose-p:leading-7
                           prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto
                           prose-a:text-primary prose-a:underline prose-a:underline-offset-2
                           prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:rounded-r-lg
                           prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                           prose-pre:bg-muted prose-pre:rounded-xl"
                        dangerouslySetInnerHTML={{ __html: data.detail.content }}
                     />
                  </article>

                  {/* ── Sidebar: Related News ── */}
                  {data.related_news && data.related_news.length > 0 && (
                     <aside className="w-full lg:w-[320px] xl:w-[360px] shrink-0">
                        <div className="sticky top-20">
                           <div className="flex items-center gap-2 mb-5">
                              <div className="w-1 h-5 rounded-full bg-primary" />
                              <h2 className="text-base font-semibold text-foreground">
                                 Bài viết liên quan
                              </h2>
                           </div>
                           <div className="space-y-4">
                              {data.related_news.map((item) => (
                                 <RelatedNewsCard key={item.id} news={item} />
                              ))}
                           </div>

                           <div className="mt-6 pt-5 border-t">
                              <Link
                                 href="/student/news"
                                 className="flex items-center gap-1.5 text-sm text-primary font-medium hover:gap-2.5 transition-all"
                              >
                                 Xem tất cả tin tức
                                 <ChevronRight className="w-4 h-4" />
                              </Link>
                           </div>
                        </div>
                     </aside>
                  )}
               </div>
            )}
         </div>
      </div>
   )
}

/* ─── Related News Card ─── */
function RelatedNewsCard({ news }: { news: NewsItem }) {
   const img = getImageUrl(news.image_url)

   return (
      <Link
         href={`/student/news/${news.id}`}
         className="group flex gap-3 p-3 rounded-xl border bg-card hover:shadow-sm hover:border-primary/30 transition-all duration-200"
      >
         {/* Thumbnail */}
         <div className="relative w-20 h-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            {img ? (
               <img
                  src={img}
                  alt={news.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
               />
            ) : (
               <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <BookOpen className="w-5 h-5 text-primary/30" />
               </div>
            )}
         </div>

         {/* Info */}
         <div className="flex flex-col justify-between min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
               {news.title}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
               <Calendar className="w-3 h-3 shrink-0" />
               {formatDate(news.created_at)}
            </div>
         </div>
      </Link>
   )
}

/* ─── Skeletons ─── */
function ArticleSkeleton() {
   return (
      <div className="flex flex-col lg:flex-row gap-10">
         {/* Main */}
         <div className="flex-1 min-w-0">
            <Skeleton className="w-full aspect-[16/7] rounded-2xl mb-8" />
            <div className="flex items-center gap-4 mb-5">
               <Skeleton className="w-8 h-8 rounded-full" />
               <Skeleton className="h-4 w-32" />
               <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-9 w-full mb-3" />
            <Skeleton className="h-9 w-3/4 mb-8" />
            <div className="space-y-3">
               {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className={`h-4 ${i % 5 === 4 ? "w-2/3" : "w-full"}`} />
               ))}
            </div>
         </div>
         {/* Sidebar */}
         <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0">
            <Skeleton className="h-5 w-36 mb-5" />
            <div className="space-y-4">
               {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl border bg-card">
                     <Skeleton className="w-20 h-16 rounded-lg shrink-0" />
                     <div className="flex flex-col gap-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-20 mt-auto" />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   )
}
