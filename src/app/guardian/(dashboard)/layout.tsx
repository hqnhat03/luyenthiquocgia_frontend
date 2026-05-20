import { GuardianHeader } from "@/app/guardian/(dashboard)/_components/guardian-header";
import { GuardianSidebar } from "@/app/guardian/(dashboard)/_components/guardian-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

export default function GuardianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <GuardianSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <GuardianHeader />
          <main className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/30">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
