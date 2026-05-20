'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { studentAxios as api } from '@/api/student';
import { AxiosError } from 'axios';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Send,
  Timer
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Interface definitions
interface Choice {
  id: number;
  question_id: number;
  choice_no: number;
  content: string;
}

interface Question {
  id: number;
  test_id: number;
  question_no: number;
  content: string;
  choices: Choice[];
}

interface TestInfo {
  id: number;
  title: string;
  teacher_first_name: string;
  teacher_last_name: string;
  duration: number;
  start_time: string;
  end_time: string;
  status: number;
  test_submission_id: number;
  submission_status: number;
}

interface TestAttempt {
  id: number;
  test_id: number;
  student_id: number;
  submit_time: string | null;
  score: string;
  time_spent_in_seconds: number;
}

interface ExamResponse {
  status: string;
  message: string | null;
  data: {
    test_info: TestInfo;
    test_attempt: TestAttempt;
    question_list: Question[];
  };
}

const CustomProgress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`h-1.5 w-full bg-slate-100 rounded-full overflow-hidden ${className}`}>
    <div
      className="h-full bg-primary transition-all duration-700 ease-in-out"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

export default function ExamQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.exam_id;

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<ExamResponse['data'] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        const response = await api.get<ExamResponse>(`/classes/tests/attempt?test_id=${examId}`);
        if (response.data.status === 'success') {
          const innerData = response.data.data as unknown as { status?: string; message?: string; data?: [] };
          // Handle nested error: { status: "success", data: { status: "error", message: "...", data: [] } }
          if (innerData?.status === 'error') {
            setErrorMessage(innerData.message || 'Không thể truy cập bài kiểm tra.');
            return;
          }
          setExamData(response.data.data);
          setTimeLeft(response.data.data.test_info.duration * 60);
          const savedAnswers = localStorage.getItem(`exam_answers_${examId}`);
          if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
        } else {
          setErrorMessage((response.data as unknown as { message?: string }).message || 'Không thể tải bài kiểm tra.');
        }
      } catch (error) {
        console.error('Failed to fetch exam questions:', error);
        toast.error('Không thể tải bộ câu hỏi.');
        setErrorMessage('Đã có lỗi xảy ra. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    if (examId) fetchExamData();
  }, [examId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (examData && !loading) handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, examData, loading]);

  useEffect(() => {
    if (examId && Object.keys(answers).length > 0) {
      localStorage.setItem(`exam_answers_${examId}`, JSON.stringify(answers));
    }
  }, [answers, examId]);

  const handleAnswerChange = (questionId: number, choiceId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }));
  };

  const scrollToQuestion = (id: number) => {
    setActiveQuestionId(id);
    document.getElementById(`question-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmit = async () => {
    if (!examData) return;
    setIsSubmitting(true);

    const endpoint = `/classes/tests/submit`;
    const payload = {
      test_submission_id: examData.test_attempt.id,
      submission_answers: Object.entries(answers).map(([qId, cId]) => ({
        question_id: Number(qId),
        choice_id: cId,
      })),
    };

    console.group('🚀 [SUBMITTING EXAM]');
    console.log('📍 URL:', endpoint);
    console.log('📦 Body:', payload);
    console.groupEnd();

    try {
      const response = await api.post(endpoint, payload);

      if (response.data.status === 'success') {
        toast.success(response.data.message || 'Nộp bài thành công!');
        localStorage.removeItem(`exam_answers_${examId}`);
        // router.push(`/student/exams/${examId}/result`);
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra khi nộp bài.');
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi nộp bài. Vui lòng kiểm tra lại kết nối.');
      }
    } finally {
      setIsSubmitting(false);
      setIsSubmitDialogOpen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = useMemo(() => {
    if (!examData) return 0;
    return (Object.keys(answers).length / examData.question_list.length) * 100;
  }, [answers, examData]);

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-500">Đang tải...</div>;

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4">
        <div className="text-5xl">⏳</div>
        <h2 className="text-xl font-bold text-slate-700">{errorMessage}</h2>
        <p className="text-sm text-slate-400">Vui lòng quay lại và thử lại sau.</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-2 rounded-xl px-6">
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
      </div>
    );
  }

  if (!examData) return null;

  return (
    <div className="flex flex-col h-screen bg-[#fdfdfd] overflow-hidden">
      {/* Mini Header */}
      <header className="h-14 border-b bg-white px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-sm font-bold truncate max-w-[200px]">{examData.test_info.title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border font-mono font-bold ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-700'
            }`}>
            <Timer className="w-4 h-4" />
            <span className="text-base">{formatTime(timeLeft)}</span>
          </div>
          <Button size="sm" onClick={() => setIsSubmitDialogOpen(true)} className="rounded-lg h-9 px-4 font-bold">
            <Send className="w-3.5 h-3.5 mr-2" />
            Nộp bài
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col items-center">
          <div className="w-full max-w-3xl space-y-6">
            <div className="space-y-1.5 sticky top-0 bg-[#fdfdfd] z-10 py-2 border-b">
              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                <span>TIẾN ĐỘ: {Math.round(progress)}%</span>
                <span>{Object.keys(answers).length}/{examData.question_list.length} CÂU</span>
              </div>
              <CustomProgress value={progress} />
            </div>

            <div className="space-y-6">
              {examData.question_list.map((q) => (
                <Card key={q.id} id={`question-${q.id}`} className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
                  <div className="p-5 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold text-sm">
                        {q.question_no}
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div
                        className="text-base md:text-lg font-medium text-slate-800 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: q.content }}
                      />

                      <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
                        {q.choices?.map((choice, idx) => {
                          const isSelected = answers[q.id] === choice.id;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleAnswerChange(q.id, choice.id)}
                              className={`flex items-center gap-2.5 px-3 py-2 -ml-3 rounded-xl transition-all ${isSelected
                                ? 'text-primary bg-primary/5 font-bold'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {isSelected ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[10px] font-bold">{String.fromCharCode(65 + idx)}</span>}
                              </div>
                              <span className="text-sm">{choice.content}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-center items-center py-6">
              <Button onClick={() => setIsSubmitDialogOpen(true)} className="h-12 rounded-xl px-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                Nộp bài
              </Button>
            </div>
          </div>
        </main>

        {/* Compact Sidebar */}
        <aside className={`w-64 border-l bg-white flex flex-col shrink-0 transition-all ${isSidebarOpen ? '' : 'hidden'}`}>
          <div className="p-3 border-b bg-slate-50/30">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách câu hỏi</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 grid grid-cols-6 gap-1.5">
              {examData.question_list.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = activeQuestionId === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => scrollToQuestion(q.id)}
                    className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition-all border ${isCurrent ? 'bg-primary border-primary text-white shadow-md' :
                      isAnswered ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                        'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                      }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
          <div className="p-3 bg-slate-50 border-t space-y-3">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">ĐÃ LÀM:</span>
              <span className="text-emerald-600">{Object.keys(answers).length}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">CÒN LẠI:</span>
              <span className="text-red-400">{examData.question_list.length - Object.keys(answers).length}</span>
            </div>
            <Button variant="ghost" className="w-full justify-start h-8 px-2 text-[10px] font-bold text-red-500 hover:bg-red-50" onClick={() => router.push('/dashboard')}>
              <LogOut className="w-3.5 h-3.5 mr-2" /> THOÁT PHÒNG THI
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận nộp bài?</DialogTitle>
            <DialogDescription>
              {Object.keys(answers).length < examData.question_list.length ? 'Bạn chưa làm hết các câu hỏi. ' : ''}
              Bạn có chắc muốn kết thúc phần thi?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)} className="flex-1 rounded-xl">Hủy</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 rounded-xl">{isSubmitting ? 'Đang nộp...' : 'Đồng ý'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
