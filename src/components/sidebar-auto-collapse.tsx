"use client";

import { useEffect, useRef } from "react";
import { useSidebar } from "@/components/ui/sidebar";

// Shadcn cookie key — match với SIDEBAR_COOKIE_NAME bên trong sidebar.tsx
const SIDEBAR_COOKIE_NAMES = ["sidebar_state", "sidebar:state"];

function hasUserPreference(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => SIDEBAR_COOKIE_NAMES.some((name) => c.startsWith(name + "=")));
}

/**
 * Auto set sidebar state theo viewport — CHỈ khi user chưa từng manual toggle.
 *
 * - Lần đầu mount + chưa có cookie sidebar:
 *     ≥ 1280px → expand (desktop, thu ngân/admin)
 *     < 1280px → collapse icon-only (tablet, save space cho POS)
 * - Đã có cookie (user đã toggle): không can thiệp, respect lựa chọn
 * - Resize sau đó: không can thiệp
 *
 * Cookie do shadcn SidebarProvider tự lưu khi user click toggle.
 */
export function SidebarAutoCollapse() {
  const { setOpen, isMobile } = useSidebar();
  const ranRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || isMobile) return;
    if (ranRef.current) return;
    ranRef.current = true;

    if (hasUserPreference()) return; // Respect user choice

    const isDesktop = window.matchMedia("(min-width: 1280px)").matches;
    setOpen(isDesktop);
  }, [setOpen, isMobile]);

  return null;
}
