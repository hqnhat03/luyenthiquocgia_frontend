"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, GraduationCap, Lock, LogIn, Mail, MoveLeft, User, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import api from "@/lib/axios";
import { APP_LINKS } from "@/lib/links";
import { useAuthStore } from "@/store/auth-store";
import { AxiosError } from "axios";


const loginSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }).min(1, { message: "Vui lòng nhập email" }),
  password: z.string().min(1, { message: "Vui lòng nhập mật khẩu" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type UserRole = "student" | "teacher" | "guardian";

interface LoginFormProps {
  role: UserRole;
}

export function LoginForm({ role }: LoginFormProps) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Get email from query params to "persist" form state during tab switching
  const initialEmail = searchParams.get("email") || "";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: initialEmail,
      password: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = form;

  const currentEmail = watch("email");

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const { data: result } = response;

      if (result.success) {
        toast.success(result.message || "Đăng nhập thành công!");

        if (result.data) {
          useAuthStore.getState().setAuth(result.data.user, result.data.access_token);
        }

        // Sử dụng window.location.href thay vì router.push để đảm bảo 
        // middleware nhận được cookie mới và redirect chính xác theo role
        window.location.href = "/";
      } else {
        toast.error(result.message || "Đăng nhập thất bại");
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau.";
        toast.error(message);

        if (error.response?.data?.errors) {
          const fieldErrors = error.response.data.errors;
          Object.keys(fieldErrors).forEach((key) => {
            form.setError(key as keyof LoginFormValues, { message: fieldErrors[key][0] });
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden font-sans">
      {/* Left Side: Brand/Image Area */}
      <div className="relative hidden w-1/2 overflow-hidden bg-muted md:flex flex-col">
        {/* Background Image Placeholder */}
        <div className="absolute inset-0">
          <div className="h-full w-full bg-slate-900 flex items-center justify-center">
            <div className="text-white/20 text-9xl font-bold tracking-tighter select-none">GoEdu</div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-black/60 backdrop-blur-[2px]" />
        </div>

        {/* Content on Image */}
        <div className="relative z-10 flex flex-col h-full p-12 text-white">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium transition-transform hover:-translate-x-1"
          >
            <MoveLeft className="size-4" />
            Về trang chủ
          </Link>

          <div className="mt-auto max-w-lg mb-12">
            <h1 className="text-6xl font-extrabold tracking-tight mb-4 drop-shadow-xl">GoEdu</h1>
            <p className="text-xl text-white/90 leading-relaxed font-light">
              Nâng tầm kỹ năng, kiến tạo tương lai.
              Hệ thống giáo dục thông minh và toàn diện nhất dành cho bạn.
            </p>
          </div>

        </div>
      </div>

      {/* Right Side: Form Area */}
      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full flex-col justify-center gap-8 sm:w-[420px]">
          <div className="flex flex-col gap-3 text-center md:text-left">
            <div className="md:hidden flex justify-center mb-4">
              <h1 className="text-3xl font-bold tracking-tight text-primary">GoEdu</h1>
            </div>
            <h2 className="text-4xl font-bold tracking-tight">Đăng nhập</h2>
            <p className="text-muted-foreground text-lg">
              Chào mừng bạn đã trở lại với GoEdu.
            </p>
          </div>

          <Tabs value={role} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-12 p-1">
              <TabsTrigger value="student">
                <Link
                  href={`${APP_LINKS.student}/login?email=${encodeURIComponent(currentEmail)}`}
                  className="flex items-center gap-2 cursor-pointer h-full rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm"
                >
                  <User className="size-4" />
                  Học viên
                </Link>
              </TabsTrigger>
              <TabsTrigger value="teacher">
                <Link
                  href={`${APP_LINKS.teacher}/login?email=${encodeURIComponent(currentEmail)}`}
                  className="flex items-center gap-2 cursor-pointer h-full rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm"
                >
                  <GraduationCap className="size-4" />
                  Giảng viên
                </Link>
              </TabsTrigger>
              <TabsTrigger value="guardian">
                <Link
                  href={`${APP_LINKS.guardian}/login?email=${encodeURIComponent(currentEmail)}`}
                  className="flex items-center gap-2 cursor-pointer h-full rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm"
                >
                  <Users className="size-4" />
                  Phụ huynh
                </Link>
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
              <FieldGroup className="gap-6">
                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="email" className="font-semibold text-sm ml-1">Email</FieldLabel>
                  <div className="relative group">
                    <div className="absolute left-3 top-3 transition-colors group-focus-within:text-primary">
                      <Mail className="size-5 text-muted-foreground pointer-events-none" />
                    </div>
                    <Input
                      {...register("email")}
                      id="email"
                      placeholder="example@goedu.vn"
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
                      className="text-xs font-semibold text-primary hover:text-primary/80 hover:underline transition-all"
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

              <Button
                type="submit"
                id="login-submit-button"
                className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
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
          </Tabs>

          {role === "student" && (
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground font-medium">
                Bạn chưa có tài khoản?{" "}
                <Link href="/register" className="text-primary font-bold hover:underline ml-1">
                  Đăng ký miễn phí
                </Link>
              </p>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-8">
            © {new Date().getFullYear()} GoEdu System. Bảo lưu mọi quyền.
          </p>
        </div>
      </div>
    </div>
  );
}
