"use client"

import { usePathname } from 'next/navigation';
import React from 'react';
import { Footer } from './_components/Footer';
import { Navbar } from './_components/Navbar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Chỉ ẩn Header/Footer khi đang ở trang xem chi tiết bài giảng (có lecture_id)
  // Ví dụ: .../lectures/123 -> ẩn, .../lectures -> hiện
  const isLectureWatchPage = pathname?.match(/\/lectures\/.+/);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {!isLectureWatchPage && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      {!isLectureWatchPage && <Footer />}
    </div>
  );
}

