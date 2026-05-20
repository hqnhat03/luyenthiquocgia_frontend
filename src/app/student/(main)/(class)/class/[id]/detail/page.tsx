'use client';

import { studentAxios as api } from '@/api/student';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AxiosError } from 'axios';
import {
    ArrowRight,
    Calendar,
    ChevronLeft,
    Clock,
    GraduationCap,
    Shield,
    Users,
    Video
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Teacher {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
    subject_names?: string;
}

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
}

interface Schedule {
    id: number;
    class_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
}

interface ClassDetailInfo {
    id: number;
    class_code: string;
    start_date: string;
    end_date: string;
    status: number;
    meeting_url: string;
    total_teachers: number;
    total_students: number;
    class_schedules: Schedule[];
}

interface ClassDetail {
    detail: ClassDetailInfo;
    teachers: Teacher[];
    students: Student[];
}

const getDayName = (day: number) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[day] || 'Không xác định';
};

const formatTime = (time: string) => {
    return time.split(':').slice(0, 2).join(':');
};

export default function ClassDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState<ClassDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/classes/detail?id=${id}`);
                if (response.data.status === 'success' || response.data.data) {
                    setClassData(response.data.data);
                } else {
                    setError(response.data.message || 'Không thể tải thông tin lớp học');
                }
            } catch (err: unknown) {
                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-[250px]" />
                        <Skeleton className="h-4 w-[150px]" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-[200px] rounded-xl" />
                    <Skeleton className="h-[200px] rounded-xl" />
                    <Skeleton className="h-[200px] rounded-xl" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-[400px] rounded-xl" />
                    <Skeleton className="h-[400px] rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !classData) {
        return (
            <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-red-50 rounded-full text-red-500">
                    <Shield className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Không tìm thấy thông tin</h3>
                <p className="text-slate-500 max-w-md text-center">
                    {error || 'Lớp học không tồn tại hoặc bạn không có quyền truy cập.'}
                </p>
                <Link href="/classes">
                    <Button variant="outline" className="gap-2">
                        <ChevronLeft className="w-4 h-4" /> Quay lại danh sách
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-2 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumb & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            Chi tiết lớp học
                            <Badge
                                className={`rounded-full px-3 py-0.5 text-[11px] font-semibold border-none shadow-sm pointer-events-none ${classData.detail.status === 2
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-400 text-white'
                                    }`}
                            >
                                {classData.detail.status === 2 ? 'Đang học' : 'Đã kết thúc'}
                            </Badge>
                        </h1>
                        <p className="text-slate-500 flex items-center gap-2 mt-1">
                            Mã lớp: <span className="font-mono font-medium text-indigo-600">{classData.detail.class_code}</span>
                        </p>
                    </div>
                </div>

                {classData.detail.meeting_url && (
                    <a href={classData.detail.meeting_url} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 gap-2 h-11 px-6 rounded-lg transition-all hover:scale-105 active:scale-95">
                            <Video className="w-5 h-5" />
                            Vào phòng học trực tuyến
                        </Button>
                    </a>
                )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Thời gian bắt đầu', value: new Date(classData.detail.start_date).toLocaleDateString('vi-VN'), icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Thời gian kết thúc', value: new Date(classData.detail.end_date).toLocaleDateString('vi-VN'), icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Sĩ số học sinh', value: `${classData.detail.total_students} học sinh`, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Đội ngũ giáo viên', value: `${classData.detail.total_teachers} giáo viên`, icon: GraduationCap, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat, idx) => (
                    <Card key={idx} className="border-none shadow-sm bg-white/50 backdrop-blur-sm hover:shadow-md transition-all group">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[12px] font-medium text-slate-500">{stat.label}</p>
                                    <p className="text-base font-bold text-slate-900">{stat.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Schedule & Course Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Schedule Section */}
                    <Card className="border-none shadow-xl shadow-slate-100 overflow-hidden rounded-xl">
                        <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-slate-50 py-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Calendar className="w-5 h-5 text-indigo-500" />
                                    Lịch học định kỳ
                                </CardTitle>
                            </div>
                            <CardDescription className="text-xs">Các ca học cố định trong tuần của lớp</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {classData.detail.class_schedules.length > 0 ? (
                                    classData.detail.class_schedules.map((session) => (
                                        <div key={session.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-center justify-center w-12 h-12 bg-white border border-slate-100 rounded-lg shadow-sm shrink-0">
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Thứ</span>
                                                    <span className="text-lg font-bold text-indigo-600 leading-none">
                                                        {session.day_of_week === 0 ? 'CN' : session.day_of_week + 1}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{getDayName(session.day_of_week)}</p>
                                                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span className="flex items-center gap-1 font-medium text-xs">
                                                            {formatTime(session.start_time)}
                                                            <ArrowRight className="w-3 h-3 mx-0.5" />
                                                            {formatTime(session.end_time)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 rounded-md px-2 py-0.5 text-[10px]">
                                                Online
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-slate-400 italic text-sm">
                                        Chưa có lịch học được cập nhật.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Students Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pl-1">
                            <Users className="w-5 h-5 text-emerald-500" />
                            Danh sách học sinh ({classData.detail.total_students})
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {classData.students.map((student) => (
                                <Card key={student.id} className="p-0 border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white/80 backdrop-blur-sm shrink-0 w-fit">
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-slate-100">
                                            <AvatarImage src={student.avatar_url || ''} alt={`${student.last_name} ${student.first_name}`} />
                                            <AvatarFallback className="bg-slate-100 text-slate-500 text-xs">{student.first_name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="whitespace-nowrap">
                                            <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">{`${student.last_name} ${student.first_name}`}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Teachers & Resources */}
                <div className="space-y-6">
                    {/* Teachers Card */}
                    <Card className="border-none shadow-xl shadow-slate-100 rounded-xl">
                        <CardHeader className="pb-2 py-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-indigo-500" />
                                Đội ngũ giáo viên
                            </CardTitle>
                            <CardDescription className="text-xs">Giảng dạy và hướng dẫn lớp</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {classData.teachers.map((teacher) => (
                                <div key={teacher.id} className="flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                                    <div className="relative">
                                        <Avatar className="h-10 w-10 border-2 border-indigo-100 group-hover:border-indigo-300 transition-colors">
                                            <AvatarImage src={teacher.avatar_url || ''} alt={`${teacher.last_name} ${teacher.first_name}`} />
                                            <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">{teacher.first_name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{`${teacher.last_name} ${teacher.first_name}`}</p>
                                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}