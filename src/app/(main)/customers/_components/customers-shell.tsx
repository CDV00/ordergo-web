"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, SearchX, Users } from "lucide-react";
import { MenuToggle } from "@/components/menu-toggle";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";

/**
 * Khung trang khách hàng. Trang danh sách: PageHeader "Khách hàng" + mô tả + hành động.
 * Trang chi tiết (`title`): breadcrumb "Khách hàng › tên" + tiêu đề tên khách.
 */
export function CustomersShell({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <FadeIn className="flex items-start gap-2">
        <MenuToggle className="mt-1" />
        {title ? (
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <nav
                aria-label="Đường dẫn"
                className="text-muted-foreground flex items-center gap-1 text-xs font-medium"
              >
                <Link href="/customers" className="hover:text-foreground transition-colors">
                  Khách hàng
                </Link>
                <ChevronRight className="size-3.5 shrink-0" />
                <span className="truncate">{title}</span>
              </nav>
              <h1 className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl">
                {title}
              </h1>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        ) : (
          <PageHeader
            className="min-w-0 flex-1"
            icon={Users}
            title="Khách hàng"
            description={description}
            actions={actions}
          />
        )}
      </FadeIn>
      <FadeIn delay={0.05} className="space-y-6">
        {children}
      </FadeIn>
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
    <EmptyState
      icon={SearchX}
      className="bg-muted/30"
      title={title}
      description={description}
      action={
        (action || backLink) && (
          <div className="mt-1 flex gap-2">
            {action}
            {backLink && (
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/customers">Quay lại danh sách khách</Link>
              </Button>
            )}
          </div>
        )
      }
    />
  );
}
