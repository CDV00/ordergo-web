"use client";

import { useLayoutStore } from "@/lib/layout-store";
import { SidebarBrand } from "./sidebar-brand";
import { NavList } from "./nav-list";
import { SidebarUserMenu } from "./sidebar-user-menu";
import { cn } from "@/lib/utils";

/**
 * Desktop sidebar — inline flex item, transition width khi collapse.
 * Hiện trên xl+ (≥1280px). Tablet & mobile dùng component khác.
 */
export function DesktopSidebar() {
  const collapsed = useLayoutStore((s) => s.desktopCollapsed);

  return (
    <aside
      data-state={collapsed ? "collapsed" : "expanded"}
      className={cn(
        "hidden shrink-0 flex-col overflow-hidden xl:flex",
        "bg-sidebar text-sidebar-foreground border-sidebar-border border-r",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60",
      )}
      aria-label="Thanh điều hướng"
    >
      <SidebarBrand collapsed={collapsed} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <NavList collapsed={collapsed} />
      </div>

      <div className="border-sidebar-border shrink-0 border-t p-2">
        <SidebarUserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
