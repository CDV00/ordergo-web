"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuToggle } from "@/components/menu-toggle";
import { useOrder } from "@/hooks/api/use-orders";
import { ApiException } from "@/lib/api-client";
import { ORDER_STATUS_CLASS, ORDER_STATUS_LABEL, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OPEN_ORDER_STATUSES } from "@/types/api";
import { OrderActions } from "./order-actions";
import { OrderInfoCard } from "./order-info-card";
import { OrderLinesCard } from "./order-lines-card";
import { OrderPaymentCard } from "./order-payment-card";
import { ORDER_TYPE_LABEL } from "./utils";

function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <MenuToggle />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <nav className="flex min-w-0 items-center gap-2 text-lg font-semibold">
          <Link href="/orders" className="text-muted-foreground hover:text-foreground shrink-0">
            Đơn hàng
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="truncate">{title}</span>
        </nav>
      </header>
      <main className="flex-1 space-y-4 p-4 md:p-6">{children}</main>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-11 w-full max-w-xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <div className="space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </>
  );
}

function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground max-w-md text-sm">{description}</p>
        <div className="flex gap-2">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Thử lại
            </Button>
          )}
          <Button asChild>
            <Link href="/orders">
              <ArrowLeft className="mr-2 h-4 w-4" /> Về danh sách đơn
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const order = useOrder(id);

  if (order.isPending) {
    return (
      <PageShell title="Đang tải…">
        <OrderSkeleton />
      </PageShell>
    );
  }

  if (order.isError || !order.data) {
    const notFound = order.error instanceof ApiException && order.error.status === 404;
    return (
      <PageShell title={notFound ? "Không tìm thấy" : "Lỗi"}>
        {notFound || !order.isError ? (
          <ErrorState
            title="Không tìm thấy đơn hàng"
            description="Đơn hàng không tồn tại hoặc đã bị xoá."
          />
        ) : (
          <ErrorState
            title="Không tải được đơn hàng"
            description={
              order.error instanceof ApiException
                ? order.error.error.message
                : "Vui lòng kiểm tra kết nối và thử lại."
            }
            onRetry={() => order.refetch()}
          />
        )}
      </PageShell>
    );
  }

  const o = order.data;
  const isOpen = OPEN_ORDER_STATUSES.includes(o.status);

  return (
    <PageShell title={o.orderNumber}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold sm:text-2xl">Đơn {o.orderNumber}</h1>
          <Badge className={cn("border-transparent", ORDER_STATUS_CLASS[o.status])}>
            {ORDER_STATUS_LABEL[o.status]}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {ORDER_TYPE_LABEL[o.orderType]}
          {o.tableName ? ` · ${o.tableName}` : ""} · Tạo lúc {formatDateTime(o.createdAt)}
          {o.paidAt ? ` · Thanh toán lúc ${formatDateTime(o.paidAt)}` : ""}
        </p>
      </div>

      <OrderActions order={o} isOpen={isOpen} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrderLinesCard order={o} isOpen={isOpen} />
        </div>
        <div className="space-y-4">
          <OrderPaymentCard order={o} />
          <OrderInfoCard order={o} />
        </div>
      </div>
    </PageShell>
  );
}
