"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { studentAxios as api } from "@/api/student"
import { useAuthStore } from "@/store/auth-store"
import { Briefcase, Calendar, Globe, Mail, MapPin, Phone, School, Shield, Trophy, User } from "lucide-react"
import Link from "next/link"
import * as React from "react"

interface StudentProfile {
  first_name: string;
  last_name: string;
  email: string;
  address: string;
  tel: string;
  birth_date: string;
  gender: number;
  avatar_url: string;
  type: number;
  school_name: string;
  grade_level: number;
  department: string;
  position: string;
}


export default function ProfilePage() {
  const { user: authUser } = useAuthStore()
  const [profile, setProfile] = React.useState<StudentProfile | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/detail');
        if (response.data.status === 'success' || response.data.data) {
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

  const displayName = profile ? `${profile.last_name} ${profile.first_name}`.trim() : authUser.name;
  const displayEmail = profile?.email || authUser.email;
  const displayAvatar = profile?.avatar_url || authUser.avatar;
  const displayRole = authUser.role;
  const displayPhone = profile?.tel;
  const displayDob = profile?.birth_date;
  const displayAddress = profile?.address;
  const displayStudentType = profile?.type === 1 ? 'student' : (profile?.type === 2 ? 'employee' : 'student');
  const displaySchool = profile?.school_name;
  const displayGrade = profile?.grade_level;
  const displayWork = profile?.department;
  const displayPosition = profile?.position;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary uppercase">
          <User className="size-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Thông tin cá nhân</h2>
          <p className="text-muted-foreground text-sm">Quản lý và cập nhật hồ sơ của bạn.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <Card className="col-span-1 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-col items-center text-center pb-2 relative">
            <Avatar className="h-24 w-24 mb-4 border-4 border-background shadow-lg ring-2 ring-primary/20">
              <AvatarImage src={displayAvatar || ""} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                {displayName?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <CardTitle className="text-xl font-bold">{displayName}</CardTitle>
            <CardDescription className="text-sm font-semibold mt-1 uppercase tracking-wider text-muted-foreground">
              {displayStudentType === 'student' ? 'Học sinh' : (displayStudentType === 'employee' ? 'Nhân viên' : (displayRole === 'student' ? 'Học viên' : displayRole))}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="font-medium truncate" title={displayEmail}>{displayEmail}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Shield className="h-4 w-4 text-slate-400" />
                <span className="font-medium capitalize">{displayRole}</span>
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

              {displayStudentType === 'student' && (
                <>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <School className="h-4 w-4 text-slate-400" />
                    <span className="font-medium truncate" title={displaySchool}>{displaySchool || 'Chưa cập nhật trường học'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Trophy className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{displayGrade || 'Chưa cập nhật lớp/khối'}</span>
                  </div>
                </>
              )}
              {displayStudentType === 'employee' && (
                <>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <span className="font-medium truncate" title={displayWork}>{displayWork || 'Chưa cập nhật nơi làm'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{displayPosition || 'Chưa cập nhật chức vụ'}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Settings */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <Link href="/profile/edit" className="block">
            <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardHeader className="flex flex-row items-center gap-4 py-5">
                <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <User className="size-5 text-slate-500 group-hover:text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base font-bold">Cập nhật hồ sơ</CardTitle>
                  <CardDescription className="text-sm mt-1">Chỉnh sửa thông tin cá nhân của bạn.</CardDescription>
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
                <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
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
