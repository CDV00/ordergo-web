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
        "flex items-center gap-3 h-14 border-b border-sidebar-border shrink-0 transition-colors hover:bg-sidebar-accent/30",
        collapsed ? "justify-center px-0" : "px-3",
      )}
      aria-label="OrderGo — Về trang chủ"
    >
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
        <Store className="size-4" />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-tight overflow-hidden">
          <span className="font-semibold text-sm truncate">OrderGo</span>
          <span className="text-xs text-muted-foreground truncate">Quản lý vận hành</span>
        </div>
      )}
    </Link>
  );
}
