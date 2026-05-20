"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, MoveLeft, Phone, UserCircle, UserPlus } from "lucide-react";
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

const registerSchema = z.object({
  name: z.string().min(2, { message: "Họ và tên phải có ít nhất 2 ký tự" }),
  email: z.string().email({ message: "Email không hợp lệ" }).min(1, { message: "Vui lòng nhập email" }),
  phone: z.string().min(10, { message: "Số điện thoại không hợp lệ" }).max(11, { message: "Số điện thoại không hợp lệ" }).optional().or(z.literal('')),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
  confirmPassword: z.string().min(1, { message: "Vui lòng nhập lại mật khẩu" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.confirmPassword,
        role: "student", // Mặc định đăng ký cho học viên
      });

      const { data: result } = response;

      if (result.success) {
        toast.success(result.message || "Đăng ký tài khoản thành công!");

        if (result.data) {
          useAuthStore.getState().setAuth(result.data.user, result.data.access_token);
        }

        // Sử dụng window.location.href thay vì router.push để đảm bảo middleware nhận cookie
        window.location.href = "/";
      } else {
        toast.error(result.message || "Đăng ký thất bại");
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error);
        const message = error.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau.";
        toast.error(message);

        if (error.response?.data?.errors) {
          const fieldErrors = error.response.data.errors;
          Object.keys(fieldErrors).forEach((key) => {
            form.setError(key as keyof RegisterFormValues, { message: fieldErrors[key][0] });
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
        <div className="absolute inset-0">
          <div className="h-full w-full bg-slate-900 flex items-center justify-center">
            <div className="text-white/20 text-9xl font-bold tracking-tighter select-none">GoEdu</div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-black/60 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-12 text-white">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium transition-transform hover:-translate-x-1"
          >
            <MoveLeft className="size-4" />
            Về trang chủ
          </Link>

          <div className="mt-auto max-w-lg mb-12">
            <h1 className="text-6xl font-extrabold tracking-tight mb-4 drop-shadow-xl">Tham gia GoEdu</h1>
            <p className="text-xl text-white/90 leading-relaxed font-light">
              Bắt đầu hành trình chinh phục kiến thức mới ngay hôm nay.
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
            <h2 className="text-4xl font-bold tracking-tight">Đăng ký tài khoản</h2>
            <p className="text-muted-foreground text-lg">
              Trở thành học viên của GoEdu chỉ trong vài bước.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
            <FieldGroup className="gap-5">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name" className="font-semibold text-sm ml-1">Họ và tên</FieldLabel>
                <div className="relative group">
                  <div className="absolute left-3 top-3 transition-colors group-focus-within:text-primary">
                    <UserCircle className="size-5 text-muted-foreground pointer-events-none" />
                  </div>
                  <Input
                    {...register("name")}
                    id="name"
                    placeholder="Nguyễn Văn A"
                    disabled={isLoading}
                    className="pl-12 h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                  />
                </div>
                <FieldError errors={[errors.name]} />
              </Field>

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

              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="phone" className="font-semibold text-sm ml-1">Số điện thoại (tùy chọn)</FieldLabel>
                <div className="relative group">
                  <div className="absolute left-3 top-3 transition-colors group-focus-within:text-primary">
                    <Phone className="size-5 text-muted-foreground pointer-events-none" />
                  </div>
                  <Input
                    {...register("phone")}
                    id="phone"
                    placeholder="0912345678"
                    type="tel"
                    disabled={isLoading}
                    className="pl-12 h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                  />
                </div>
                <FieldError errors={[errors.phone]} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password" className="font-semibold text-sm ml-1">Mật khẩu</FieldLabel>
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

                <Field data-invalid={!!errors.confirmPassword}>
                  <FieldLabel htmlFor="confirmPassword" className="font-semibold text-sm ml-1">Xác nhận</FieldLabel>
                  <div className="relative group">
                    <div className="absolute left-3 top-3 transition-colors group-focus-within:text-primary">
                      <Lock className="size-5 text-muted-foreground pointer-events-none" />
                    </div>
                    <Input
                      {...register("confirmPassword")}
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="pl-12 pr-12 h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-5" />
                      ) : (
                        <Eye className="size-5" />
                      )}
                    </button>
                  </div>
                  <FieldError errors={[errors.confirmPassword]} />
                </Field>
              </div>
            </FieldGroup>

            <Button
              type="submit"
              id="register-submit-button"
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98] mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="size-5 animate-spin rounded-full border-3 border-current border-t-transparent" />
                  Đang tạo tài khoản...
                </div>
              ) : (
                <>
                  <UserPlus className="size-5 mr-2" />
                  Đăng ký ngay
                </>
              )}
            </Button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground font-medium">
              Bạn đã có tài khoản?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline ml-1">
                Đăng nhập
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Bằng việc đăng ký, bạn đồng ý với{" "}
            <Link href="/terms" className="underline hover:text-primary transition-colors">Điều khoản dịch vụ</Link>{" "}
            và{" "}
            <Link href="/privacy" className="underline hover:text-primary transition-colors">Chính sách bảo mật</Link>{" "}
            của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );
}
