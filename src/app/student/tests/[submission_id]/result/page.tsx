'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { studentAxios as api } from '@/api/student';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Circle,
    FileText,
    XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Choice {
    id: number;
    question_id: number;
    choice_no: number;
    content: string;
    created_at: string;
    updated_at: string;
    created_by: number;
    updated_by: number;
}

interface TestQuestion {
    id: number;
    test_id: string | number;
    question_no: string | number;
    content: string;
    correct_answer: string | number;
    created_at: string;
    updated_at: string;
    created_by: string | number;
    updated_by: string | number;
    student_choice_id: string | number | null;
    student_result: string | number; // 1 = correct, 0 = incorrect
    choices: Choice[];
}

interface SubmissionAnswer {
    id: number;
    submission_id: string | number;
    question_id: string | number;
    choice_id: string | number;
    result: string | number;
    created_at: string;
    updated_at: string;
    created_by: string | number;
    updated_by: string | number;
}

interface ResultData {
    id: number;
    test_id: number;
    student_id: number;
    score: string;
    submit_time: string;
    time_spent_in_seconds: number;
    test_title: string;
    test_start_time: string;
    test_end_time: string;
    test_duration: number;
    test_status: number;
    test_questions: TestQuestion[];
    submission_answers: SubmissionAnswer[];
}

