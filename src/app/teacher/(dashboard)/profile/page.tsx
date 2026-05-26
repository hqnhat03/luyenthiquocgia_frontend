"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/axios"
import { useAuthStore } from "@/store/auth-store"
import { BookOpen, Briefcase, Calendar, Flag, GraduationCap, Mail, MapPin, Phone, Shield, User, Users } from "lucide-react"
import Link from "next/link"
import * as React from "react"

interface TeacherProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  tel: string;
  birth_date: string;
  address: string;
  nantionality: string;
  experience_years: number;
  introduction: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  target_student: string;
}


export default function TeacherProfilePage() {
  const { user: authUser } = useAuthStore()
  const [profile, setProfile] = React.useState<TeacherProfile | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/teacher/profile');
        if (response.data?.status === 'success' || response.data?.success) {
          setProfile(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (!authUser || loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 px-4 md:px-0 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Đang tải thông tin...</p>
      </div>
    )
  }

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : authUser.name;
  const displayEmail = profile?.email || authUser.email;
  
  const getImageUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    return `${process.env.NEXT_PUBLIC_API_IMAGE_URL || ''}${url.startsWith('/') ? '' : '/'}${url}`;
  };
  const displayAvatar = getImageUrl(profile?.avatar_url || authUser.avatar);
  
  const displayPhone = profile?.tel;
  const displayDob = profile?.birth_date;
  const displayAddress = profile?.address;
  const displayNationality = profile?.nantionality;
  const displayExpertise = null; // No longer available from profile directly
  const displayExperience = profile?.experience_years ? `${profile.experience_years} năm` : null;
  const targetStudentMap: Record<string, string> = {
    "0": "Học sinh",
    "1": "Nhân viên",
    "2": "Tất cả"
  };
  const displayTargetStudent = profile?.target_student !== undefined && profile?.target_student !== null
    ? (targetStudentMap[profile.target_student.toString()] || profile.target_student)
    : null;
  const displayBio = profile?.introduction;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary uppercase">
          <User className="size-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hồ sơ giáo viên</h2>
          <p className="text-muted-foreground text-sm">Quản lý và cập nhật thông tin cá nhân của bạn.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <Card className="col-span-1 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-col items-center text-center pb-2 relative">
            <div className="relative">
              <Avatar className="h-24 w-24 mb-4 border-4 border-background shadow-lg ring-2 ring-primary/20">
                <AvatarImage src={displayAvatar || ""} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {displayName?.substring(0, 2).toUpperCase() || "T"}
                </AvatarFallback>
              </Avatar>
            </div>

            <CardTitle className="text-xl font-bold">{displayName}</CardTitle>
            <CardDescription className="text-sm font-semibold mt-1 uppercase tracking-wider text-muted-foreground">
              Giáo viên
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="font-medium truncate" title={displayEmail}>{displayEmail}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{displayPhone || 'Chưa cập nhật SDT'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{displayDob || 'Chưa cập nhật ngày sinh'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="font-medium truncate" title={displayAddress}>{displayAddress || 'Chưa cập nhật địa chỉ'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 border-t pt-3 mt-3">
                <Flag className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{displayNationality || 'Chưa cập nhật quốc tịch'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Settings */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> Thông tin chuyên môn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Chuyên môn</span>
                  <p className="font-medium">{displayExpertise || 'Chưa cập nhật chuyên môn'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Kinh nghiệm</span>
                  <p className="font-medium">{displayExperience || 'Chưa cập nhật kinh nghiệm'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Đối tượng giảng dạy</span>
                  <p className="font-medium">{displayTargetStudent || 'Chưa cập nhật đối tượng'}</p>
                </div>
              </div>
              <div className="space-y-1 pt-2 border-t mt-4">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5 pt-2"><BookOpen className="h-3.5 w-3.5" /> Tiểu sử / Giới thiệu</span>
                <p className="text-sm leading-relaxed mt-1">{displayBio || 'Chưa có thông tin giới thiệu.'}</p>
              </div>
            </CardContent>
          </Card>

          <Link href="/profile/edit" className="block">
            <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardHeader className="flex flex-row items-center gap-4 py-5">
                <div className="p-3 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <User className="size-5 text-slate-500 group-hover:text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base font-bold">Cập nhật hồ sơ</CardTitle>
                  <CardDescription className="text-sm mt-1">Chỉnh sửa thông tin cá nhân và chuyên môn.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="font-bold text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Chỉnh sửa
                </Button>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/profile/security" className="block">
            <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardHeader className="flex flex-row items-center gap-4 py-5">
                <div className="p-3 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Shield className="size-5 text-slate-500 group-hover:text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base font-bold">Bảo mật</CardTitle>
                  <CardDescription className="text-sm mt-1">Thay đổi mật khẩu và quản lý bảo mật tài khoản.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="font-bold text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Cập nhật
                </Button>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
