"use client"

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { studentAxios as api } from '@/api/student';
import {
    CheckCircle2,
    Play,
    PlayCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface Lecture {
    id: number
    name: string
    duration_time: number
    lecture_number: number
}

export default function WatchLayout({ children }: { children: React.ReactNode }) {
    const params = useParams()
    const id = params?.id as string
    const lecture_id = params?.lecture_id as string

    const [loading, setLoading] = useState(true)
    const [lectures, setLectures] = useState<Lecture[]>([])

    useEffect(() => {
        const fetchLectures = async () => {
            try {
                setLoading(true)
                const res = await api.get(`/classes/${id}/lectures`)
                if (res.data.success) {
                    setLectures(res.data.data)
                }
            } catch (error) {
                console.error('Error fetching list:', error)
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchLectures()
    }, [id])

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-white overflow-hidden border">
            {/* Main Content Area (Children) */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white border-r">
                {children}
            </div>

            {/* Shared Sidebar: Lesson List */}
            <div className="w-full lg:w-96 flex flex-col h-full shrink-0 overflow-hidden bg-slate-50">
                <div className="p-5 border-b bg-white flex items-center justify-between z-10 shadow-sm shrink-0">
                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-xs">
                        Nội dung bài học
                    </h3>
                    <Badge variant="secondary" className="font-black text-[10px] px-2 py-0">
                        {lectures.length} BÀI
                    </Badge>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-3 space-y-2 pb-10">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-xl" />
                            ))
                        ) : (
                            lectures.map((lecture) => {
                                const isActive = lecture.id.toString() === lecture_id
                                return (
                                    <Link
                                        key={lecture.id}
                                        href={`/classes/${id}/lectures/${lecture.id}`}
                                        className={`flex items-start gap-4 p-4 rounded-xl transition-all group border ${isActive
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                                            : 'hover:bg-white text-slate-600 border-transparent bg-transparent hover:shadow-sm'
                                            }`}
                                    >
                                        <div className={`mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-blue-500'}`}>
                                            {isActive ? <PlayCircle className="w-5 h-5 fill-current shadow-sm" /> : <CheckCircle2 className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-bold leading-tight mb-1 ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                                {lecture.lecture_number}. {lecture.name}
                                            </div>
                                            <div className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-2 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                                                <Play className="w-2.5 h-2.5 fill-current" />
                                                {lecture.duration_time} PHÚT
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
