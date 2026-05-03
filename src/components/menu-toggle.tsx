"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLayoutStore } from "@/lib/layout-store";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

/**
 * Toggle button cho header. Behavior khác theo breakpoint:
 *   - <md (mobile): KHÔNG hiện (bottom nav handles)
 *   - md to xl-1 (tablet): hamburger → mở drawer overlay
 *   - ≥xl (desktop): panel chevron → toggle inline collapse
 *
 * Dùng 2 button render conditionally bằng Tailwind class — vẫn 1 element trên DOM.
 */
export function MenuToggle({ className }: Props) {
  const tabletOpen = useLayoutStore((s) => s.tabletDrawerOpen);
  const toggleTablet = useLayoutStore((s) => s.toggleTabletDrawer);
  const desktopCollapsed = useLayoutStore((s) => s.desktopCollapsed);
  const toggleDesktop = useLayoutStore((s) => s.toggleDesktopCollapsed);

  return (
    <>
      {/* Tablet: hamburger */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleTablet}
        aria-label={tabletOpen ? "Đóng menu" : "Mở menu"}
        aria-expanded={tabletOpen}
        title="Mở menu"
        className={cn("-ml-2 hidden md:inline-flex xl:hidden", className)}
      >
        <Menu className="size-5" />
      </Button>

      {/* Desktop: collapse / expand */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleDesktop}
        aria-label={desktopCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
        aria-expanded={!desktopCollapsed}
        title={desktopCollapsed ? "Mở rộng menu (Ctrl+B)" : "Thu gọn menu (Ctrl+B)"}
        className={cn("-ml-2 hidden xl:inline-flex", className)}
      >
        {desktopCollapsed ? (
          <PanelLeftOpen className="size-5" />
        ) : (
          <PanelLeftClose className="size-5" />
        )}
      </Button>
    </>
  );
}
