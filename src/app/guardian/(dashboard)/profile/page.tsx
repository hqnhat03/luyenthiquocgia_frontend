"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/axios"
import { useAuthStore } from "@/store/auth-store"
import { AxiosError } from "axios"
import { Calendar, Camera, Globe, Loader2, Mail, MapPin, Phone, Shield, User } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

interface GuardianProfile {
  name: string;
  email: string;
  avatar: string;
  phone: string;
  address: string;
  date_of_birth?: string;
}

export default function GuardianProfilePage() {
  const { user: authUser } = useAuthStore()
  const [profile, setProfile] = React.useState<GuardianProfile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/guardian/profile');
        if (response.data.success) {
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

  const handleAvatarClick = () => {
    if (isUploading) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("path", "avatars")

    try {
      const res = await api.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const url = res.data?.data?.public_url || res.data?.data?.url || res.data?.url
      if (url) {
        // Cập nhật lên backend
        await api.put("/guardian/profile", { avatar: url })

        setProfile(prev => prev ? { ...prev, avatar: url } : null)
        // Cập nhật auth store
        if (authUser) {
          useAuthStore.getState().setUser({ ...authUser, avatar: url });
        }
        toast.success("Thay đổi ảnh đại diện thành công!")
      } else {
        toast.error("Không nhận được URL ảnh từ server")
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Tải ảnh lên thất bại")
      }
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (!authUser || loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 px-4 md:px-0 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Đang tải thông tin...</p>
      </div>
    )
  }

  const displayName = profile?.name || authUser.name;
  const displayEmail = profile?.email || authUser.email;
  const displayAvatar = profile?.avatar || authUser.avatar;
  const displayPhone = profile?.phone;
  const displayDob = profile?.date_of_birth;
  const displayAddress = profile?.address;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary uppercase">
          <User className="size-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hồ sơ phụ huynh</h2>
          <p className="text-muted-foreground text-sm">Quản lý và cập nhật thông tin cá nhân của bạn.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <Card className="col-span-1 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-col items-center text-center pb-2 relative">
            <div
              className="relative group cursor-pointer"
              onClick={handleAvatarClick}
            >
              <Avatar className="h-24 w-24 mb-4 border-4 border-background shadow-lg ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                <AvatarImage src={displayAvatar || ""} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {displayName?.substring(0, 2).toUpperCase() || "P"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-x-0 top-0 bottom-4 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </div>
            </div>

            <CardTitle className="text-xl font-bold">{displayName}</CardTitle>
            <CardDescription className="text-sm font-semibold mt-1 uppercase tracking-wider text-muted-foreground">
              Phụ huynh
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
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
            </div>

            <Button
              className="w-full mt-6 font-bold rounded-xl"
              variant="outline"
              onClick={handleAvatarClick}
              disabled={isUploading}
            >
              {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải lên...</> : "Đổi ảnh đại diện"}
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </CardContent>
        </Card>

        {/* Right Column: Settings */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <Link href="/guardian/profile/edit" className="block">
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

          <Link href="/guardian/profile/security" className="block">
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

          <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardHeader className="flex flex-row items-center gap-4 py-5">
              <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Globe className="size-5 text-slate-500 group-hover:text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-bold">Ngôn ngữ & Khu vực</CardTitle>
                <CardDescription className="text-sm mt-1">Tùy chỉnh ngôn ngữ và định dạng thời gian.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="font-bold text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Thay đổi
              </Button>
            </CardHeader>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button className="h-11 rounded-xl px-8 shadow-lg shadow-primary/20 font-bold active:scale-95 transition-all">
          Lưu tất cả thay đổi
        </Button>
      </div>

    </div>
  )
}
