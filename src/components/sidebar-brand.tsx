"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  collapsed: boolean;
  onClick?: () => void;
}

export function SidebarBrand({ collapsed, onClick }: Props) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn(
        "border-sidebar-border hover:bg-sidebar-accent/30 flex h-14 shrink-0 items-center gap-3 border-b transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
      )}
      aria-label="OrderGo — Về trang chủ"
    >
      <div className="bg-primary text-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg">
        <Store className="size-4" />
      </div>
      {!collapsed && (
        <div className="flex flex-col overflow-hidden leading-tight">
          <span className="truncate text-sm font-semibold">OrderGo</span>
          <span className="text-muted-foreground truncate text-xs">Quản lý vận hành</span>
        </div>
      )}
    </Link>
  );
}
