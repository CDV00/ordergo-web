"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const SHORTCUT_HINT = isMac ? "⌘B" : "Ctrl+B";

/**
 * Nút thu gọn / mở rộng sidebar.
 *
 * - Trên md+ (sidebar mode): toggle giữa expanded / icon-only
 * - Trên mobile (sheet mode): đóng sheet
 * - Persist tự động qua cookie (shadcn SidebarProvider built-in)
 * - Keyboard shortcut Ctrl+B (Cmd+B trên Mac) — built-in
 */
export function SidebarCollapseToggle() {
  const { state, toggleSidebar, isMobile, openMobile } = useSidebar();
  const collapsed = isMobile ? !openMobile : state === "collapsed";

  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const label = collapsed ? "Mở rộng menu" : "Thu gọn menu";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={toggleSidebar}
        tooltip={`${label} (${SHORTCUT_HINT})`}
        className="text-muted-foreground hover:text-foreground"
        aria-label={label}
        aria-expanded={!collapsed}
      >
        <Icon />
        <span className="flex-1">{label}</span>
        <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          {SHORTCUT_HINT}
        </kbd>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
