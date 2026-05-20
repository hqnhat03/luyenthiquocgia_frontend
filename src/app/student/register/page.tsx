import { RegisterForm } from "@/components/auth/register-form";
import { Suspense } from "react";

export const metadata = {
  title: "Đăng ký Học viên | GoEdu",
  description: "Trở thành học viên tại GoEdu và bắt đầu hành trình học tập của bạn.",
};

export default function StudentRegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
