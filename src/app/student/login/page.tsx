import { LoginForm } from "./_components/login-form";
import { Suspense } from "react";

export const metadata = {
  title: "Đăng nhập Học viên | GoEdu",
  description: "Dành cho học viên tham gia các khóa học tại GoEdu.",
};

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
