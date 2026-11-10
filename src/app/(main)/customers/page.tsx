"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CUSTOMER_STATUS_LABEL,
  useCustomers,
  type CustomerStatus,
} from "@/hooks/api/use-customers";
import { CustomerList, CustomerListSkeleton } from "./_components/customer-list";
import { errorMessage, isForbidden } from "./_components/customer-utils";
import { CustomersShell, StateMessage } from "./_components/customers-shell";

const PAGE_SIZE = 20;
const STATUSES = Object.keys(CUSTOMER_STATUS_LABEL) as CustomerStatus[];

/** Giá trị trễ `delay` ms sau lần đổi cuối (debounce ô tìm kiếm). */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CustomersPage() {
  // Chuỗi tìm kiếm chỉ nằm trong state (không đưa lên URL — có thể là SĐT/tên khách).
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "all">("all");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim(), 350);

  // Đổi bộ lọc → về trang 1
  useEffect(() => setPage(1), [q, status]);

  const list = useCustomers({
    q: q || undefined,
    status: status === "all" ? undefined : status,
    page,
    pageSize: PAGE_SIZE,
  });

  const total = list.data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <CustomersShell description="Thông tin cá nhân được che — mở chi tiết để xem thẻ thành viên và lịch sử">
      <div className="bg-muted/40 flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-end sm:p-4">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="customer-search" className="text-xs">
              Tìm khách
            </Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="customer-search"
                type="search"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Số điện thoại hoặc tên"
                maxLength={100}
                className="min-h-[44px] pl-9 sm:w-[300px]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Trạng thái</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                if (v) setStatus(v as CustomerStatus | "all");
              }}
            >
              <SelectTrigger className="min-h-[44px] w-full sm:w-[170px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {CUSTOMER_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isForbidden(list.error) ? (
        <StateMessage
          title="Bạn không có quyền xem khách hàng"
          description="Chỉ thu ngân, quản lý hoặc chủ quán mới xem được danh sách khách."
        />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Danh sách khách</CardTitle>
            <CardDescription>
              {list.data ? `${total} khách · ghé gần nhất trước` : "Đang tải..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {list.isLoading ? (
              <CustomerListSkeleton />
            ) : list.error ? (
              <StateMessage
                title="Không tải được danh sách khách"
                description={errorMessage(list.error)}
                action={
                  <Button className="min-h-[44px]" onClick={() => void list.refetch()}>
                    Thử lại
                  </Button>
                }
              />
            ) : (
              <div className={list.isPlaceholderData ? "opacity-60 transition-opacity" : ""}>
                <CustomerList customers={list.data?.data ?? []} searching={!!q} />
              </div>
            )}

            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-sm">
                  Trang {page}/{totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="min-h-[44px]"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-[44px]"
                    disabled={page >= totalPages || list.isPlaceholderData}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </CustomersShell>
  );
}
