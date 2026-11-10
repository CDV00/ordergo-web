"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronRight, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuToggle } from "@/components/menu-toggle";
import { useOrder } from "@/hooks/api/use-orders";
import { ApiException } from "@/lib/api-client";
import { OPEN_ORDER_STATUSES } from "@/types/api";
import { OrderActions } from "./order-actions";
import { OrderHeader } from "./order-header";
import { OrderInfoCard } from "./order-info-card";
import { OrderLinesCard } from "./order-lines-card";
import { OrderPaymentCard } from "./order-payment-card";

function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <MenuToggle />
        <Button asChild variant="ghost" size="icon" aria-label="Về danh sách đơn">
          <Link href="/orders">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <nav className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <Link href="/orders" className="text-muted-foreground hover:text-foreground shrink-0">
            Đơn hàng
          </Link>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" />
          <span className="truncate">{title}</span>
        </nav>
      </div>
      {children}
    </div>
  );
}

function OrderSkeleton() {
  return (
    <>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-11 w-full max-w-xl rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
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
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <SearchX className="size-6" />
        </div>
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
              <ArrowLeft className="size-4" /> Về danh sách đơn
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
      <OrderHeader order={o}>
        {/* Đơn đã huỷ không còn hành động nào (kể cả in hoá đơn) */}
        {(isOpen || o.status !== "cancelled") && <OrderActions order={o} isOpen={isOpen} />}
      </OrderHeader>

      <div className="grid items-start gap-4 lg:grid-cols-3">
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
