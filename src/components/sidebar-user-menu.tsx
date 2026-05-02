"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
import { useLogout } from "@/hooks/api/use-auth";
import { cn } from "@/lib/utils";

interface Props {
  collapsed: boolean;
}

export function SidebarUserMenu({ collapsed }: Props) {
  const { user, memberships, activeTenantId } = useAuth();
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const logout = useLogout();
  const m = memberships.find((mb) => mb.tenantId === activeTenantId);
  const initial = user?.displayName?.[0]?.toUpperCase() ?? "?";

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.replace("/login");
  };

  const trigger = (
    <button
      type="button"
      className={cn(
        "w-full flex items-center gap-3 hover:bg-sidebar-accent rounded-md transition-colors h-12 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed ? "justify-center px-0" : "px-2",
      )}
      aria-label={user?.displayName ?? "User menu"}
    >
      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
        {initial}
      </div>
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0 text-left">
            <div className="font-semibold text-sm truncate">{user?.displayName ?? "User"}</div>
            <div className="text-xs text-muted-foreground truncate capitalize">
              {m?.roleCode?.replace("_", " ") ?? "—"}
            </div>
          </div>
          <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
        </>
      )}
    </button>
  );

  return (
    <DropdownMenu>
      {collapsed ? (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {user?.displayName ?? "Tài khoản"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        side={collapsed ? "right" : "top"}
        align="end"
        className="min-w-56"
      >
        <div className="px-2 py-1.5 text-xs text-muted-foreground">{user?.phone}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="size-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
