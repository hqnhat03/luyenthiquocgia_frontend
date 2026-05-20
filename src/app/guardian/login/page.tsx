import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";

export const metadata = {
  title: "Đăng nhập Phụ huynh | GoEdu",
  description: "Dành cho phụ huynh theo dõi tiến độ học tập của con em tại GoEdu.",
};

export default function GuardianLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm role="guardian" />
    </Suspense>
  );
}
