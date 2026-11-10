"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { LayoutGroup, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ALL_NAV_ITEMS, isNavActive } from "@/lib/nav-config";
import { useVisibleNav } from "@/hooks/use-permissions";
import { useAuth } from "@/contexts/auth-context";
import { useLogout } from "@/hooks/api/use-auth";
import { VenueSwitcher } from "./venue-switcher";

/** Nền "viên thuốc" sau icon của mục đang mở — trượt giữa các mục (motion layoutId). */
function ActivePill() {
  return (
    <motion.span
      layoutId="mobile-nav-active"
      aria-hidden
      className="bg-primary/12 absolute inset-x-1.5 inset-y-1 -z-[1] rounded-2xl"
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
    />
  );
}

const itemClass = (active: boolean) =>
  cn(
    "relative isolate flex h-full w-full flex-col items-center justify-center gap-1 transition-colors active:scale-95",
    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
  );

/** Bottom nav (chỉ mobile): ẩn trên md+, cố định đáy, safe-area inset cho iOS */
export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { mobile } = useVisibleNav();

  const moreActive = !mobile.some((it) => isNavActive(it.url, pathname));

  return (
    <nav
      role="navigation"
      aria-label="Điều hướng chính"
      className="bg-card/90 supports-[backdrop-filter]:bg-card/75 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-8px_rgb(0_0_0/0.12)] backdrop-blur-lg md:hidden"
    >
      <LayoutGroup id="mobile-bottom-nav">
        <ul className="grid h-16 grid-cols-5 px-1">
          {mobile.map((it) => {
            const active = isNavActive(it.url, pathname);
            const Icon = it.icon;
            return (
              <li key={it.url}>
                <Link
                  href={it.url}
                  aria-current={active ? "page" : undefined}
                  className={itemClass(active)}
                >
                  {active && <ActivePill />}
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
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
                <button type="button" className={itemClass(moreActive)}>
                  {moreActive && <ActivePill />}
                  <Menu className="size-5" strokeWidth={moreActive ? 2.4 : 2} />
                  <span className={cn("text-[11px] leading-none", moreActive && "font-semibold")}>
                    Khác
                  </span>
                </button>
              </SheetTrigger>
              <MoreSheet onClose={() => setMoreOpen(false)} pathname={pathname} />
            </Sheet>
          </li>
        </ul>
      </LayoutGroup>
    </nav>
  );
}

function MoreSheet({ onClose, pathname }: { onClose: () => void; pathname: string }) {
  const { groups, footer } = useVisibleNav();
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
      className="max-h-[85vh] overflow-y-auto rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
    >
      <div className="bg-border mx-auto mt-2 h-1.5 w-10 rounded-full" aria-hidden />
      <SheetHeader>
        <SheetTitle>Tất cả mục</SheetTitle>
      </SheetHeader>

      {/* User info */}
      <div className="sidebar-scope bg-sidebar text-sidebar-foreground mx-4 space-y-2 rounded-2xl p-3 shadow-md">
        <div className="flex items-center gap-3 px-1">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-10 items-center justify-center rounded-full font-semibold">
            {user?.displayName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{user?.displayName ?? "User"}</div>
            <div className="text-muted-foreground text-xs capitalize">
              {activeMembership?.roleCode?.replace("_", " ") ?? "—"}
            </div>
          </div>
        </div>

        {/* Cơ sở đang làm việc (đổi được nếu vào nhiều cơ sở) */}
        <div className="border-sidebar-border border-t pt-2">
          <VenueSwitcher onSwitched={onClose} />
        </div>
      </div>

      {/* All nav grouped */}
      <div className="space-y-5 px-4 pt-4 pb-4">
        {groups.map((group) => (
          <section key={group.label}>
            <h3 className="text-muted-foreground mb-2 px-1 text-[11px] font-semibold tracking-wider uppercase">
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
                        "flex min-h-[56px] items-center gap-3 rounded-xl border p-3 shadow-xs transition-colors active:scale-95",
                        active
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "bg-card hover:border-primary/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          active ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="text-sm leading-tight font-medium">{it.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <section>
          <ul className="bg-muted/40 space-y-0.5 rounded-xl border p-1">
            {footer.map((it) => {
              const Icon = it.icon;
              const active = isNavActive(it.url, pathname);
              return (
                <li key={it.url}>
                  <Link
                    href={it.url}
                    onClick={onClose}
                    className={cn(
                      "flex min-h-[48px] items-center gap-3 rounded-lg p-3 transition-colors",
                      active ? "bg-primary/10 text-primary" : "hover:bg-card",
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
                className="hover:bg-card flex min-h-[48px] w-full items-center gap-3 rounded-lg p-3"
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
                className="hover:bg-destructive/10 text-destructive flex min-h-[48px] w-full items-center gap-3 rounded-lg p-3"
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
