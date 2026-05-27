"use client"

import { commonAxios } from "@/api/common"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AxiosError } from "axios"
import { BookOpen, Calendar, ChevronLeft, ChevronRight, Search, User, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"

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

interface MetaData {
   total: number
   per_page: number
   current_page: number
   last_page: number
}

const getImageUrl = (url?: string | null) => {
   if (!url) return null
   if (url.startsWith("http://") || url.startsWith("https://")) return url
   return `${process.env.NEXT_PUBLIC_API_IMAGE_URL || ""}${url}`
}

const formatDate = (dateStr: string) => {
   const d = new Date(dateStr)
   return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const stripHtml = (html: string) => {
   if (typeof window === "undefined") return html
   const doc = new DOMParser().parseFromString(html, "text/html")
   return doc.body.textContent || ""
}

export default function NewsPage() {
   return (
      <Suspense fallback={<NewsSkeleton />}>
         <NewsContent />
      </Suspense>
   )
}

function NewsContent() {
   const [newsList, setNewsList] = useState<NewsItem[]>([])
   const [meta, setMeta] = useState<MetaData | null>(null)
   const [isLoading, setIsLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const [searchInput, setSearchInput] = useState("")
   const [searchQuery, setSearchQuery] = useState("")

   const router = useRouter()
   const pathname = usePathname()
   const searchParams = useSearchParams()
   const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
   const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

   const fetchNews = useCallback(async () => {
      try {
         setIsLoading(true)
         setError(null)

         const params: Record<string, string> = {
            page: currentPage.toString(),
            pagination: "9",
         }
         if (searchQuery) params.title = searchQuery

         const response = await commonAxios.get("/common/news", { params })

         if (response.data.status === "success" || response.data.success) {
            const responseData = response.data.data
            const items: NewsItem[] = Array.isArray(responseData?.data) ? responseData.data : []
            setNewsList(items)
            setMeta({
               total: responseData?.total ?? items.length,
               per_page: responseData?.per_page ?? 9,
               current_page: responseData?.current_page ?? 1,
               last_page: responseData?.last_page ?? 1,
            })
         } else {
            setError("Không thể tải danh sách tin tức.")
         }
      } catch (err: unknown) {
         if (err instanceof AxiosError) {
            setError(err.response?.data?.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại.")
         } else {
            setError("Đã xảy ra lỗi. Vui lòng thử lại.")
         }
      } finally {
         setIsLoading(false)
      }
   }, [currentPage, searchQuery])

   // Sync page from URL
   useEffect(() => {
      const page = Number(searchParams.get("page")) || 1
      if (page !== currentPage) setCurrentPage(page)
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [searchParams])

   useEffect(() => {
      fetchNews()
   }, [fetchNews])

   // Reset page when search changes
   useEffect(() => {
      setCurrentPage(1)
   }, [searchQuery])

   const handleSearchChange = (value: string) => {
      setSearchInput(value)
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
         setSearchQuery(value)
      }, 500)
   }

   const handleClearSearch = () => {
      setSearchInput("")
      setSearchQuery("")
   }

   const handlePageChange = (newPage: number) => {
      if (!meta || newPage < 1 || newPage > meta.last_page) return
      setCurrentPage(newPage)
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", newPage.toString())
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
      window.scrollTo({ top: 0, behavior: "smooth" })
   }

   const getPageNumbers = () => {
      if (!meta) return []
      const total = meta.last_page
      const current = currentPage
      if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
      if (current <= 3) return [1, 2, 3, 4, 5]
      if (current >= total - 1) return [total - 4, total - 3, total - 2, total - 1, total]
      return [current - 2, current - 1, current, current + 1, current + 2]
   }

   return (
      <div className="min-h-screen bg-background">
         {/* Hero Header */}
         <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
               <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
               <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-primary/8 blur-2xl" />
            </div>
            <div className="relative container mx-auto px-4 py-12 md:py-16 max-w-7xl">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                     <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary uppercase tracking-wide">Tin tức & Thông báo</span>
               </div>
               <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
                  Tin tức mới nhất
               </h1>
               <p className="text-muted-foreground text-base md:text-lg max-w-2xl mb-8">
                  Cập nhật những thông tin, thông báo và sự kiện mới nhất từ trung tâm.
               </p>

               {/* Search bar */}
               <div className="relative max-w-xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                     id="news-search-input"
                     type="text"
                     placeholder="Tìm kiếm tin tức..."
                     value={searchInput}
                     onChange={(e) => handleSearchChange(e.target.value)}
                     className="w-full pl-11 pr-10 py-3 rounded-xl border bg-background/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
                  />
                  {searchInput && (
                     <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Xóa tìm kiếm"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  )}
               </div>
            </div>
         </div>

         {/* Content */}
         <div className="container mx-auto px-4 py-10 max-w-7xl">
            {/* Result count */}
            <div className="flex items-center justify-between mb-6">
               <div className="text-sm text-muted-foreground">
                  {isLoading ? (
                     <Skeleton className="h-5 w-40" />
                  ) : (
                     <span>
                        {searchQuery ? (
                           <>
                              Kết quả tìm kiếm cho{" "}
                              <span className="font-semibold text-foreground">&ldquo;{searchQuery}&rdquo;</span>
                              {" — "}
                           </>
                        ) : null}
                        <span className="font-semibold text-foreground">{meta?.total ?? 0}</span> tin tức
                     </span>
                  )}
               </div>
            </div>

            {/* Error state */}
            {error && (
               <div className="p-6 text-center border border-destructive/30 text-destructive bg-destructive/5 rounded-xl mb-6">
                  {error}
               </div>
            )}

            {/* Loading state */}
            {!error && isLoading && <NewsGridSkeleton />}

            {/* Empty state */}
            {!error && !isLoading && newsList.length === 0 && (
               <div className="py-24 text-center border border-dashed rounded-xl bg-card/50 px-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                     <Search className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Không tìm thấy tin tức nào</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
                     {searchQuery
                        ? "Không có tin tức nào phù hợp với từ khóa tìm kiếm. Thử từ khóa khác nhé."
                        : "Hiện chưa có tin tức nào được đăng."}
                  </p>
                  {searchQuery && (
                     <Button onClick={handleClearSearch} variant="outline">
                        Xóa tìm kiếm
                     </Button>
                  )}
               </div>
            )}

            {/* News grid */}
            {!error && !isLoading && newsList.length > 0 && (
               <div className="space-y-10">
                  {/* Featured (first item large) + grid */}
                  {currentPage === 1 && !searchQuery && newsList.length > 0 ? (
                     <div className="space-y-6">
                        {/* Featured card */}
                        <FeaturedNewsCard news={newsList[0]} />
                        {/* Grid for the rest */}
                        {newsList.length > 1 && (
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              {newsList.slice(1).map((news) => (
                                 <NewsCard key={news.id} news={news} />
                              ))}
                           </div>
                        )}
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {newsList.map((news) => (
                           <NewsCard key={news.id} news={news} />
                        ))}
                     </div>
                  )}

                  {/* Pagination */}
                  {meta && meta.last_page > 1 && (
                     <div className="flex items-center justify-center gap-2 pt-6 border-t">
                        <Button
                           variant="outline"
                           size="icon"
                           onClick={() => handlePageChange(currentPage - 1)}
                           disabled={currentPage === 1}
                           aria-label="Trang trước"
                        >
                           <ChevronLeft className="w-4 h-4" />
                        </Button>

                        <div className="flex items-center gap-1">
                           {getPageNumbers().map((pageNum) => (
                              <Button
                                 key={pageNum}
                                 variant={currentPage === pageNum ? "default" : "outline"}
                                 size="icon"
                                 onClick={() => handlePageChange(pageNum)}
                                 className={currentPage === pageNum ? "pointer-events-none" : ""}
                                 aria-label={`Trang ${pageNum}`}
                              >
                                 {pageNum}
                              </Button>
                           ))}
                        </div>

                        <Button
                           variant="outline"
                           size="icon"
                           onClick={() => handlePageChange(currentPage + 1)}
                           disabled={currentPage === meta.last_page}
                           aria-label="Trang tiếp"
                        >
                           <ChevronRight className="w-4 h-4" />
                        </Button>
                     </div>
                  )}
               </div>
            )}
         </div>
      </div>
   )
}

/* ─── Featured News Card ─── */
function FeaturedNewsCard({ news }: { news: NewsItem }) {
   const img = getImageUrl(news.image_url)
   const excerpt = stripHtml(news.content).slice(0, 200)

   return (
      <Link
         href={`/student/news/${news.id}`}
         className="group block relative overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-lg transition-all duration-300"
      >
         <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="relative w-full md:w-[55%] aspect-[16/9] md:aspect-auto md:min-h-[280px] overflow-hidden bg-muted shrink-0">
               {img ? (
                  <img
                     src={img}
                     alt={news.title}
                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
               ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                     <BookOpen className="w-16 h-16 text-primary/30" />
                  </div>
               )}
               <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                     Nổi bật
                  </span>
               </div>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center p-6 md:p-8 flex-1 min-w-0">
               <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                     <Calendar className="w-3.5 h-3.5" />
                     {formatDate(news.created_at)}
                  </span>
                  {news.author && (
                     <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {news.author.first_name} {news.author.last_name}
                     </span>
                  )}
               </div>
               <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {news.title}
               </h2>
               {excerpt && (
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
                     {excerpt}
                  </p>
               )}
               <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
                  Đọc thêm <ChevronRight className="w-4 h-4" />
               </span>
            </div>
         </div>
      </Link>
   )
}

/* ─── Regular News Card ─── */
function NewsCard({ news }: { news: NewsItem }) {
   const img = getImageUrl(news.image_url)
   const excerpt = stripHtml(news.content).slice(0, 120)

   return (
      <Link
         href={`/student/news/${news.id}`}
         className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
      >
         {/* Thumbnail */}
         <div className="relative aspect-[16/9] overflow-hidden bg-muted">
            {img ? (
               <img
                  src={img}
                  alt={news.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
               />
            ) : (
               <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <BookOpen className="w-10 h-10 text-primary/30" />
               </div>
            )}
         </div>

         {/* Body */}
         <div className="flex flex-col flex-1 p-5">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
               <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(news.created_at)}
               </span>
               {news.author && (
                  <span className="flex items-center gap-1 truncate">
                     <User className="w-3 h-3 shrink-0" />
                     <span className="truncate">{news.author.first_name} {news.author.last_name}</span>
                  </span>
               )}
            </div>

            <h3 className="text-base font-semibold text-foreground mb-2 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
               {news.title}
            </h3>

            {excerpt && (
               <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 flex-1">
                  {excerpt}
               </p>
            )}

            <div className="mt-4 pt-3 border-t flex items-center text-primary text-sm font-medium gap-1 group-hover:gap-2 transition-all">
               Đọc thêm <ChevronRight className="w-4 h-4" />
            </div>
         </div>
      </Link>
   )
}

/* ─── Skeleton states ─── */
function NewsGridSkeleton() {
   return (
      <div className="space-y-6">
         {/* Featured skeleton */}
         <div className="flex flex-col md:flex-row overflow-hidden rounded-2xl border bg-card h-auto md:h-[280px]">
            <Skeleton className="w-full md:w-[55%] aspect-[16/9] md:aspect-auto rounded-none" />
            <div className="p-6 md:p-8 flex flex-col justify-center flex-1 gap-3">
               <Skeleton className="h-4 w-32" />
               <Skeleton className="h-7 w-3/4" />
               <Skeleton className="h-7 w-1/2" />
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-2/3" />
               <Skeleton className="h-4 w-20 mt-2" />
            </div>
         </div>
         {/* Grid skeleton */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
                  <Skeleton className="w-full aspect-[16/9] rounded-none" />
                  <div className="p-5 flex flex-col gap-2.5">
                     <Skeleton className="h-3 w-36" />
                     <Skeleton className="h-5 w-full" />
                     <Skeleton className="h-5 w-4/5" />
                     <Skeleton className="h-3 w-full" />
                     <Skeleton className="h-3 w-2/3" />
                  </div>
               </div>
            ))}
         </div>
      </div>
   )
}

function NewsSkeleton() {
   return (
      <div className="min-h-screen bg-background">
         <div className="border-b py-12 md:py-16">
            <div className="container mx-auto px-4 max-w-7xl">
               <Skeleton className="h-5 w-40 mb-4" />
               <Skeleton className="h-10 w-64 mb-3" />
               <Skeleton className="h-6 w-full max-w-2xl mb-8" />
               <Skeleton className="h-12 w-full max-w-xl rounded-xl" />
            </div>
         </div>
         <div className="container mx-auto px-4 py-10 max-w-7xl">
            <NewsGridSkeleton />
         </div>
      </div>
   )
}
