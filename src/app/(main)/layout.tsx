"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { TabletDrawer } from "@/components/tablet-drawer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useAuth } from "@/contexts/auth-context";
import { useMe } from "@/hooks/api/use-auth";
import { useLayoutStore } from "@/lib/layout-store";

export default function MainLayout({ children }: { children: ReactNode }) {
  const { isReady, isAuthenticated, activeTenantId } = useAuth();
  const router = useRouter();
  const toggleDesktop = useLayoutStore((s) => s.toggleDesktopCollapsed);
  const toggleTablet = useLayoutStore((s) => s.toggleTabletDrawer);

  // Auth gate
  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!activeTenantId) router.replace("/setup");
  }, [isReady, isAuthenticated, activeTenantId, router]);

  // Hydrate /me
  useMe();

  // Keyboard shortcut Ctrl+B / Cmd+B
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        // Skip nếu đang focus input/textarea
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        const isDesktop = window.matchMedia("(min-width: 1280px)").matches;
        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        if (isMobile) return;
        if (isDesktop) toggleDesktop();
        else toggleTablet();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleDesktop, toggleTablet]);

  if (!isReady) {
    return (
      <div className="flex h-svh items-center justify-center text-muted-foreground">
        Đang tải...
      </div>
    );
  }
  if (!isAuthenticated || !activeTenantId) return null;

  return (
    /*
     * Pure flex layout — không margin/padding/calc cho content.
     * - h-svh: stable viewport (không bị URL bar iOS nhảy)
     * - overflow-hidden: ngăn scroll body, mọi scroll ở children
     * - <DesktopSidebar/> chỉ render+chiếm chỗ ở xl+ (tự ẩn qua Tailwind)
     * - <main flex-1 min-w-0> auto scale khi sidebar đổi width
     * - min-w-0 quan trọng: cho phép flex item shrink dưới content size
     *   (không thì content overflow đẩy sidebar lệch khi có table/preformatted)
     */
    <div className="flex h-svh overflow-hidden bg-background">
      <DesktopSidebar />
      <TabletDrawer />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 pb-16 md:pb-0">
        {children}
      </main>

      <MobileBottomNav />
    </div>
  );
}
