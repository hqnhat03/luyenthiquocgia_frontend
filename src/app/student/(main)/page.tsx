'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { commonAxios as api } from '@/api/common';
import {
  ArrowRight,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  GraduationCap,
  Laptop,
  Loader2,
  ShieldCheck,
  Star,
  Users
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface CourseTeacher {
  id: number;
  name: string;
  avatar_url: string | null;
}

interface CommonCourse {
  id: number;
  subject_level_id: number;
  name: string;
  title: string;
  image_url: string;
  target_student: number;
  total_lessons: number;
  total_hours: number;
  subject_level: string;
  subject_name: string;
  teachers: string | null;
}

// --- MOCK DATA ---

// const COURSES = [...] (Removed mock data)

// --- TYPES ---

interface Subject {
  id: number;
  name: string;
  category: string;
  education_level: string;
  target_student: number;
}

interface TeacherData {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  introduction: string | null;
  target_student: number;
  teaching_subjects: Subject[];
}

// --- COMPONENTS ---

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-50 pt-20 pb-24 lg:pt-32 lg:pb-36">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-100/50 mix-blend-multiply blur-3xl"></div>
      <div className="absolute top-1/2 right-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-indigo-100/40 mix-blend-multiply blur-3xl"></div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

          {/* Left Content */}
          <div className="relative z-10 max-w-2xl text-center lg:text-left">
            <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 px-4 py-1.5 rounded-full text-sm font-medium">
              Gia nhập cùng 100.000+ học viên trên toàn cầu
            </Badge>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 md:text-6xl lg:leading-[1.1]">
              Học Bất cứ điều gì, <span className="text-blue-600">Bất cứ lúc nào</span>, Bất cứ đâu
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-slate-600 md:text-xl">
              Khai phá tiềm năng của bạn với các khóa học đẳng cấp thế giới được giảng dạy bởi các chuyên gia trong ngành. Xây dựng kỹ năng cần thiết cho tương lai, ngay hôm nay.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Button size="lg" className="h-14 w-full rounded-full bg-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl sm:w-auto">
                Bắt đầu ngay
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 w-full rounded-full border-slate-200 px-8 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto">
                Khám phá Khóa học
              </Button>
            </div>

            <div className="mt-10 flex items-center justify-center gap-4 text-sm text-slate-500 lg:justify-start">
              <div className="flex -space-x-3">
                <Image className="rounded-full border-2 border-slate-50" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" alt="Student" width={40} height={40} />
                <Image className="rounded-full border-2 border-slate-50" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150" alt="Student" width={40} height={40} />
                <Image className="rounded-full border-2 border-slate-50" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" alt="Student" width={40} height={40} />
              </div>
              <p>Được tin tưởng với mức đánh giá <span className="font-semibold text-slate-900">4.9/5</span></p>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative z-10 hidden lg:block">
            <div className="relative rounded-3xl bg-white p-2 shadow-2xl h-[516px]">
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop"
                alt="Students learning"
                className="rounded-2xl object-cover shadow-inner"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />

              {/* Floating Element */}
              <div className="absolute -left-12 bottom-20 flex animate-bounce items-center gap-4 rounded-2xl bg-white p-4 shadow-xl xl:-left-16" style={{ animationDuration: '3s' }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Được Chứng nhận</p>
                  <p className="text-sm text-slate-500">Giảng viên Chuyên gia</p>
                </div>
              </div>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 rounded-3xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: 'Giảng viên Chuyên gia',
      description: 'Học hỏi từ các chuyên gia trong ngành với nhiều năm kinh nghiệm thực tế và kiến thức chuyên sâu.'
    },
    {
      icon: <Laptop className="h-6 w-6 text-indigo-600" />,
      title: 'Học tập Linh hoạt',
      description: 'Học theo nhịp độ của riêng bạn, từ bất cứ đâu, trên bất kỳ thiết bị nào. Lịch trình của bạn, quy tắc của bạn.'
    },
    {
      icon: <DollarSign className="h-6 w-6 text-emerald-600" />,
      title: 'Giá cả Phải chăng',
      description: 'Giáo dục chất lượng cao nên được tiếp cận bởi tất cả mọi người. Chúng tôi cung cấp mức giá rất cạnh tranh.'
    },
    {
      icon: <Award className="h-6 w-6 text-accent-600 text-purple-600" />,
      title: 'Chứng nhận',
      description: 'Nhận chứng chỉ danh giá sau khi hoàn thành để thể hiện kỹ năng của bạn với các nhà tuyển dụng.'
    }
  ];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Tại sao chọn EduLearn?</h2>
          <p className="mt-4 text-lg text-slate-600">Mọi thứ bạn cần để thành thạo các kỹ năng mới và thăng tiến trong sự nghiệp.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((item, index) => (
            <Card key={index} className="group border-slate-100 bg-white transition-all hover:-translate-y-1 hover:shadow-lg hover:border-blue-100">
              <CardContent className="p-8">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-blue-50">
                  {item.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoursesSection() {
  const [courses, setCourses] = useState<CommonCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/common/courses', {
          params: { target_student: 0 }
        });
        if (response.data.status === 'success' || response.data.success) {
          setCourses(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const getAvatarUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_IMAGE_URL || ''}${url}`;
  };

  const parseTeachers = (teachersStr: string | null): CourseTeacher[] => {
    if (!teachersStr) return [];
    return teachersStr.split(',').map(item => {
      const parts = item.trim().split('|');
      return {
        id: parseInt(parts[0], 10),
        name: parts[1] || '',
        avatar_url: parts[2] || null
      };
    });
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth
        : scrollLeft + clientWidth;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Khóa Học Nổi Bật</h2>
            <p className="mt-4 text-lg text-slate-600">Khám phá các khóa học chất lượng cao của chúng tôi, được tuyển chọn kỹ lưỡng cho học sinh.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className="h-12 w-12 rounded-full border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className="h-12 w-12 rounded-full border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="relative">
            {/* Custom CSS to hide scrollbar */}
            <style>{`
              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
            
            <div
              ref={scrollContainerRef}
              className="no-scrollbar flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
            >
              {courses.map((course) => {
                const parsedTeachers = parseTeachers(course.teachers);
                return (
                  <div
                    key={course.id}
                    className="w-full sm:w-[calc(50%-16px)] lg:w-[calc(25%-24px)] shrink-0 snap-start"
                  >
                    <Link href={`/courses/${course.id}`}>
                      <Card className="group flex h-full cursor-pointer flex-col overflow-hidden border-slate-100 bg-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 rounded-2xl">
                        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                          <Image
                            src={getAvatarUrl(course.image_url)}
                            alt={course.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <Badge className="absolute left-4 top-4 bg-white text-slate-900 hover:bg-slate-50 shadow-sm font-semibold border border-slate-100">
                            {course.subject_level}
                          </Badge>
                          <div className="absolute inset-0 bg-slate-900/10 transition-opacity group-hover:opacity-0" />
                        </div>

                        <CardContent className="flex flex-1 flex-col p-6">
                          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                            <span className="font-bold text-indigo-600 uppercase tracking-wider">{course.subject_name}</span>
                            <div className="flex items-center gap-1.5 font-medium">
                              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-700">{course.total_lessons}</span>
                              <span>bài học</span>
                            </div>
                          </div>

                          <h3 className="mb-2 line-clamp-2 text-base font-extrabold leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {course.name}
                          </h3>
                          
                          <p className="mb-4 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                            {course.title}
                          </p>

                          <div className="mb-6 flex items-center gap-2 mt-auto">
                            <div className="flex -space-x-2">
                              {parsedTeachers.slice(0, 3).map((teacher) => (
                                <Avatar key={teacher.id} className="h-6 w-6 border-2 border-white">
                                  <AvatarImage src={getAvatarUrl(teacher.avatar_url)} alt={teacher.name} className="object-cover" />
                                  <AvatarFallback className="text-[8px] bg-slate-100 font-extrabold">{teacher.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <p className="text-xs text-slate-600 truncate max-w-[150px]">
                              {parsedTeachers.length > 0
                                ? parsedTeachers.map(t => t.name).join(', ')
                                : 'Giảng viên hệ thống'
                              }
                            </p>
                          </div>

                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Đang tuyển sinh</span>
                            <p className="text-xs font-semibold text-blue-600 group-hover:underline">Chi tiết</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-12 text-center md:hidden">
          <Button variant="outline" className="w-full border-slate-200 text-slate-700">
            Xem Tất cả Khóa học
          </Button>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Đăng ký',
      description: 'Tạo tài khoản miễn phí chỉ trong vài giây và truy cập ngay vào nền tảng của chúng tôi.'
    },
    {
      number: '02',
      title: 'Chọn Khóa học',
      description: 'Duyệt qua danh mục mở rộng của chúng tôi và tìm khóa học hoàn hảo cho mục tiêu của bạn.'
    },
    {
      number: '03',
      title: 'Bắt đầu Học',
      description: 'Theo dõi chương trình học có cấu trúc, hoàn thành các dự án thực tế và đạt được thành công.'
    }
  ];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Cách thức Hoạt động</h2>
          <p className="mt-4 text-lg text-slate-600">Hành trình đến với sự thành thạo qua 3 bước đơn giản</p>
        </div>

        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          {/* Connecting line for desktop */}
          <div className="absolute top-12 left-[16%] hidden w-[68%] border-t-2 border-dashed border-slate-200 md:block"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 border-8 border-white text-3xl font-extrabold text-blue-600 shadow-sm">
                {step.number}
              </div>
              <h3 className="mb-3 text-2xl font-bold text-slate-900">{step.title}</h3>
              <p className="text-slate-600 max-w-[280px] mx-auto leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeachersSection() {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await api.get('/common/teachers', {
          params: { target_student: 0 }
        });
        if (response.data.status === 'success' || response.data.success) {
          setTeachers(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const getAvatarUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_IMAGE_URL || ''}${url}`;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth
        : scrollLeft + clientWidth;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 px-4 py-1.5 rounded-full text-sm font-semibold">
              Đội ngũ Giảng viên
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Giáo Viên Tiêu Biểu Hàng Đầu
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Học tập cùng đội ngũ giảng viên giàu kinh nghiệm, tận tâm kiến tạo tương lai và truyền cảm hứng chinh phục đỉnh cao tri thức.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className="h-12 w-12 rounded-full border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className="h-12 w-12 rounded-full border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
            <GraduationCap className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Chưa có giáo viên nào</h3>
            <p className="mt-2 text-sm text-slate-500">Danh sách giảng viên đang được cập nhật liên tục.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Custom CSS to hide scrollbar */}
            <style>{`
              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>

            <div
              ref={scrollContainerRef}
              className="no-scrollbar flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
            >
              {teachers.map((teacher) => {
                const fullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
                return (
                  <div
                    key={teacher.id}
                    className="w-full sm:w-[calc(50%-16px)] lg:w-[calc(33.333%-21.333px)] shrink-0 snap-start"
                  >
                    <Card
                      className="group flex flex-col justify-between overflow-hidden border-slate-100 bg-white p-2 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-indigo-100 rounded-3xl h-full"
                    >
                      <CardContent className="flex flex-1 flex-col p-6">
                        {/* Header: Avatar & Name */}
                        <div className="flex items-start gap-4 mb-6">
                          <Avatar className="h-16 w-16 border-2 border-slate-100 ring-2 ring-indigo-50/50 shadow-sm transition-all group-hover:scale-105 group-hover:ring-indigo-100 group-hover:border-indigo-200">
                            <AvatarImage src={getAvatarUrl(teacher.avatar_url)} alt={fullName} className="object-cover" />
                            <AvatarFallback className="bg-indigo-50 text-indigo-600 font-extrabold text-xl animate-pulse">
                              {fullName.charAt(0) || 'GV'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1 flex-1">
                            <h3 className="text-lg font-extrabold text-slate-900 transition-colors group-hover:text-indigo-600">
                              {fullName}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                              <Award className="h-3.5 w-3.5 text-amber-500" />
                              <span>Giảng viên Chuyên nghiệp</span>
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-slate-100 w-full mb-6"></div>

                        {/* Body: Introduction */}
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-3">
                            <span className="text-slate-400 text-3xl font-serif leading-none">“</span>
                            <div
                              className="text-sm leading-relaxed text-slate-600 line-clamp-4 prose prose-slate max-w-none pt-1"
                              dangerouslySetInnerHTML={{
                                __html: teacher.introduction || '<em>Chưa có giới thiệu chi tiết.</em>'
                              }}
                            />
                          </div>
                        </div>

                        {/* Footer: Teaching Subjects */}
                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Môn học phụ trách</span>
                          </p>
                          {teacher.teaching_subjects && teacher.teaching_subjects.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {teacher.teaching_subjects.map((subject) => {
                                const isNatural = subject.category === 'Tự nhiên';
                                return (
                                  <Badge
                                    key={subject.id}
                                    variant="secondary"
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                      isNatural
                                        ? 'bg-blue-50/60 text-blue-700 border-blue-200/50 hover:bg-blue-100/60'
                                        : 'bg-emerald-50/60 text-emerald-700 border-emerald-200/50 hover:bg-emerald-100/60'
                                    }`}
                                  >
                                    {subject.name} • {subject.education_level}
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chưa đăng ký môn học</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 px-6 py-20 text-center shadow-2xl md:px-16 md:py-24">
        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl"></div>

        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Bắt đầu Học ngay Hôm nay
          </h2>
          <p className="mb-10 text-lg text-blue-100 md:text-xl md:px-8">
            Gia nhập cùng hàng ngàn học viên thành công và bắt đầu hành trình hướng tới một tương lai tươi sáng hơn. Khóa học đầu tiên của bạn chỉ cách một cú nhấp chuột.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-14 w-full rounded-full bg-white px-10 text-lg font-bold text-blue-700 shadow-xl transition-transform hover:-translate-y-1 hover:bg-slate-50 sm:w-auto">
              Tham gia Ngay
            </Button>
            <p className="mt-4 text-sm font-medium text-blue-200 sm:mt-0 sm:ml-4">
              Không yêu cầu thẻ tín dụng
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}



export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <CoursesSection />
      <HowItWorksSection />
      <TeachersSection />
      <CtaSection />
    </main>
  );
}
