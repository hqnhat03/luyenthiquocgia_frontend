"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { studentAxios as api } from '@/api/student';
import {
    ChevronLeft,
    Clock,
    ExternalLink,
    FileText,
    MessageSquare,
    Play
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Lecture {
    id: number
    name: string
    duration_time: number
    lecture_number: number
    video_url?: string
    document_url?: string
    description?: string
    status: string
}

export default function LectureWatchPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string
    const lecture_id = params?.lecture_id as string

    const [loading, setLoading] = useState(true)
    const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null)

    useEffect(() => {
        const hasToken = document.cookie.includes('access_token')
        if (!hasToken) {
            router.replace('/login')
            return
        }

        const fetchData = async () => {
            try {
                setLoading(true)
                // Lấy chi tiết bài giảng hiện tại
                const detailRes = await api.get(`/classes/${id}/lectures/${lecture_id}`)
                if (detailRes.data.success) {
                    setCurrentLecture(detailRes.data.data)
                }

            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }

        if (id && lecture_id) fetchData()
    }, [id, lecture_id, router])

    // Hàm chuyển đổi link youtube thành link embed
    const getEmbedUrl = (url?: string) => {
        if (!url) return null
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
        const match = url.match(regExp)
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`
        }
        return url
    }

    if (loading) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                <Skeleton className="w-full aspect-video rounded-2xl" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        )
    }

    const embedUrl = getEmbedUrl(currentLecture?.video_url)

    return (
        <>
            {/* Header/Back Button */}
            <div className="p-4 border-b flex items-center gap-4 bg-white sticky top-0 z-20">
                <Button variant="ghost" size="sm">
                    <Link href={`/classes/${id}/lectures`} className="flex items-center">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Quay lại danh sách
                    </Link>
                </Button>
                <div className="h-4 w-px bg-slate-200" />
                <h2 className="font-bold text-slate-800 line-clamp-1">
                    Bài {currentLecture?.lecture_number}: {currentLecture?.name}
                </h2>
            </div>

            {/* Player Area */}
            <div className="bg-black w-full aspect-video flex items-center justify-center relative shadow-2xl shrink-0">
                {embedUrl ? (
                    <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                ) : (
                    <div className="text-white/20 flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5">
                            <Play className="w-8 h-8 fill-current" />
                        </div>
                        <p className="text-sm font-medium">Video hiện chưa khả dụng</p>
                    </div>
                )}
            </div>


            {/* Content Info */}
            <div className="p-4 md:p-6 w-full">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Badge className="bg-blue-50 text-blue-600 border-none hover:bg-blue-100 uppercase font-black tracking-wider px-3 text-[10px]">
                        Lớp: {id}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500">
                        <Clock className="w-3 h-3" /> {currentLecture?.duration_time} phút
                    </Badge>
                </div>

                <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">
                    {currentLecture?.name}
                </h1>

                <div className="prose prose-slate max-w-none mb-10">
                    <p className="text-slate-600 leading-relaxed text-base md:text-lg">
                        {currentLecture?.description || "Chưa có mô tả chi tiết cho bài học này. Hãy theo dõi kỹ nội dung video để nắm bắt kiến thức tốt nhất."}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
                    {currentLecture?.document_url && currentLecture.document_url !== "test" ? (
                        <Button variant="outline" className="h-16 justify-start px-6 gap-4 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group shadow-sm rounded-xl">
                            <a href={currentLecture.document_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                                <div className="text-left">
                                    <div className="text-sm font-bold text-slate-900">Tài liệu bài giảng</div>
                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1">
                                        Xem trực tuyến <ExternalLink className="w-2.5 h-2.5" />
                                    </div>
                                </div>
                            </a>
                        </Button>
                    ) : (
                        <div className="h-16 flex items-center px-6 gap-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <FileText className="w-6 h-6 text-slate-300" />
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Không có tài liệu</div>
                        </div>
                    )}

                    <Button variant="outline" className="h-16 justify-start px-6 gap-4 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group shadow-sm rounded-xl">
                        <MessageSquare className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
                        <div className="text-left">
                            <div className="text-sm font-bold text-slate-900">Thảo luận bài giảng</div>
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Mở khung bình luận</div>
                        </div>
                    </Button>
                </div>
            </div>
        </>
    )
}