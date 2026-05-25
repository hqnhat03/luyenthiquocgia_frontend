"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MoveLeft, Send } from "lucide-react";
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
import { AxiosError } from "axios";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }).min(1, { message: "Vui lòng nhập email" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true);
    try {
      const response = await api.post("/send-mail-reset-password", {
        email: data.email,
        user_type: "student",
      });

      const result = response.data;

      if (result.status === "success" || result.success) {
        toast.success(result.message || "Vui lòng kiểm tra email để đặt lại mật khẩu!");
        form.reset();
      } else {
        toast.error(result.message || "Gửi yêu cầu thất bại");
        if (result.errors && typeof result.errors === 'object') {
          Object.keys(result.errors).forEach((key) => {
             if (key === 'email') {
                form.setError(key as keyof ForgotPasswordFormValues, { message: result.errors[key][0] });
             }
          });
        }
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const result = error.response?.data;
        if (result && result.message) {
          toast.error(result.message);

          if (result.errors && typeof result.errors === 'object') {
            Object.keys(result.errors).forEach((key) => {
              if (key === 'email') {
                form.setError(key as keyof ForgotPasswordFormValues, { message: result.errors[key][0] });
              }
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
            <h2 className="text-4xl font-bold tracking-tight">Quên mật khẩu</h2>
            <p className="text-muted-foreground text-lg">
              Vui lòng nhập email của bạn để nhận liên kết đặt lại mật khẩu.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8">
            <FieldGroup>
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
            </FieldGroup>

            <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="size-5 animate-spin rounded-full border-3 border-current border-t-transparent" />
                  Đang xử lý...
                </div>
              ) : (
                <>
                  <Send className="size-5 mr-2" />
                  Gửi yêu cầu
                </>
              )}
            </Button>
          </form>

          <div className="text-center mt-4 flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium">
              Đã nhớ mật khẩu?{" "}
              <Link href="/student/login" className="text-primary font-bold hover:underline">
                Đăng nhập
              </Link>
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              Chưa có mã truy cập?{" "}
              <Link href="/contact" className="text-primary font-bold hover:underline">
                Liên hệ hỗ trợ
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            © {new Date().getFullYear()} GoEdu System. Bảo lưu mọi quyền.
          </p>
        </div>
      </div>
    </div>
  );
}
