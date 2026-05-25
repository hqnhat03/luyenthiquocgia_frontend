"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }),
    password_confirmation: z.string().min(8, { message: "Vui lòng xác nhận mật khẩu" }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["password_confirmation"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      password_confirmation: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!token) return;

    const checkToken = async () => {
      try {
        const response = await api.get(`/student/form-reset-password/${token}`);
        if (response.data.success || response.data.status === "success") {
          setTokenValid(true);
        } else {
          toast.error(response.data.message || "Liên kết đổi mật khẩu không hợp lệ hoặc đã hết hạn.");
        }
      } catch (error) {
        toast.error("Liên kết đổi mật khẩu không hợp lệ hoặc đã hết hạn.");
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkToken();
  }, [token]);

  async function onSubmit(data: ResetPasswordFormValues) {
    setIsLoading(true);
    try {
      const response = await api.post("/reset-password", {
        token,
        user_type: "student",
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      const result = response.data;

      if (result.status === "success" || result.success) {
        toast.success(result.message || "Đổi mật khẩu thành công!");
        router.push("/student/login");
      } else {
        toast.error(result.message || "Đổi mật khẩu thất bại");
        if (result.errors && typeof result.errors === "object") {
          Object.keys(result.errors).forEach((key) => {
            form.setError(key as keyof ResetPasswordFormValues, {
              message: result.errors[key][0],
            });
          });
        }
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const result = error.response?.data;
        if (result && result.message) {
          toast.error(result.message);

          if (result.errors && typeof result.errors === "object") {
            Object.keys(result.errors).forEach((key) => {
              form.setError(key as keyof ResetPasswordFormValues, {
                message: result.errors[key][0],
              });
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
            <h2 className="text-4xl font-bold tracking-tight">Đặt lại mật khẩu</h2>
            <p className="text-muted-foreground text-lg">
              Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
            </p>
          </div>

          {isCheckingToken ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
              <p className="text-muted-foreground">Đang kiểm tra liên kết...</p>
            </div>
          ) : !tokenValid ? (
            <div className="flex flex-col gap-6 items-center text-center py-8">
              <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
                <Lock className="size-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Liên kết không hợp lệ</h3>
                <p className="text-muted-foreground">
                  Liên kết đặt lại mật khẩu đã hết hạn hoặc không tồn tại.
                </p>
              </div>
              <Button className="w-full h-12 rounded-xl mt-4">
                <Link href="/admin/forgot-password">Yêu cầu liên kết mới</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8">
              <FieldGroup>
                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password" title="password" className="font-semibold text-sm ml-1">
                    Mật khẩu mới
                  </FieldLabel>
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
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  <FieldError errors={[errors.password]} />
                </Field>

                <Field data-invalid={!!errors.password_confirmation}>
                  <FieldLabel htmlFor="password_confirmation" title="password_confirmation" className="font-semibold text-sm ml-1">
                    Xác nhận mật khẩu mới
                  </FieldLabel>
                  <div className="relative group">
                    <div className="absolute left-3 top-3 transition-colors group-focus-within:text-primary">
                      <Lock className="size-5 text-muted-foreground pointer-events-none" />
                    </div>
                    <Input
                      {...register("password_confirmation")}
                      id="password_confirmation"
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
                      {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  <FieldError errors={[errors.password_confirmation]} />
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="size-5 animate-spin rounded-full border-3 border-current border-t-transparent" />
                    Đang lưu...
                  </div>
                ) : (
                  <>
                    <Save className="size-5 mr-2" />
                    Đổi mật khẩu
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="text-center mt-4 flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium">
              Đã nhớ mật khẩu?{" "}
              <Link href="/admin/login" className="text-primary font-bold hover:underline">
                Đăng nhập
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
