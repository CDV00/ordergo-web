import type * as React from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Nút / bộ lọc bên phải tiêu đề */
  actions?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

/** Tiêu đề trang thống nhất: icon + tên + mô tả ngắn, hành động chính bên phải. */
export function PageHeader({ title, description, actions, icon: Icon, className }: Props) {
  return (
    <div
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Icon className="size-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
