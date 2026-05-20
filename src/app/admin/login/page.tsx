"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { AxiosError } from "axios";

const loginSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }).min(1, { message: "Vui lòng nhập email" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;


  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const response = await api.post("/admin/login", {
        email: data.email,
        password: data.password,
      });

      const result = response.data;

      // Backend returns status: "success" in its original ApiResponser
      if (result.status === "success" || result.success) {
        toast.success(result.message || "Đăng nhập thành công!");

        if (result.data) {
          // Map backend data to what auth store expects
          const user = {
            id: result.data.id,
            email: result.data.email,
            name: result.data.name || result.data.email.split('@')[0],
            role: "admin",
            role_id: result.data.role_id,
          };
          const token = result.data.token || result.data.access_token;
          
          useAuthStore.getState().setAuth(user, token);
        }

        // Chuyển sang trang dashboard
        window.location.href = "/";
      } else {
        toast.error(result.message || "Đăng nhập thất bại");
        // Nếu có lỗi cụ thể cho từng field từ server
        if (result.errors && typeof result.errors === 'object') {
          Object.keys(result.errors).forEach((key) => {
            form.setError(key as keyof LoginFormValues, { message: result.errors[key][0] });
          });
        }
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const result = error.response?.data;
        console.log(result);
        if (result && result.message) {
          toast.error(result.message);

          // Handle validation errors from axios error response
          if (result.errors && typeof result.errors === 'object') {
            Object.keys(result.errors).forEach((key) => {
              form.setError(key as keyof LoginFormValues, { message: result.errors[key][0] });
            });
          }
        } else {
          toast.error("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
        }
      } else {
        toast.error("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* Left Side: Form Area */}
      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full flex-col justify-center gap-8 sm:w-[420px]">
          <div className="flex flex-col gap-3 text-center md:text-left">
            <div className="md:hidden flex justify-center mb-4">
              <h1 className="text-3xl font-bold tracking-tight text-primary">GoEdu</h1>
            </div>
            <h2 className="text-4xl font-bold tracking-tight">Đăng nhập</h2>
            <p className="text-muted-foreground text-lg">
              Vui lòng nhập thông tin quản trị viên.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8">
            <FieldGroup>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email" className="font-semibold text-sm ml-1">Email công việc</FieldLabel>
                <div className="relative group">
                  <div className="absolute left-3 top-3 transition-colors group-focus-within:text-primary">
                    <Mail className="size-5 text-muted-foreground pointer-events-none" />
                  </div>
                  <Input
                    {...register("email")}
                    id="email"
                    placeholder="admin@goedu.vn"
                    type="email"
                    disabled={isLoading}
                    className="pl-12 h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                  />
                </div>
                <FieldError errors={[errors.email]} />
              </Field>

              <Field data-invalid={!!errors.password}>
                <div className="flex items-center justify-between ml-1">
                  <FieldLabel htmlFor="password" title="password" className="font-semibold text-sm">Mật khẩu</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-primary/80 hover:text-primary hover:underline transition-all"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-3 top-3 transition-colors group-focus-within:text-primary">
                    <Lock className="size-5 text-muted-foreground pointer-events-none" />
                  </div>
                  <Input
                    {...register("password")}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="pl-12 pr-12 h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
                <FieldError errors={[errors.password]} />
              </Field>

            </FieldGroup>

            <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="size-5 animate-spin rounded-full border-3 border-current border-t-transparent" />
                  Đang xác thực...
                </div>
              ) : (
                <>
                  <LogIn className="size-5 mr-2" />
                  Đăng nhập ngay
                </>
              )}
            </Button>
          </form>


          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground font-medium">
              Chưa có mã truy cập?{" "}
              <Link href="/contact" className="text-primary font-bold hover:underline">
                Liên hệ hỗ trợ
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Brand/Image Area */}
      <div className="relative hidden w-1/2 overflow-hidden bg-muted md:flex flex-col">
        {/* Background Design */}
        <div className="absolute inset-0">
          <div className="h-full w-full bg-slate-900 flex items-center justify-center">
            <div className="text-white/20 text-9xl font-bold tracking-tighter select-none">GoEdu</div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-black/60 backdrop-blur-[2px]" />
        </div>

        {/* Content on Image */}
        <div className="relative z-10 flex flex-col h-full p-12 text-white">

          <div className="mt-auto max-w-lg">
            <h1 className="text-6xl font-extrabold tracking-tight mb-4 drop-shadow-lg">GoEdu</h1>
            <p className="text-xl text-white/90 leading-relaxed font-light">
              Kiến tạo tương lai giáo dục.
              Hệ thống quản trị thông minh dành cho doanh nghiệp hiện đại.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
