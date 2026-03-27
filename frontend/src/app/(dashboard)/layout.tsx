"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('pactura-theme');
    if (saved === 'dark') document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1E2F5C]">
        <div className="text-white/50 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <AppSidebar />
      <div id="main-content" className="flex flex-1 flex-col overflow-y-auto" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}