"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { TabletDrawer } from "@/components/tablet-drawer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useAuth } from "@/contexts/auth-context";
import { useMe } from "@/hooks/api/use-auth";
import { useVenues } from "@/hooks/api/use-tenant";
import { useLayoutStore } from "@/lib/layout-store";

export default function MainLayout({ children }: { children: ReactNode }) {
  const { isReady, isAuthenticated, activeTenantId, activeVenueId, switchVenue } = useAuth();
  const router = useRouter();
  const toggleDesktop = useLayoutStore((s) => s.toggleDesktopCollapsed);
  const toggleTablet = useLayoutStore((s) => s.toggleTabletDrawer);

  // Hydrate /me + venues
  useMe();
  const venues = useVenues();

  // Auto-pick first venue khi user là owner (membership.venueId=null vì scope tenant-wide).
  // Tránh case form ở trang nào đó submit với venueId rỗng → BE reject.
  useEffect(() => {
    if (!isAuthenticated || !activeTenantId) return;
    if (activeVenueId) return;
    if (!venues.data || venues.data.length === 0) return;
    const first = venues.data.find((v) => v.status === "active") ?? venues.data[0];
    if (first) switchVenue(first.id);
  }, [isAuthenticated, activeTenantId, activeVenueId, venues.data, switchVenue]);

  // Auth gate
  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!activeTenantId) router.replace("/setup");
  }, [isReady, isAuthenticated, activeTenantId, router]);

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
      <div className="text-muted-foreground flex h-svh items-center justify-center">
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
    <div className="bg-background flex h-svh overflow-hidden">
      <DesktopSidebar />
      <TabletDrawer />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden pb-16 md:pb-0">{children}</main>

      <MobileBottomNav />
    </div>
  );
}
