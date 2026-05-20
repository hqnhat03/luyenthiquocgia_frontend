"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Trophy,
  User,
  Check,
  X,
  HelpCircle
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

interface Question {
  id: number;
  test_id: number;
  question_no: number;
  content: string;
  correct_answer: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  choices: Choice[];
  student_choice_id: number | null;
  result: number;
}

interface ExamResultData {
  test_title: string;
  student_name: string;
  avatar_url: string | null;
  questions: Question[];
}

interface APIResponse {
  status: string;
  message: string | null;
  data: ExamResultData;
}

const getAvatarUrl = (path?: string | null) => {
  if (!path) return undefined;
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_IMAGE_URL || "";
  if (path.startsWith("/")) {
    return `${baseUrl.replace(/\/$/, "")}${path}`;
  }
  return `${baseUrl.replace(/\/$/, "")}/${path}`;
};

export default function StudentAnswersPage() {
  const params = useParams();
  const router = useRouter();
  const { exam_id: examId, student_id: studentId } = params;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExamResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        setLoading(true);
        const response = await api.get<APIResponse>(`/teacher/class-tests/results`, {
          params: {
            test_id: examId,
            student_id: studentId
          }
        });
        if (response.data.status === "success" && response.data.data) {
          setData(response.data.data);
        } else {
          setError(response.data.message || "Không thể tải dữ liệu kết quả học sinh.");
        }
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          console.error("Error fetching student answers:", err);
          setError(err.response?.data?.message || "Đã có lỗi xảy ra khi kết nối máy chủ.");
        } else {
          setError("Lỗi không xác định khi tải dữ liệu.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (examId && studentId) {
      fetchAnswers();
    }
  }, [examId, studentId]);

  if (loading) {
    return (
      <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 md:col-span-1" />
          <Skeleton className="h-32 md:col-span-2" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive opacity-50" />
        <h2 className="text-xl font-semibold">{error || "Không tìm thấy dữ liệu"}</h2>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    );
  }

  const totalQuestions = data.questions.length;
  const correctAnswersCount = data.questions.filter(q => q.result === 1).length;
  const accuracyPercentage = totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;

  const getOptionLetter = (no: number) => {
    return String.fromCharCode(64 + no); // 1 -> A, 2 -> B, ...
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="group -ml-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Quay lại danh sách
        </Button>
        
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Kết quả bài làm
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>{data.test_title}</span>
            </p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 gap-1.5 shadow-none w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Đã hoàn thành
          </Badge>
        </div>
      </div>

      {/* Summary Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Score & Accuracy Card */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white overflow-hidden relative transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-100 text-sm font-medium uppercase tracking-wider">Tổng điểm kết quả</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">{correctAnswersCount}</span>
              <span className="text-xl text-blue-200">/ {totalQuestions} câu đúng</span>
            </div>
            <p className="text-blue-100/80 text-sm mt-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Tỉ lệ chính xác: {accuracyPercentage}%
            </p>
          </CardContent>
        </Card>

        {/* Student Profile Card */}
        <Card className="md:col-span-2 border-none shadow-md bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              Thông tin học sinh
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-slate-100 shadow-sm">
              <AvatarImage src={getAvatarUrl(data.avatar_url)} alt={data.student_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {data.student_name?.split(" ").pop()?.substring(0, 2).toUpperCase() || "HS"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-extrabold text-xl text-slate-800 dark:text-slate-100">{data.student_name}</p>
              <p className="text-sm text-muted-foreground">
                Mã học sinh: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">#{studentId}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Chi tiết đáp án từng câu</h2>
          <span className="text-sm text-muted-foreground bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            Tổng số: {totalQuestions} câu hỏi
          </span>
        </div>

        <div className="space-y-8">
          {[...data.questions]
            .sort((a, b) => a.question_no - b.question_no)
            .map((question) => {
              const isAnswered = question.student_choice_id !== null;
              const isCorrect = question.result === 1;

              return (
                <Card
                  key={question.id}
                  className={cn(
                    "border-none shadow-lg transition-all duration-300 hover:shadow-xl ring-1",
                    !isAnswered ? "ring-slate-100 dark:ring-slate-800" :
                    isCorrect ? "ring-emerald-100 dark:ring-emerald-950/20" : "ring-rose-100 dark:ring-rose-950/20"
                  )}
                >
                  <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-bold">
                          {question.question_no}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold h-6">
                          Trắc nghiệm
                        </Badge>
                        {!isAnswered ? (
                          <Badge className="bg-slate-500 hover:bg-slate-600 border-none h-6 flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" /> Chưa làm
                          </Badge>
                        ) : isCorrect ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none h-6 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Đúng
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500 hover:bg-rose-600 border-none h-6 flex items-center gap-1">
                            <X className="h-3 w-3" /> Sai
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Question Content */}
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <div
                        className="text-lg font-medium leading-relaxed text-slate-800 dark:text-slate-200 [&_img]:max-h-64 [&_img]:w-auto [&_img]:inline-block [&_img]:rounded-md [&_img]:border [&_img]:border-slate-200 dark:[&_img]:border-slate-800 [&_img]:shadow-sm"
                        dangerouslySetInnerHTML={{ __html: question.content }}
                      />
                    </div>

                    {/* Choices Grid */}
                    {question.choices && question.choices.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {[...question.choices]
                          .sort((a, b) => a.choice_no - b.choice_no)
                          .map((choice) => {
                            const isStudentChoice = choice.id === question.student_choice_id;
                            const isCorrectAnswer = choice.choice_no === question.correct_answer;

                            return (
                              <div
                                key={choice.id}
                                className={cn(
                                  "flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200",
                                  isStudentChoice && isCorrectAnswer ? "bg-emerald-50/70 border-emerald-500 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100" :
                                  isStudentChoice && !isCorrectAnswer ? "bg-rose-50/70 border-rose-500 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100" :
                                  isCorrectAnswer ? "bg-emerald-50/30 border-emerald-300 dark:bg-emerald-950/10 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 border-dashed" :
                                  "bg-slate-50/50 border-slate-100 hover:border-slate-200 dark:bg-slate-800/30 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-bold shadow-sm",
                                    isStudentChoice && isCorrectAnswer ? "border-emerald-600 text-white bg-emerald-600" :
                                    isStudentChoice && !isCorrectAnswer ? "border-rose-600 text-white bg-rose-600" :
                                    isCorrectAnswer ? "border-emerald-500 text-emerald-600 bg-white dark:bg-slate-950" :
                                    "border-slate-300 text-slate-500 bg-white dark:bg-slate-950"
                                  )}>
                                    {getOptionLetter(choice.choice_no)}
                                  </div>
                                  <span className="text-base font-medium">{choice.content}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isCorrectAnswer && (
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                      Đáp án đúng
                                    </Badge>
                                  )}
                                  {isStudentChoice && (
                                    <Badge className={cn(
                                      "border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white",
                                      isCorrect ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                                    )}>
                                      Lựa chọn
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
