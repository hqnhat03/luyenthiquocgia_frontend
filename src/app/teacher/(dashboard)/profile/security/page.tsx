"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/axios"
import { AxiosError } from "axios"
import { ArrowLeft, KeyRound, Loader2, Save, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

export default function SecurityTeacherPage() {
  const router = useRouter()
  const [updateLoading, setUpdateLoading] = React.useState(false)

  const [formData, setFormData] = React.useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.new_password !== formData.new_password_confirmation) {
      toast.error("Mật khẩu xác nhận không khớp")
      return;
    }

    setUpdateLoading(true)
    try {
      // Gọi API đổi mật khẩu (endpoint có thể thay đổi tùy backend thực tế)
      const res = await api.post("/auth/change-password", formData)

      if (res.data?.success || res.status === 200 || res.status === 204) {
        toast.success("Thay đổi mật khẩu thành công!")
        router.push("/profile")
      } else {
        toast.error("Cập nhật thất bại. Vui lòng thử lại.")
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error("Change password error:", error)
        toast.error(error.response?.data?.message || "Cập nhật thất bại. Có thể mật khẩu hiện tại không đúng.")
      }
    } finally {
      setUpdateLoading(false)
    }
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
          <h2 className="text-2xl font-bold tracking-tight">Bảo mật tài khoản</h2>
          <p className="text-muted-foreground text-sm">Quản lý mật khẩu và các cài đặt bảo mật cho tài khoản của bạn.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-sm shadow-primary/5">
          <CardHeader className="bg-slate-50/50 border-b pb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                <Shield className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Thay đổi mật khẩu</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4 md:w-2/3">
              <div className="space-y-2">
                <Label htmlFor="current_password">Mật khẩu hiện tại <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type="password"
                    value={formData.current_password}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                    className="h-11 rounded-lg pl-10"
                  />
                  <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="new_password">Mật khẩu mới <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type="password"
                    value={formData.new_password}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu mới"
                    required
                    minLength={6}
                    className="h-11 rounded-lg pl-10"
                  />
                  <Shield className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password_confirmation">Xác nhận mật khẩu mới <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="new_password_confirmation"
                    type="password"
                    value={formData.new_password_confirmation}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    minLength={6}
                    className="h-11 rounded-lg pl-10"
                  />
                  <Shield className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-start gap-3 pt-6 border-t mt-8">
              <Link href="/profile">
                <Button type="button" variant="outline" className="w-full sm:w-auto h-11 px-6 rounded-lg">
                  Hủy bỏ
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={updateLoading}
                className="w-full sm:w-auto h-11 px-8 rounded-lg font-bold shadow-lg shadow-rose-500/20 bg-rose-600 hover:bg-rose-700 text-white"
              >
                {updateLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                Đổi mật khẩu
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
