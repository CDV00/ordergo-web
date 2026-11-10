"use client";

import Link from "next/link";
import { Coffee } from "lucide-react";
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
        "border-sidebar-border flex h-16 shrink-0 items-center gap-3 border-b transition-colors",
        collapsed ? "justify-center px-0" : "px-4",
      )}
      aria-label="OrderGo — Về trang chủ"
    >
      <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-9 shrink-0 items-center justify-center rounded-xl shadow-md shadow-black/30">
        <Coffee className="size-[18px]" strokeWidth={2.4} />
      </div>
      {!collapsed && (
        <div className="flex flex-col overflow-hidden leading-tight">
          <span className="truncate text-[15px] font-bold tracking-tight">OrderGo</span>
          <span className="text-sidebar-foreground/55 truncate text-xs">Vận hành quán</span>
        </div>
      )}
    </Link>
  );
}
