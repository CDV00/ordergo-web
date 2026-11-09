"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { MenuToggle } from "@/components/menu-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ApiException } from "@/lib/api-client";

/** Khung trang ca làm: header (MenuToggle + tiêu đề/breadcrumb) và nội dung. */
export function ShiftsShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <MenuToggle />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <nav className="flex min-w-0 items-center gap-1 text-lg font-semibold">
          {title ? (
            <>
              <Link href="/shifts" className="text-muted-foreground hover:text-foreground">
                Ca làm
              </Link>
              <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
              <span className="truncate">{title}</span>
            </>
          ) : (
            <h1>Ca làm</h1>
          )}
        </nav>
      </header>
      <main className="flex-1 space-y-4 p-4 md:p-6">{children}</main>
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
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-lg font-semibold">{title}</p>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
        <div className="mt-2 flex gap-2">
          {action}
          {backLink && (
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/shifts">Quay lại danh sách ca</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
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
