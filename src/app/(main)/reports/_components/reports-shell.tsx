"use client";

import type { ReactNode } from "react";
import { BarChart3, ShieldAlert } from "lucide-react";
import { MenuToggle } from "@/components/menu-toggle";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";

/** Khung trang báo cáo: tiêu đề (MenuToggle + PageHeader + hành động) và nội dung. */
export function ReportsShell({
  description,
  actions,
  children,
}: {
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <FadeIn className="flex items-start gap-2">
        <MenuToggle className="mt-1" />
        <PageHeader
          className="min-w-0 flex-1"
          icon={BarChart3}
          title="Báo cáo bán hàng"
          description={description}
          actions={actions}
        />
      </FadeIn>
      {children}
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
    <EmptyState
      icon={ShieldAlert}
      title={title}
      description={description}
      className="bg-muted/30"
      action={
        onRetry && (
          <Button className="mt-1" onClick={onRetry}>
            Thử lại
          </Button>
        )
      }
    />
  );
}
