"use client";

import type { ReactNode } from "react";
import { MenuToggle } from "@/components/menu-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/** Khung trang báo cáo: header (MenuToggle + tiêu đề) và nội dung. */
export function ReportsShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <MenuToggle />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Báo cáo</h1>
      </header>
      <main className="flex-1 space-y-4 p-4 md:p-6">{children}</main>
    </div>
  );
}

/** Thông báo trạng thái (không có quyền / lỗi). */
export function StateMessage({
  title,
  description,
  onRetry,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-lg font-semibold">{title}</p>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
        {onRetry && (
          <Button className="mt-2 min-h-[44px]" onClick={onRetry}>
            Thử lại
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
