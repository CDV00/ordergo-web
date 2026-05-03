"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ALL_NAV_ITEMS, isNavActive, MOBILE_NAV, NAV_FOOTER, NAV_GROUPS } from "@/lib/nav-config";
import { useAuth } from "@/contexts/auth-context";
import { useLogout } from "@/hooks/api/use-auth";

/** Pure-CSS bottom nav: hide trên md+, sticky bottom, safe-area inset cho iOS */
export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = !MOBILE_NAV.some((it) => isNavActive(it.url, pathname));

  return (
    <nav
      role="navigation"
      aria-label="Điều hướng chính"
      className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {MOBILE_NAV.map((it) => {
          const active = isNavActive(it.url, pathname);
          const Icon = it.icon;
          return (
            <li key={it.url}>
              <Link
                href={it.url}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 transition-colors active:scale-95",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                <span className={cn("text-[11px] leading-none", active && "font-semibold")}>
                  {it.title.split(" — ")[0]}
                </span>
              </Link>
            </li>
          );
        })}

        {/* "Khác" — mở sheet drawer toàn bộ nav */}
        <li>
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-0.5 transition-colors active:scale-95",
                  moreActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Menu className="size-5" strokeWidth={moreActive ? 2.5 : 2} />
                <span className={cn("text-[11px] leading-none", moreActive && "font-semibold")}>
                  Khác
                </span>
              </button>
            </SheetTrigger>
            <MoreSheet onClose={() => setMoreOpen(false)} pathname={pathname} />
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}

function MoreSheet({ onClose, pathname }: { onClose: () => void; pathname: string }) {
  const { user, memberships, activeTenantId } = useAuth();
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const logout = useLogout();
  const activeMembership = memberships.find((m) => m.tenantId === activeTenantId);

  const handleLogout = async () => {
    await logout.mutateAsync();
    onClose();
    router.replace("/login");
  };

  return (
    <SheetContent
      side="bottom"
      className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
    >
      <SheetHeader>
        <SheetTitle>Tất cả mục</SheetTitle>
      </SheetHeader>

      {/* User info */}
      <div className="flex items-center gap-3 border-b px-1 py-3">
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full font-semibold">
          {user?.displayName?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{user?.displayName ?? "User"}</div>
          <div className="text-muted-foreground text-xs capitalize">
            {activeMembership?.roleCode?.replace("_", " ") ?? "—"}
          </div>
        </div>
      </div>

      {/* All nav grouped */}
      <div className="mt-4 space-y-4">
        {NAV_GROUPS.map((group) => (
          <section key={group.label}>
            <h3 className="text-muted-foreground mb-2 px-1 text-xs tracking-wider uppercase">
              {group.label}
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              {group.items.map((it) => {
                const Icon = it.icon;
                const active = isNavActive(it.url, pathname);
                return (
                  <li key={it.url}>
                    <Link
                      href={it.url}
                      onClick={onClose}
                      className={cn(
                        "flex min-h-[56px] items-center gap-3 rounded-lg border-2 p-3 transition-colors active:scale-95",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      <span className="text-sm leading-tight font-medium">{it.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <section>
          <ul className="space-y-1">
            {NAV_FOOTER.map((it) => {
              const Icon = it.icon;
              const active = isNavActive(it.url, pathname);
              return (
                <li key={it.url}>
                  <Link
                    href={it.url}
                    onClick={onClose}
                    className={cn(
                      "flex min-h-[48px] items-center gap-3 rounded-lg p-3 transition-colors",
                      active ? "bg-primary/10 text-primary" : "hover:bg-muted",
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className="text-sm font-medium">{it.title}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:bg-muted flex min-h-[48px] w-full items-center gap-3 rounded-lg p-3"
              >
                {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                <span className="text-sm font-medium">
                  {theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="hover:bg-muted text-destructive flex min-h-[48px] w-full items-center gap-3 rounded-lg p-3"
              >
                <LogOut className="size-5" />
                <span className="text-sm font-medium">Đăng xuất</span>
              </button>
            </li>
          </ul>
        </section>
      </div>
    </SheetContent>
  );
}

// Tránh unused import — re-export tránh lint
export { ALL_NAV_ITEMS };
