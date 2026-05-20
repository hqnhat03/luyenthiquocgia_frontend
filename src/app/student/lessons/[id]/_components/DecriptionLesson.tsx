"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DecriptionLessonProps {
  description: string;
  documentUrl?: string;
}

export default function DecriptionLesson({ description, documentUrl }: DecriptionLessonProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-5 bg-primary rounded-full"></div>
            Mô tả bài học
        </h2>
        <div 
            className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: description || "<p>Chưa có mô tả cho bài học này.</p>" }}
        />
      </div>
      
      {documentUrl && (
        <div className="pt-6 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-5 bg-primary rounded-full"></div>
                Tài liệu đính kèm
            </h2>
            <div className="flex items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-200 justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white shadow-sm rounded-lg text-primary">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 text-sm">Tài liệu bài giảng</p>
                        <p className="text-xs text-slate-500 mt-0.5">Xem hoặc tải về tài liệu đính kèm</p>
                    </div>
                </div>
                <a href={documentUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="font-semibold shadow-sm hover:text-primary hover:border-primary/50 transition-colors">
                        Mở tài liệu
                    </Button>
                </a>
            </div>
        </div>
      )}
    </div>
  );
}
