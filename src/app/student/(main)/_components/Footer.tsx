import React from 'react';
import { GraduationCap, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8 mb-16">
          
          {/* Brand Col */}
          <div className="flex flex-col">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <GraduationCap size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">EduLearn</span>
            </div>
            <p className="mb-6 text-slate-500 leading-relaxed">
              Cung cấp cho người học trên toàn cầu nền giáo dục chất lượng cao, dễ tiếp cận và tiên tiến. Kiến tạo những nhà lãnh đạo tương lai.
            </p>
            <div className="flex gap-4">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h4 className="mb-6 font-bold text-slate-900">Về chúng tôi</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Thông tin công ty</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Tuyển dụng</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Báo chí & Truyền thông</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Blog của chúng tôi</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h4 className="mb-6 font-bold text-slate-900">Khóa học</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Phát triển Web</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Khoa học Dữ liệu</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Tiếp thị Kỹ thuật số</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Thiết kế UI/UX</Link></li>
            </ul>
          </div>

          {/* Links Col 3 */}
          <div>
            <h4 className="mb-6 font-bold text-slate-900">Hỗ trợ</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Trung tâm trợ giúp</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Liên hệ với chúng tôi</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Điều khoản dịch vụ</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Chính sách bảo mật</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-100 flex flex-col md:flex-row items-center justify-between pt-8 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} EduLearn. Bảo lưu mọi quyền.</p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <Link href="#" className="hover:text-slate-900">Quyền riêng tư</Link>
            <Link href="#" className="hover:text-slate-900">Điều khoản</Link>
            <Link href="#" className="hover:text-slate-900">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
