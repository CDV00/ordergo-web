"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CustomerListItem } from "@/hooks/api/use-customers";
import { formatDateTime, formatVnd } from "@/lib/format";
import { displayName, TierBadge } from "./customer-utils";

export function CustomerListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function Loyalty({ c }: { c: CustomerListItem }) {
  if (!c.loyalty) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="tabular-nums">{c.loyalty.points.toLocaleString("vi-VN")} điểm</span>
      <TierBadge tier={c.loyalty.tier} />
    </div>
  );
}

/** Bảng khách (desktop) / thẻ (mobile). Tên + SĐT luôn là bản đã che từ server. */
export function CustomerList({
  customers,
  searching,
}: {
  customers: CustomerListItem[];
  searching: boolean;
}) {
  const router = useRouter();

  if (customers.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        {searching
          ? "Không tìm thấy khách phù hợp. Thử số điện thoại đầy đủ hoặc một phần tên."
          : "Chưa có khách hàng nào. Khách sẽ xuất hiện khi gọi món qua QR hoặc được gắn vào đơn."}
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead className="text-right">Lượt ghé</TableHead>
              <TableHead className="text-right">Tổng chi tiêu</TableHead>
              <TableHead>Lần gần nhất</TableHead>
              <TableHead className="text-right">Điểm / hạng</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                onClick={() => router.push(`/customers/${c.id}`)}
              >
                <TableCell className="font-medium">
                  <Link
                    href={`/customers/${c.id}`}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {displayName(c.name, c.anonymizedAt)}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-sm">{c.phone ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{c.visits}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVnd(c.totalSpent.amount)}
                </TableCell>
                <TableCell className="tabular-nums">{formatDateTime(c.lastVisitAt)}</TableCell>
                <TableCell>
                  <Loyalty c={c} />
                </TableCell>
                <TableCell>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-2 md:hidden">
        {customers.map((c) => (
          <Link key={c.id} href={`/customers/${c.id}`} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex min-h-[44px] items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">
                      {displayName(c.name, c.anonymizedAt)}
                    </span>
                    {c.loyalty && <TierBadge tier={c.loyalty.tier} />}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    <span className="font-mono">{c.phone ?? "—"}</span> · {c.visits} lượt ·{" "}
                    {formatDateTime(c.lastVisitAt)}
                  </div>
                </div>
                <div className="text-right text-sm tabular-nums">
                  <div className="font-semibold">{formatVnd(c.totalSpent.amount)}</div>
                  {c.loyalty && (
                    <div className="text-muted-foreground text-xs">
                      {c.loyalty.points.toLocaleString("vi-VN")} điểm
                    </div>
                  )}
                </div>
                <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
