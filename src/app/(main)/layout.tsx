"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useMe } from "@/hooks/api/use-auth";

export default function MainLayout({ children }: { children: ReactNode }) {
  const { isReady, isAuthenticated, activeTenantId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!activeTenantId) {
      router.replace("/setup");
    }
  }, [isReady, isAuthenticated, activeTenantId, router]);

  // Fetch /me để hydrate user + memberships
  useMe();

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Đang tải...
      </div>
    );
  }
  if (!isAuthenticated || !activeTenantId) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
