"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV_GROUPS, NAV_FOOTER, isNavActive, type NavItem } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}

function NavLink({ item, collapsed, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const active = isNavActive(item.url, pathname);

  const inner = (
    <Link
      href={item.url}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-10 items-center gap-3 rounded-md text-sm transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon
        className={cn("size-5 shrink-0 transition-colors", active && "text-primary")}
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

export function NavList({ collapsed, onItemClick }: NavListProps) {
  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={0}>
      <nav
        aria-label="Điều hướng chính"
        className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-2 py-3"
      >
        {NAV_GROUPS.map((group) => (
          <section key={group.label} className="space-y-1">
            {/* Label chỉ hiện khi expanded */}
            <h3
              className={cn(
                "text-muted-foreground px-3 text-[11px] font-semibold tracking-wider uppercase",
                collapsed && "sr-only",
              )}
            >
              {group.label}
            </h3>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.url}>
                  <NavLink item={item} collapsed={collapsed} onClick={onItemClick} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>

      {/* Footer items (Settings) — phân tách bằng border */}
      <div className="border-sidebar-border shrink-0 space-y-0.5 border-t px-2 py-2">
        {NAV_FOOTER.map((item) => (
          <NavLink key={item.url} item={item} collapsed={collapsed} onClick={onItemClick} />
        ))}
      </div>
    </TooltipProvider>
  );
}
