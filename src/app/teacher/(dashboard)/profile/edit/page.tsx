"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/axios"
import { useAuthStore } from "@/store/auth-store"
import { AxiosError } from "axios"
import { ArrowLeft, Briefcase, Camera, Loader2, Save, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

export default function EditTeacherProfilePage() {
  const router = useRouter()
  const { user: authUser } = useAuthStore()
  const [loading, setLoading] = React.useState(true)
  const [updateLoading, setUpdateLoading] = React.useState(false)

  const [formData, setFormData] = React.useState({
    id: 0,
    first_name: "",
    last_name: "",
    email: "",
    gender: 1,
    tel: "",
    birth_date: "",
    address: "",
    nantionality: "",
    experience_years: 0,
    introduction: ""
  })
  
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/teacher/profile');
        if (response.data?.status === 'success' || response.data?.success) {
          const profile = response.data.data;
          setFormData({
            id: profile?.id || 0,
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            email: profile?.email || "",
            gender: profile?.gender ?? 1,
            tel: profile?.tel || "",
            birth_date: profile?.birth_date || "",
            address: profile?.address || "",
            nantionality: profile?.nantionality || "",
            experience_years: profile?.experience_years || 0,
            introduction: profile?.introduction || "",
          });
          setAvatarPreview(profile?.avatar_url || null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error("Không thể tải thông tin hồ sơ");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateLoading(true)
    try {
      const payload = new FormData()
      payload.append('id', String(formData.id))
      payload.append('first_name', formData.first_name)
      payload.append('last_name', formData.last_name)
      payload.append('email', formData.email)
      payload.append('gender', String(formData.gender))
      payload.append('tel', formData.tel)
      if (formData.birth_date) payload.append('birth_date', formData.birth_date)
      payload.append('address', formData.address)
      payload.append('nationality', formData.nantionality) // mapped for validation logic
      payload.append('nantionality', formData.nantionality) // mapped for service update
      payload.append('experience_years', String(formData.experience_years))
      payload.append('introduction', formData.introduction)
      
      if (avatarFile) {
        payload.append('avatar_url', avatarFile)
      }

      const res = await api.post("/teacher/update-profile", payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data?.success || res.status === 200 || res.status === 204) {
        toast.success("Cập nhật thông tin thành công!")

        // Refetch profile to get the updated avatar URL and data
        try {
          const profileResponse = await api.get('/teacher/profile');
          if ((profileResponse.data?.status === 'success' || profileResponse.data?.success) && authUser) {
            const updatedProfile = profileResponse.data.data;
            const newName = `${updatedProfile.first_name} ${updatedProfile.last_name}`;
            useAuthStore.getState().setAuth(
              { ...authUser, name: newName, avatar: updatedProfile.avatar_url },
              useAuthStore.getState().token!
            );
          }
        } catch (error) {
          console.error("Failed to refetch profile for store update", error);
        }

        router.push("/profile")
      } else {
        toast.error("Cập nhật thất bại. Vui lòng thử lại.")
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.")
      }
    } finally {
      setUpdateLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 px-4 md:px-0 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 font-medium text-muted-foreground">Đang tải thông tin...</span>
      </div>
    )
  }

  const getImageUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    return `${process.env.NEXT_PUBLIC_API_IMAGE_URL || ''}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/profile">
          <Button variant="outline" size="icon" className="rounded-lg h-10 w-10 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cập nhật hồ sơ</h2>
          <p className="text-muted-foreground text-sm">Chỉnh sửa thông tin cá nhân và chuyên môn giảng dạy của bạn.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card className="border-none shadow-sm shadow-primary/5">
            <CardHeader className="bg-slate-50/50 border-b pb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <User className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
              </div>
              <CardDescription className="pt-1">
                Những thông tin liên lạc và định danh của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-col items-center mb-6">
                <div
                  className="relative group cursor-pointer"
                  onClick={handleAvatarClick}
                >
                  <Avatar className="h-24 w-24 mb-2 border-4 border-background shadow-lg ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                    <AvatarImage src={getImageUrl(avatarPreview)} alt="Avatar" className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                      {formData.first_name?.substring(0, 1).toUpperCase() || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-x-0 top-0 bottom-2 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAvatarClick} className="mt-2">
                  Đổi ảnh đại diện
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Họ và tên đệm <span className="text-red-500">*</span></Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Ví dụ: Nguyễn Văn"
                    required
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Tên <span className="text-red-500">*</span></Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Ví dụ: A"
                    required
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Nhập email"
                    required
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tel">Số điện thoại <span className="text-red-500">*</span></Label>
                  <Input
                    id="tel"
                    value={formData.tel}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    required
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Ngày sinh <span className="text-red-500">*</span></Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    required
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Giới tính <span className="text-red-500">*</span></Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value={1}>Nam</option>
                    <option value={0}>Nữ</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ liên hệ <span className="text-red-500">*</span></Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ của bạn"
                  required
                  className="h-11 rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm shadow-primary/5">
            <CardHeader className="bg-slate-50/50 border-b pb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                  <Briefcase className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Thông tin chuyên môn</CardTitle>
              </div>
              <CardDescription className="pt-1">
                Chi tiết về chuyên môn giảng dạy và kinh nghiệm của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nantionality">Quốc tịch</Label>
                  <Input
                    id="nantionality"
                    value={formData.nantionality}
                    onChange={handleChange}
                    placeholder="Ví dụ: Việt Nam, Hoa Kỳ..."
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience_years">Số năm kinh nghiệm <span className="text-red-500">*</span></Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={formData.experience_years}
                    onChange={handleChange}
                    placeholder="Ví dụ: 5"
                    required
                    min="0"
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="introduction">Tiểu sử / Giới thiệu</Label>
                <Textarea
                  id="introduction"
                  value={formData.introduction}
                  onChange={handleChange}
                  placeholder="Giới thiệu ngắn gọn về bản thân, phương pháp giảng dạy..."
                  className="min-h-[120px] rounded-lg resize-y"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t mt-8">
                <Link href="/profile">
                  <Button type="button" variant="outline" className="w-full sm:w-auto h-11 px-6 rounded-lg">
                    Hủy bỏ
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={updateLoading}
                  className="w-full sm:w-auto h-11 px-8 rounded-lg font-bold shadow-lg shadow-primary/20"
                >
                  {updateLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
                  Lưu hồ sơ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
