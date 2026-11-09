"use client";

import Link from "next/link";
import { Building2, Check, ChevronsUpDown, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAccessibleVenues } from "@/hooks/api/use-tenant";
import { usePermissions } from "@/hooks/use-permissions";
import { useSwitchVenue } from "@/hooks/use-switch-venue";
import { cn } from "@/lib/utils";

interface Props {
  collapsed?: boolean;
  /** Gọi sau khi chọn (vd đóng drawer / sheet). */
  onSwitched?: () => void;
  className?: string;
}

/**
 * Cơ sở đang làm việc. Người vào được >1 cơ sở (toàn chuỗi hoặc nhiều membership) bấm để đổi;
 * còn lại chỉ hiện tên cơ sở.
 */
export function VenueSwitcher({ collapsed = false, onSwitched, className }: Props) {
  const { venues, activeVenue, tenantWide } = useAccessibleVenues();
  const { can } = usePermissions();
  const switchTo = useSwitchVenue();
  const canSwitch = venues.length > 1;
  const name = activeVenue?.name ?? "Chưa chọn cơ sở";

  const body = (
    <>
      <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
        <Building2 className="size-4" />
      </div>
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1 text-left leading-tight">
            <div className="text-muted-foreground text-[11px]">Cơ sở</div>
            <div className="truncate text-sm font-medium" data-testid="active-venue-name">
              {name}
            </div>
          </div>
          {canSwitch && <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />}
        </>
      )}
    </>
  );

  const boxClass = cn(
    "flex h-12 w-full items-center gap-3 rounded-md",
    collapsed ? "justify-center px-0" : "px-2",
    className,
  );

  if (!canSwitch) {
    const box = (
      <div className={boxClass} aria-label={`Cơ sở: ${name}`}>
        {body}
      </div>
    );
    return collapsed ? <WithTooltip label={name}>{box}</WithTooltip> : box;
  }

  const trigger = (
    <button
      type="button"
      className={cn(
        boxClass,
        "hover:bg-sidebar-accent focus-visible:ring-ring transition-colors outline-none focus-visible:ring-2",
      )}
      aria-label={`Đổi cơ sở (đang chọn: ${name})`}
    >
      {body}
    </button>
  );

  return (
    <DropdownMenu>
      {collapsed ? (
        <WithTooltip label={name}>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        </WithTooltip>
      ) : (
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        side={collapsed ? "right" : "bottom"}
        align="start"
        className="max-h-80 min-w-60 overflow-y-auto"
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          Chuyển cơ sở
        </DropdownMenuLabel>
        {venues.map((v) => {
          const active = v.id === activeVenue?.id;
          return (
            <DropdownMenuItem
              key={v.id}
              onClick={() => {
                if (active) return;
                switchTo(v.id);
                toast.success(`Đang làm việc tại ${v.name}`);
                onSwitched?.();
              }}
              className="gap-2"
            >
              <Check className={cn("size-4", !active && "invisible")} />
              <span className="min-w-0 flex-1 truncate">{v.name}</span>
              <span className="text-muted-foreground text-xs">{v.code}</span>
            </DropdownMenuItem>
          );
        })}
        {tenantWide && can("venue.manage") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/venues" onClick={onSwitched} className="gap-2">
                <Settings2 className="size-4" /> Quản lý chi nhánh
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WithTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
