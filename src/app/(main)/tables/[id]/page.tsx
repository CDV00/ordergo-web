"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuToggle } from "@/components/menu-toggle";
import { useOrders } from "@/hooks/api/use-orders";
import { useTables } from "@/hooks/api/use-tables";
import { TABLE_STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TABLE_STATUS_CLASS, TableInfoCard } from "./table-info-card";
import { TableOpenOrders } from "./table-open-orders";

function PageShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <MenuToggle />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <nav className="flex min-w-0 items-center gap-2 text-lg font-semibold">
          <Link href="/tables" className="text-muted-foreground hover:text-foreground shrink-0">
            Bàn ăn
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="truncate">{title}</span>
        </nav>
        {actions && <div className="ml-auto flex gap-2">{actions}</div>}
      </header>
      <main className="flex-1 space-y-4 p-4 md:p-6">{children}</main>
    </div>
  );
}

function Message({
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
            <Link href="/tables">
              <ArrowLeft className="mr-2 h-4 w-4" /> Về danh sách bàn
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tables = useTables();
  const orders = useOrders({ status: "open", tableId: id });
  const table = tables.data?.find((t) => t.id === id);

  // useTables chỉ chạy khi đã có venue — trước đó coi như đang tải
  if (tables.isPending) {
    return (
      <PageShell title="Đang tải…">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72" />
          <Skeleton className="h-72 lg:col-span-2" />
        </div>
      </PageShell>
    );
  }

  if (tables.isError) {
    return (
      <PageShell title="Lỗi">
        <Message
          title="Không tải được thông tin bàn"
          description="Vui lòng kiểm tra kết nối và thử lại."
          onRetry={() => tables.refetch()}
        />
      </PageShell>
    );
  }

  if (!table) {
    return (
      <PageShell title="Không tìm thấy">
        <Message
          title="Không tìm thấy bàn"
          description="Bàn không tồn tại, đã bị xoá hoặc thuộc cơ sở khác."
        />
      </PageShell>
    );
  }

  const hasOpenOrders = (orders.data?.length ?? 0) > 0;

  return (
    <PageShell
      title={table.name}
      actions={
        <Button asChild className="min-h-[40px]">
          <Link href="/pos">
            <Plus className="mr-1 h-4 w-4" /> Gọi món
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold sm:text-2xl">{table.name}</h1>
          <Badge className={cn("border-transparent", TABLE_STATUS_CLASS[table.status])}>
            {TABLE_STATUS_LABEL[table.status]}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {table.section ? `Khu ${table.section} · ` : ""}
          {table.capacity} chỗ
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TableInfoCard
          table={table}
          hasOpenOrders={hasOpenOrders}
          ordersUnknown={orders.isPending || orders.isError}
        />
        <div className="lg:col-span-2">
          <TableOpenOrders
            orders={orders.data}
            isLoading={orders.isLoading}
            isError={orders.isError}
            onRetry={() => orders.refetch()}
          />
        </div>
      </div>
    </PageShell>
  );
}
