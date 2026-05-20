"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/axios"
import { useAuthStore } from "@/store/auth-store"
import { AxiosError } from "axios"
import { ArrowLeft, Briefcase, Loader2, Save, User } from "lucide-react"
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
    name: "",
    phone: "",
    date_of_birth: "",
    address: "",
    nationality: "",
    expertise: "",
    experience: "",
    target_student: "",
    bio: ""
  })

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/teacher/profile');
        if (response.data.success) {
          const profile = response.data.data;
          setFormData({
            name: profile?.name || authUser?.name || "",
            phone: profile?.phone || "",
            date_of_birth: profile?.date_of_birth || "",
            address: profile?.address || "",
            nationality: profile?.nationality || "",
            expertise: profile?.expertise || "",
            experience: profile?.experience || "",
            target_student: profile?.target_student || "",
            bio: profile?.bio || "",
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error("Không thể tải thông tin hồ sơ");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateLoading(true)
    try {
      const res = await api.put("/teacher/profile", formData)

      if (res.data?.success || res.status === 200 || res.status === 204) {
        toast.success("Cập nhật thông tin thành công!")

        // Update name in authStore if it changed
        if (formData.name !== authUser?.name) {
          useAuthStore.getState().setAuth(
            { ...authUser!, name: formData.name },
            useAuthStore.getState().token!
          );
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                    required
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Ngày sinh</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ liên hệ</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ của bạn"
                    className="h-11 rounded-lg"
                  />
                </div>
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
                  <Label htmlFor="nationality">Quốc tịch</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    placeholder="Ví dụ: Việt Nam, Hoa Kỳ..."
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expertise">Chuyên môn</Label>
                  <Input
                    id="expertise"
                    value={formData.expertise}
                    onChange={handleChange}
                    placeholder="Ví dụ: Tiếng Anh, Toán..."
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="experience">Kinh nghiệm</Label>
                  <Input
                    id="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="Ví dụ: 5 năm, 10 năm..."
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Đối tượng giảng dạy</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.target_student === 'student' ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, target_student: 'student' }))}
                      className="flex-1 h-11 rounded-lg"
                    >
                      Học sinh
                    </Button>
                    <Button
                      type="button"
                      variant={formData.target_student === 'employee' ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, target_student: 'employee' }))}
                      className="flex-1 h-11 rounded-lg"
                    >
                      Người đi làm
                    </Button>
                    <Button
                      type="button"
                      variant={formData.target_student === 'all' ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, target_student: 'all' }))}
                      className="flex-1 h-11 rounded-lg"
                    >
                      Tất cả
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Tiểu sử / Giới thiệu</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
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
