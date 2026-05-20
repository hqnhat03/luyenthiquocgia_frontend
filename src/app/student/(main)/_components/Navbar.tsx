'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navLinks = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Khóa học', href: '/courses' },
    { name: 'Giới thiệu', href: '#' },
    { name: 'Liên hệ', href: '#' },
  ];

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300 border-b",
      scrolled
        ? "bg-white/80 backdrop-blur-lg border-slate-200 shadow-sm h-16"
        : "bg-white border-slate-100 h-20"
    )}>
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-8">



        {/* Desktop Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                  isActive ? "text-blue-600" : "text-slate-600"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden items-center gap-2 md:flex">
          {!mounted ? (
            <div className="w-20" /> // Placeholder to avoid layout shift
          ) : user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="outline" className="h-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || ""} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start pr-1 text-left">
                      <span className="text-sm font-bold leading-none">{user.name}</span>
                    </div>
                    <ChevronDown className="size-3 text-muted-foreground mr-1" />
                  </Button>
                } />
                <DropdownMenuContent className="w-64 mt-1 shadow-xl border-slate-100" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1 p-2">
                        <p className="text-sm font-semibold leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="opacity-50" />
                  <DropdownMenuItem className="cursor-pointer py-2 px-3 focus:bg-primary/5 focus:text-primary transition-colors">
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-3 h-4 w-4" />
                      <span className="font-medium">Thông tin cá nhân</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer py-2 px-3 focus:bg-primary/5 focus:text-primary transition-colors">
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard className="mr-3 h-4 w-4" />
                      <span className="font-medium">Bảng điều khiển</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="opacity-50" />
                  <DropdownMenuItem
                    className="cursor-pointer py-2 px-3 text-destructive focus:bg-destructive/5 focus:text-destructive transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium">Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="font-bold text-slate-600 hover:text-slate-900 px-6">Đăng nhập</Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-full bg-blue-600 px-8 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95">
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
          {mounted && user && <NotificationBell />}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-20 left-0 w-full border-b border-slate-200 bg-white p-6 shadow-2xl md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col space-y-3">
            {mounted && user && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 mb-4 border border-slate-100">
                <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                  <AvatarImage src={user.avatar || ""} alt={user.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-lg">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-slate-900 text-lg leading-tight">{user.name}</p>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Học viên</p>
                </div>
              </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-lg font-bold text-slate-600 px-4 py-3 rounded-xl transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-4 border-t border-slate-100 mt-2">
              {mounted && user ? (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-100 bg-red-50/30 hover:bg-red-50 hover:text-red-700 justify-center h-14 rounded-2xl font-bold transition-all active:scale-95"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Đăng xuất
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                    <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-slate-200">Đăng nhập</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                    <Button className="w-full bg-blue-600 text-white h-14 rounded-2xl shadow-lg shadow-blue-200 font-bold transition-all hover:bg-blue-700 active:scale-95">
                      Tạo tài khoản mới
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
