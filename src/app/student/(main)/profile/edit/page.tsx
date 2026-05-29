"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { studentAxios as api } from "@/api/student"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { AxiosError } from "axios"
import { ArrowLeft, BookOpen, Briefcase, Loader2, Save, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

// type: 0 = Học sinh (STUDENT), 1 = Người đi làm (EMPLOYEE)
// gender: 0 = Nữ, 1 = Nam

export default function EditProfilePage() {
  const router = useRouter()
  const { user: authUser } = useAuthStore()
  const [loading, setLoading] = React.useState(true)
  const [updateLoading, setUpdateLoading] = React.useState(false)

  const [formData, setFormData] = React.useState({
    first_name: "",
    last_name: "",
    tel: "",
    birth_date: "",
    address: "",
    gender: 1,       // 0 = Nữ, 1 = Nam
    type: 0,         // 0 = Học sinh, 1 = Người đi làm
    school_name: "",
    grade_level: "",
    department: "",
    position: "",
  })

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/form-update');
        if (response.data.status === 'success' || response.data.data) {
          const profile = response.data.data;
          setFormData({
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            tel: profile?.tel || "",
            birth_date: profile?.birth_date || "",
            address: profile?.address || "",
            gender: parseInt(profile?.gender ?? "1"),
            type: parseInt(profile?.type ?? "0"),
            school_name: profile?.school_name || "",
            grade_level: profile?.grade_level?.toString() || "",
            department: profile?.department || "",
            position: profile?.position || "",
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
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateLoading(true)
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        gender: formData.gender,
        birth_date: formData.birth_date,
        tel: formData.tel || null,
        address: formData.address,
        type: formData.type,
        school_name: formData.type === 0 ? (formData.school_name || null) : null,
        grade_level: formData.type === 0 ? (formData.grade_level ? parseInt(formData.grade_level) : null) : null,
        department: formData.type === 1 ? (formData.department || null) : null,
        position: formData.type === 1 ? (formData.position || null) : null,
      }

      const res = await api.post("/update", payload)

      if (res.data?.status === 'success' || res.status === 200 || res.status === 204) {
        toast.success("Cập nhật thông tin thành công!")

        // Update name in authStore
        const fullName = `${formData.last_name} ${formData.first_name}`.trim()
        if (fullName !== authUser?.name) {
          useAuthStore.getState().setAuth(
            { ...authUser!, name: fullName },
            useAuthStore.getState().token!
          );
        }

        router.push("/profile")
      } else {
        toast.error("Cập nhật thất bại. Vui lòng thử lại.")
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errData = error.response?.data
        if (errData?.data && typeof errData.data === 'object') {
          // Validation errors object
          const firstError = Object.values(errData.data)[0]
          if (Array.isArray(firstError)) {
            toast.error(firstError[0] as string)
          } else {
            toast.error(errData.message || "Cập nhật thất bại. Vui lòng thử lại.")
          }
        } else {
          toast.error(errData?.message || "Cập nhật thất bại. Vui lòng thử lại.")
        }
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
          <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cập nhật hồ sơ</h2>
          <p className="text-muted-foreground text-sm">Chỉnh sửa thông tin cá nhân của bạn để chúng tôi hiểu bạn hơn.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-sm shadow-primary/5">
          <CardHeader className="bg-slate-50/50 border-b pb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <User className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
            </div>
            <CardDescription className="pt-1">
              Những thông tin cơ bản liên lạc và định danh của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Họ & Tên */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="last_name">Họ <span className="text-red-500">*</span></Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Nhập họ"
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">Tên <span className="text-red-500">*</span></Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Nhập tên"
                  required
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Giới tính */}
            <div className="space-y-3">
              <Label>Giới tính <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl md:max-w-[300px]">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, gender: 1 }))}
                  className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", formData.gender === 1 ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  Nam
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, gender: 0 }))}
                  className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", formData.gender === 0 ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  Nữ
                </button>
              </div>
            </div>

            {/* Điện thoại & Ngày sinh */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tel">Số điện thoại</Label>
                <Input
                  id="tel"
                  value={formData.tel}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Ngày sinh <span className="text-red-500">*</span></Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ liên hệ <span className="text-red-500">*</span></Label>
              <Input
                id="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ của bạn"
                required
                className="h-11 rounded-xl"
              />
            </div>

            {/* Đối tượng */}
            <div className="space-y-3 pt-2">
              <Label>Đối tượng / Nghề nghiệp</Label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl md:max-w-[400px]">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 0 }))}
                  className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", formData.type === 0 ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  Học sinh
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 1 }))}
                  className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", formData.type === 1 ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  Người đi làm
                </button>
              </div>
            </div>

            {/* Thông tin trường lớp (type = 0: Học sinh) */}
            {formData.type === 0 && (
              <>
                <div className="my-8 border-t"></div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-none">Thông tin trường lớp</h3>
                    <p className="text-sm text-muted-foreground mt-1.5">Giúp hệ thống cá nhân hóa khóa học phù hợp với bạn.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="school_name">Trường học</Label>
                    <Input
                      id="school_name"
                      value={formData.school_name}
                      onChange={handleChange}
                      placeholder="Trường bạn đang học"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade_level">Khối/Lớp</Label>
                    <Input
                      id="grade_level"
                      type="number"
                      value={formData.grade_level}
                      onChange={handleChange}
                      placeholder="Khối hoặc lớp bạn đang học"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Thông tin công việc (type = 1: Người đi làm) */}
            {formData.type === 1 && (
              <>
                <div className="my-8 border-t"></div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-none">Thông tin công việc</h3>
                    <p className="text-sm text-muted-foreground mt-1.5">Trải nghiệm học tập gắn liền với thông tin doanh nghiệp.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="department">Nơi làm việc</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="Công ty/Tổ chức bạn đang làm việc"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Chức vụ</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={handleChange}
                      placeholder="Chức vụ/Vị trí công việc"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t mt-8">
              <Link href="/profile">
                <Button type="button" variant="outline" className="w-full sm:w-auto h-11 px-6 rounded-xl">
                  Hủy bỏ
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={updateLoading}
                className="w-full sm:w-auto h-11 px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
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
      </form>
    </div>
  )
}
