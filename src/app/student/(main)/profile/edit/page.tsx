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

export default function EditProfilePage() {
  const router = useRouter()
  const { user: authUser } = useAuthStore()
  const [loading, setLoading] = React.useState(true)
  const [updateLoading, setUpdateLoading] = React.useState(false)

  const [formData, setFormData] = React.useState({
    name: "",
    phone: "",
    date_of_birth: "",
    address: "",
    student_type: "student",
    school: "",
    grade: "",
    work: "",
    position: ""
  })

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/detail');
        if (response.data.status === 'success' || response.data.data) {
          const profile = response.data.data;
          setFormData({
            name: (profile?.first_name && profile?.last_name) ? `${profile.last_name} ${profile.first_name}`.trim() : (authUser?.name || ""),
            phone: profile?.tel || "",
            date_of_birth: profile?.birth_date || "",
            address: profile?.address || "",
            student_type: profile?.type === 1 ? 'student' : (profile?.type === 2 ? 'employee' : 'student'),
            school: profile?.school_name || "",
            grade: profile?.grade_level?.toString() || "",
            work: profile?.department || "",
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
  }, [authUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateLoading(true)
    try {
      const res = await api.put("/profile", formData)

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên"
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                  className="h-11 rounded-xl"
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
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ liên hệ</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ của bạn"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Đối tượng / Nghề nghiệp</Label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl md:max-w-[400px]">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, student_type: 'student' }))}
                  className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", formData.student_type === 'student' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  Học sinh
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, student_type: 'employee' }))}
                  className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", formData.student_type === 'employee' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  Người đi làm
                </button>
              </div>
            </div>

            {formData.student_type === 'student' && (
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
                    <Label htmlFor="school">Trường học</Label>
                    <Input
                      id="school"
                      value={formData.school}
                      onChange={handleChange}
                      placeholder="Trường bạn đang học"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Khối/Lớp</Label>
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      placeholder="Lớp hoặc khối bạn đang theo học"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
              </>
            )}

            {formData.student_type === 'employee' && (
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
                    <Label htmlFor="work">Nơi làm việc</Label>
                    <Input
                      id="work"
                      value={formData.work}
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
