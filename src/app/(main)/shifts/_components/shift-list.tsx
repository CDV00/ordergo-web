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
import type { Shift } from "@/hooks/api/use-shifts";
import { formatDateTime, formatTime, formatVnd } from "@/lib/format";
import { DifferenceBadge } from "../../pos/_components/shift-summary";

const money = (n: number | null) => (n == null ? "—" : formatVnd(n));

/** "08:02 → 16:30" (cùng ngày) hoặc ngày giờ đầy đủ. */
function timeRange(s: Shift): string {
  if (!s.closedAt) return `${formatDateTime(s.openedAt)} → đang mở`;
  const sameDay = new Date(s.openedAt).toDateString() === new Date(s.closedAt).toDateString();
  return sameDay
    ? `${formatDateTime(s.openedAt)} → ${formatTime(s.closedAt)}`
    : `${formatDateTime(s.openedAt)} → ${formatDateTime(s.closedAt)}`;
}

export function ShiftListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** Bảng ca (desktop) / thẻ (mobile). Mỗi dòng mở trang chi tiết ca. */
export function ShiftList({ shifts }: { shifts: Shift[] }) {
  const router = useRouter();

  if (shifts.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        Không có ca nào trong khoảng ngày này.
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
              <TableHead>Thời gian</TableHead>
              <TableHead>Người mở ca</TableHead>
              <TableHead className="text-right">Đầu ca</TableHead>
              <TableHead className="text-right">Dự kiến</TableHead>
              <TableHead className="text-right">Đếm được</TableHead>
              <TableHead>Chênh lệch</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer"
                onClick={() => router.push(`/shifts/${s.id}`)}
              >
                <TableCell className="tabular-nums">
                  <Link
                    href={`/shifts/${s.id}`}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {timeRange(s)}
                  </Link>
                </TableCell>
                <TableCell>{s.openedByName ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{money(s.openingCash)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(s.expectedCash)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(s.countedCash)}</TableCell>
                <TableCell>
                  <DifferenceBadge shift={s} />
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
        {shifts.map((s) => (
          <Link key={s.id} href={`/shifts/${s.id}`} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex min-h-[44px] items-center gap-3 p-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums">{timeRange(s)}</span>
                    <DifferenceBadge shift={s} />
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {s.openedByName ?? "—"} · đầu ca {money(s.openingCash)}
                  </div>
                  <div className="text-muted-foreground text-xs tabular-nums">
                    Dự kiến {money(s.expectedCash)} · đếm {money(s.countedCash)}
                  </div>
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
