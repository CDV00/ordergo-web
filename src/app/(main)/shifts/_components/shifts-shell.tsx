"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight, SearchX } from "lucide-react";
import { MenuToggle } from "@/components/menu-toggle";
import { Button } from "@/components/ui/button";
import type { ApiException } from "@/lib/api-client";

/**
 * Khung trang ca làm. Trang danh sách truyền `header` (PageHeader);
 * trang chi tiết truyền `title` → hiện breadcrumb "Ca làm / …".
 */
export function ShiftsShell({
  title,
  header,
  children,
}: {
  title?: string;
  header?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      {title ? (
        <div className="flex items-center gap-2">
          <MenuToggle />
          <Button asChild variant="ghost" size="icon" aria-label="Về danh sách ca">
            <Link href="/shifts">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <nav className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <Link href="/shifts" className="text-muted-foreground hover:text-foreground">
              Ca làm
            </Link>
            <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            <span className="truncate">{title}</span>
          </nav>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <MenuToggle className="mt-0.5" />
          <div className="min-w-0 flex-1">{header}</div>
        </div>
      )}
      {children}
    </div>
  );
}

/** Thông báo trạng thái (không có quyền / lỗi / không tìm thấy). */
export function StateMessage({
  title,
  description,
  backLink,
  action,
}: {
  title: string;
  description?: string;
  backLink?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center">
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <SearchX className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold">{title}</p>
        {description && <p className="text-muted-foreground max-w-md text-sm">{description}</p>}
      </div>
      {(action || backLink) && (
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {action}
          {backLink && (
            <Button asChild variant="outline" className="h-11">
              <Link href="/shifts">Quay lại danh sách ca</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function errorMessage(err: unknown): string {
  return (err as ApiException | null)?.error?.message ?? "Đã có lỗi xảy ra, vui lòng thử lại.";
}

export function isForbidden(err: unknown): boolean {
  return (err as ApiException | null)?.status === 403;
}

export function isNotFound(err: unknown): boolean {
  return (err as ApiException | null)?.status === 404;
}
