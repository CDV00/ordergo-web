"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Highlight, HighlightItem } from "@/components/animate-ui/primitives/effects/highlight";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { isNavActive, type NavItem } from "@/lib/nav-config";
import { useVisibleNav } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  onClick?: () => void;
}

function NavLink({ item, collapsed, active, onClick }: NavLinkProps) {
  const Icon = item.icon;

  const inner = (
    <Link
      href={item.url}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative z-[1] flex h-10 items-center gap-3 rounded-lg text-sm transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "text-sidebar-accent-foreground font-semibold"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon
        className={cn("size-[18px] shrink-0 transition-colors", active && "text-sidebar-primary")}
        strokeWidth={active ? 2.4 : 2}
      />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );

  if (!collapsed) return inner;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className="font-medium">
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
}

interface NavListProps {
  collapsed: boolean;
  /** Khi click vào item — vd: đóng drawer trên tablet */
  onItemClick?: () => void;
}

/**
 * Danh sách điều hướng. Nền mục đang mở là 1 khối `Highlight` (animate-ui) trượt sang mục mới
 * mỗi khi đổi trang — người dùng thấy rõ mình vừa đi đâu.
 */
export function NavList({ collapsed, onItemClick }: NavListProps) {
  const pathname = usePathname();
  const { groups, footer } = useVisibleNav();
  const all = [...groups.flatMap((g) => g.items), ...footer];
  const activeUrl = all.find((i) => isNavActive(i.url, pathname))?.url ?? null;

  const renderItem = (item: NavItem) => (
    <HighlightItem key={item.url} value={item.url}>
      <div>
        <NavLink
          item={item}
          collapsed={collapsed}
          active={item.url === activeUrl}
          onClick={onItemClick}
        />
      </div>
    </HighlightItem>
  );

  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={0}>
      <Highlight
        value={activeUrl}
        click={false}
        controlledItems
        className="bg-sidebar-accent rounded-lg shadow-sm shadow-black/20"
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
      >
        <nav
          aria-label="Điều hướng chính"
          className="flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-2 py-3"
        >
          {groups.map((group) => (
            <section key={group.label} className="space-y-1">
              <h3
                className={cn(
                  "text-sidebar-foreground/45 px-3 text-[11px] font-semibold tracking-wider uppercase",
                  collapsed && "sr-only",
                )}
              >
                {group.label}
              </h3>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.url}>{renderItem(item)}</li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        {/* Footer items (Cài đặt) — phân tách bằng border */}
        <div className="border-sidebar-border shrink-0 space-y-0.5 border-t px-2 py-2">
          {footer.map(renderItem)}
        </div>
      </Highlight>
    </TooltipProvider>
  );
}
