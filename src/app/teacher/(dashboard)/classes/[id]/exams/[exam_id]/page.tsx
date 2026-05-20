"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import { useExamStore } from "@/store/exam-store";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowUpDown, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";

interface Teacher {
    id: number;
    first_name: string;
    last_name: string;
}

interface TestDetail {
    id: number;
    title: string;
    duration: number;
    start_time: string;
    end_time: string;
    status: number;
    created_by: number;
    course_name: string;
    class_code: string;
    teacher: Teacher;
}

interface StudentExamResult {
    student_id: number;
    student_name: string;
    time_spent: string | null;
    submit_time: string | null;
    score: string | null; // e.g., "0/3"
    correct_answers: number;
}

interface ClassTestDetailResponse {
    status: string;
    message: string | null;
    data: {
        test: TestDetail;
        students: StudentExamResult[];
    };
}

export default function ExamStudentsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.exam_id;
    const classId = params.id;
    const { setCurrentStudentName } = useExamStore();

    const [loading, setLoading] = useState(true);
    const [test, setTest] = useState<TestDetail | null>(null);
    const [students, setStudents] = useState<StudentExamResult[]>([]);
    
    // Sorting states
    const [sortField, setSortField] = useState<"student_name" | "time_spent" | "score" | "submit_time" | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    useEffect(() => {
        const fetchClassTestDetails = async () => {
            try {
                setLoading(true);
                const response = await api.get<ClassTestDetailResponse>(`/teacher/class-tests/for-class/detail`, {
                    params: { id: examId }
                });
                if (response.data.status === "success" && response.data.data) {
                    setTest(response.data.data.test);
                    setStudents(response.data.data.students || []);
                }
            } catch (error) {
                console.error("Error fetching class test details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (examId) {
            fetchClassTestDetails();
        }
    }, [examId]);

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), "dd/MM/yyyy • HH:mm", { locale: vi });
        } catch {
            return dateStr;
        }
    };

    const getScorePercentage = (scoreStr: string | null) => {
        if (!scoreStr) return -1;
        const parts = scoreStr.split("/");
        const achieved = parseFloat(parts[0]) || 0;
        const total = parts[1] ? parseFloat(parts[1]) : 1;
        return total > 0 ? achieved / total : 0;
    };

    const handleSort = (field: "student_name" | "time_spent" | "score" | "submit_time") => {
        if (sortField === field) {
            setSortDirection(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedStudents = useMemo(() => {
        if (!sortField) return students;

        return [...students].sort((a, b) => {
            let valA: any = "";
            let valB: any = "";

            if (sortField === "student_name") {
                valA = a.student_name.toLowerCase();
                valB = b.student_name.toLowerCase();
            } else if (sortField === "time_spent") {
                valA = a.time_spent || "";
                valB = b.time_spent || "";
            } else if (sortField === "score") {
                valA = getScorePercentage(a.score);
                valB = getScorePercentage(b.score);
            } else if (sortField === "submit_time") {
                valA = a.submit_time || "";
                valB = b.submit_time || "";
            }

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [students, sortField, sortDirection]);

    if (loading) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-10 w-96" />
                </div>
                <Skeleton className="h-[250px] w-full rounded-lg" />
                <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Back Button */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="group -ml-2 text-muted-foreground hover:text-foreground font-medium"
                >
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Quay lại lớp học
                </Button>
            </div>

            {test && (
                <Card className="border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                    {/* Blue Card Header */}
                    <div className="bg-[#f0f7ff] px-6 py-4 border-b border-slate-200">
                        <h3 className="text-[#1d4ed8] font-medium text-base">Thông tin bài kiểm tra</h3>
                    </div>

                    {/* Table-like List Rows */}
                    <div className="divide-y divide-slate-100">
                        {/* Responsible Teacher Row */}
                        <div className="grid grid-cols-12 px-6 py-3.5 items-center">
                            <div className="col-span-3 md:col-span-2 text-slate-700 text-sm font-normal">
                                Giáo viên giao bài
                            </div>
                            <div className="col-span-9 md:col-span-10 text-slate-800 text-sm font-normal">
                                {test.teacher.first_name} {test.teacher.last_name}
                            </div>
                        </div>

                        {/* Test Duration Row */}
                        <div className="grid grid-cols-12 px-6 py-3.5 items-center">
                            <div className="col-span-3 md:col-span-2 text-slate-700 text-sm font-normal">
                                Thời gian làm bài
                            </div>
                            <div className="col-span-9 md:col-span-10 text-slate-800 text-sm font-normal">
                                {test.duration}
                            </div>
                        </div>

                        {/* Start Time Row */}
                        <div className="grid grid-cols-12 px-6 py-3.5 items-center">
                            <div className="col-span-3 md:col-span-2 text-slate-700 text-sm font-normal">
                                Thời gian bắt đầu
                            </div>
                            <div className="col-span-9 md:col-span-10 text-slate-800 text-sm font-normal">
                                {formatDate(test.start_time)}
                            </div>
                        </div>

                        {/* End Time Row */}
                        <div className="grid grid-cols-12 px-6 py-3.5 items-center">
                            <div className="col-span-3 md:col-span-2 text-slate-700 text-sm font-normal">
                                Thời gian kết thúc
                            </div>
                            <div className="col-span-9 md:col-span-10 text-slate-800 text-sm font-normal">
                                {formatDate(test.end_time)}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Students List Table Container */}
            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#f8fafc] border-b border-slate-200">
                            {/* Column Header: Rank */}
                            <th className="px-6 py-3.5 text-center text-sm font-medium text-slate-500 w-24">
                                Hạng
                            </th>

                            {/* Column Header: Student Name */}
                            <th 
                                className="px-6 py-3.5 text-left text-sm font-medium text-slate-500 cursor-pointer select-none group hover:text-slate-800 transition-colors"
                                onClick={() => handleSort("student_name")}
                            >
                                <div className="flex items-center gap-1">
                                    <span>Học sinh</span>
                                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                </div>
                            </th>

                            {/* Column Header: Time Spent */}
                            <th 
                                className="px-6 py-3.5 text-center text-sm font-medium text-slate-500 cursor-pointer select-none group hover:text-slate-800 transition-colors"
                                onClick={() => handleSort("time_spent")}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <span>Thời gian làm bài</span>
                                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                </div>
                            </th>

                            {/* Column Header: Result/Score */}
                            <th 
                                className="px-6 py-3.5 text-center text-sm font-medium text-slate-500 cursor-pointer select-none group hover:text-slate-800 transition-colors"
                                onClick={() => handleSort("score")}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <span>Kết quả</span>
                                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                </div>
                            </th>

                            {/* Column Header: Submit Time */}
                            <th 
                                className="px-6 py-3.5 text-center text-sm font-medium text-slate-500 cursor-pointer select-none group hover:text-slate-800 transition-colors"
                                onClick={() => handleSort("submit_time")}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <span>Nộp bài lúc</span>
                                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                </div>
                            </th>

                            {/* Column Header: Action */}
                            <th className="px-6 py-3.5 text-center text-sm font-medium text-slate-500 w-40">
                                Tùy chỉnh
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedStudents.length > 0 ? (
                            sortedStudents.map((student, index) => (
                                <tr key={student.student_id} className="hover:bg-slate-50/50 transition-colors">
                                    {/* Column: Rank */}
                                    <td className="px-6 py-4 text-center text-sm text-slate-800 font-normal">
                                        {index + 1}
                                    </td>

                                    {/* Column: Student Name */}
                                    <td className="px-6 py-4 text-left text-sm text-slate-800 font-normal">
                                        {student.student_name}
                                    </td>

                                    {/* Column: Time Spent */}
                                    <td className="px-6 py-4 text-center text-sm text-slate-800 font-normal">
                                        {student.submit_time && student.time_spent ? student.time_spent : "--"}
                                    </td>

                                    {/* Column: Score */}
                                    <td className="px-6 py-4 text-center text-sm text-slate-800 font-normal">
                                        {student.submit_time ? student.score : "--"}
                                    </td>

                                    {/* Column: Submit Time */}
                                    <td className="px-6 py-4 text-center text-sm text-slate-800 font-normal">
                                        {student.submit_time ? formatDate(student.submit_time) : "--"}
                                    </td>

                                    {/* Column: Action Button */}
                                    <td className="px-6 py-4 text-center">
                                        <Button
                                            className="bg-[#1d4ed8] hover:bg-blue-700 text-white font-medium text-sm px-5 py-1.5 rounded-md transition-colors h-auto shadow-sm"
                                            disabled={!student.submit_time}
                                            onClick={() => {
                                                setCurrentStudentName(student.student_name);
                                                router.push(`/teacher/classes/${classId}/exams/${examId}/students/${student.student_id}/answers`);
                                            }}
                                        >
                                            Chi tiết
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                                    Chưa có học sinh nào trong lớp làm bài kiểm tra.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
