"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useLayoutStore } from "@/lib/layout-store";
import { SidebarBrand } from "./sidebar-brand";
import { NavList } from "./nav-list";
import { SidebarUserMenu } from "./sidebar-user-menu";

/**
 * Tablet drawer — overlay (Radix Sheet), không chiếm chỗ trong layout flex.
 * Toggle bởi MenuToggle (hamburger). Click backdrop hoặc item → đóng.
 * Sheet luôn render (cost portal nhỏ) — chỉ trigger trên md to xl-1.
 */
export function TabletDrawer() {
  const open = useLayoutStore((s) => s.tabletDrawerOpen);
  const setOpen = useLayoutStore((s) => s.setTabletDrawerOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-72 flex-col gap-0 border-r p-0"
      >
        <SheetTitle className="sr-only">Menu chính</SheetTitle>
        <SidebarBrand collapsed={false} onClick={() => setOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <NavList collapsed={false} onItemClick={() => setOpen(false)} />
        </div>
        <div className="border-sidebar-border shrink-0 border-t p-2">
          <SidebarUserMenu collapsed={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