export default function ExamResultPage() {
    const params = useParams();
    const router = useRouter();
    const submission_id = params?.submission_id as string;

    const [loading, setLoading] = useState(true);
    const [resultData, setResultData] = useState<ResultData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (!submission_id) return;

        const fetchResult = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/classes/tests/detail-result`, {
                    params: { test_submission_id: submission_id }
                });
                if (response.data?.status === 'success') {
                    setResultData(response.data.data);
                } else {
                    setError(response.data?.message || 'Không thể tải kết quả bài kiểm tra');
                }
            } catch (err: unknown) {
                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [submission_id]);

    const scrollToQuestion = (index: number) => {
        questionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 space-y-6 animate-pulse">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !resultData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-red-50 rounded-full text-red-500">
                    <AlertCircle className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Không tìm thấy kết quả</h3>
                <p className="text-slate-500 max-w-md text-center">
                    {error || 'Bài kiểm tra không tồn tại hoặc bạn chưa hoàn thành bài làm này.'}
                </p>
                <Button variant="outline" className="gap-2" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </Button>
            </div>
        );
    }

    const totalQuestions = resultData.test_questions.length;
    const correctCount = resultData.test_questions.filter(q => Number(q.student_result) === 1).length;
    const incorrectCount = totalQuestions - correctCount;

    return (
        <div className="max-w-5xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full shrink-0 h-9 w-9 hover:bg-slate-100"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                {resultData.test_title}
                            </h1>
                            <Badge className="bg-blue-50 text-blue-600 border-blue-100 border font-semibold px-2.5 py-0.5 rounded-md">
                                Đã hoàn thành
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
                            <FileText className="w-3.5 h-3.5" />
                            Kết quả chi tiết bài kiểm tra
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary strip */}
            <div className="flex items-center gap-4 mb-6 bg-white border border-slate-200 rounded-xl px-5 py-3.5 shadow-sm">
                <span className="text-sm font-medium text-slate-500">
                    Tổng số câu: <span className="font-bold text-slate-800">{totalQuestions}</span>
                </span>
                <span className="text-slate-200">|</span>
                <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {correctCount} đúng
                </span>
                <span className="text-slate-200">|</span>
                <span className="text-sm font-medium text-red-500 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> {incorrectCount} sai
                </span>
            </div>

            {/* Main layout: questions + navigator */}
            <div className="flex gap-6 items-start">
                {/* Questions list */}
                <div className="flex-1 min-w-0 space-y-4 pb-12">
                    {resultData.test_questions.map((question, index) => {
                        const isCorrect = Number(question.student_result) === 1;

                        return (
                            <div
                                key={question.id}
                                ref={el => { questionRefs.current[index] = el; }}
                                id={`question-${index}`}
                                className={cn(
                                    "bg-white rounded-xl border shadow-sm overflow-hidden transition-all scroll-mt-6",
                                    isCorrect
                                        ? "border-l-4 border-l-emerald-500 border-t-slate-200 border-r-slate-200 border-b-slate-200"
                                        : "border-l-4 border-l-red-500 border-t-slate-200 border-r-slate-200 border-b-slate-200"
                                )}
                            >
                                {/* Question Header */}
                                <div className="flex items-start justify-between gap-4 p-5 pb-3 bg-slate-50/60 border-b border-slate-100">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={cn(
                                            "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0 shadow-sm",
                                            isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                        )}>
                                            {index + 1}
                                        </div>
                                        <div
                                            className="prose prose-slate max-w-none text-slate-800 font-medium text-sm pt-1 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: question.content }}
                                        />
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold shrink-0",
                                        isCorrect
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-red-100 text-red-700"
                                    )}>
                                        {isCorrect
                                            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Đúng</>
                                            : <><XCircle className="w-3.5 h-3.5" /> Sai</>
                                        }
                                    </div>
                                </div>

                                {/* Choices — horizontal wrap */}
                                <div className="p-5 pt-4 flex flex-wrap gap-2.5">
                                    {question.choices.map((choice) => {
                                        const isStudentPick = Number(choice.id) === Number(question.student_choice_id);
                                        const isCorrectAnswer = Number(choice.choice_no) === Number(question.correct_answer);

                                        let choiceStyle = "bg-slate-50 border-slate-200 text-slate-700";
                                        let labelStyle = "bg-slate-200 text-slate-600";
                                        let icon = <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />;

                                        if (isStudentPick && isCorrectAnswer) {
                                            choiceStyle = "bg-emerald-50 border-emerald-400 text-emerald-800";
                                            labelStyle = "bg-emerald-500 text-white";
                                            icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
                                        } else if (isStudentPick && !isCorrectAnswer) {
                                            choiceStyle = "bg-red-50 border-red-400 text-red-800";
                                            labelStyle = "bg-red-500 text-white";
                                            icon = <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
                                        } else if (!isStudentPick && isCorrectAnswer) {
                                            choiceStyle = "bg-emerald-50 border-emerald-300 text-emerald-700";
                                            labelStyle = "bg-emerald-400 text-white";
                                            icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
                                        }

                                        return (
                                            <div
                                                key={choice.id}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all min-w-[140px] flex-1 basis-[calc(50%-5px)]",
                                                    choiceStyle
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold shrink-0",
                                                    labelStyle
                                                )}>
                                                    {String.fromCharCode(64 + Number(choice.choice_no))}
                                                </div>
                                                <span
                                                    className="text-sm flex-1"
                                                    dangerouslySetInnerHTML={{ __html: choice.content }}
                                                />
                                                {icon}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Bottom back button */}
                    <div className="flex justify-center pt-4">
                        <Button
                            variant="outline"
                            className="gap-2 font-semibold border-slate-200 text-slate-600 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all px-8 h-10 rounded-lg"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại danh sách bài kiểm tra
                        </Button>
                    </div>
                </div>

                {/* Question navigator — sticky sidebar */}
                <div className="hidden lg:block w-52 shrink-0 self-start sticky top-2">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Câu hỏi</p>
                        </div>
                        <div className="p-3 flex flex-wrap gap-1.5 max-h-[calc(100vh-14rem)] overflow-y-auto">
                            {resultData.test_questions.map((question, index) => {
                                const isCorrect = Number(question.student_result) === 1;
                                return (
                                    <button
                                        key={question.id}
                                        onClick={() => scrollToQuestion(index)}
                                        title={`Câu ${index + 1}`}
                                        className={cn(
                                            "w-8 h-8 rounded-md text-xs font-bold transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1",
                                            isCorrect
                                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 focus:ring-emerald-400"
                                                : "bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-400"
                                        )}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex gap-3 text-[11px] font-medium text-slate-500">
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Đúng</span>
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400" /> Sai</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}