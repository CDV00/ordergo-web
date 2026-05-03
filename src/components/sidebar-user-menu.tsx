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
        "hover:bg-sidebar-accent focus-visible:ring-ring flex h-12 w-full items-center gap-3 rounded-md transition-colors outline-none focus-visible:ring-2",
        collapsed ? "justify-center px-0" : "px-2",
      )}
      aria-label={user?.displayName ?? "User menu"}
    >
      <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
        {initial}
      </div>
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-sm font-semibold">{user?.displayName ?? "User"}</div>
            <div className="text-muted-foreground truncate text-xs capitalize">
              {m?.roleCode?.replace("_", " ") ?? "—"}
            </div>
          </div>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
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
      <DropdownMenuContent side={collapsed ? "right" : "top"} align="end" className="min-w-56">
        <div className="text-muted-foreground px-2 py-1.5 text-xs">{user?.phone}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
