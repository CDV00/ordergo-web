"use client";

import { useState } from "react";
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
import { PAYMENT_METHOD_LABEL, usePayments, type PaymentMethod } from "@/hooks/api/use-payments";
import { todayYmd } from "@/lib/format";
import { PaymentList, PaymentListSkeleton } from "./_components/payment-list";
import { errorMessage, isForbidden } from "./_components/payment-status";
import { PaymentSummary } from "./_components/payment-summary";
import { PaymentsShell, StateMessage } from "./_components/payments-shell";

/** API trả tối đa 500 giao dịch mỗi lần. */
const PAGE_LIMIT = 500;

const METHODS = Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[];

export default function PaymentsPage() {
  const [date, setDate] = useState(todayYmd);
  const [method, setMethod] = useState<PaymentMethod | "all">("all");

  // Tổng hợp luôn tính trên mọi phương thức của ngày; danh sách thì theo bộ lọc.
  // Khi chọn "Tất cả" hai query cùng key nên chỉ gọi API một lần.
  const day = usePayments({ from: date, to: date });
  const list = usePayments({
    from: date,
    to: date,
    method: method === "all" ? undefined : method,
  });

  const forbidden = isForbidden(day.error) || isForbidden(list.error);
  const listError = list.error ?? day.error;

  return (
    <PaymentsShell>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Lịch sử thanh toán</h2>
          <p className="text-muted-foreground text-sm">Các khoản đã thu trong ngày</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="payment-date" className="text-xs">
              Ngày
            </Label>
            <Input
              id="payment-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayYmd())}
              className="min-h-[44px] sm:w-[170px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Phương thức</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod | "all")}>
              <SelectTrigger className="min-h-[44px] w-full sm:w-[190px]">
                <SelectValue placeholder="Phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {forbidden ? (
        <StateMessage
          title="Bạn không có quyền xem thanh toán"
          description="Chỉ thu ngân, quản lý hoặc chủ quán mới xem được lịch sử thanh toán."
        />
      ) : (
        <>
          <PaymentSummary payments={day.data} loading={day.isLoading} />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">Danh sách giao dịch</CardTitle>
              <CardDescription>
                {list.data
                  ? `${list.data.length} giao dịch · mới nhất trước`
                  : "Chọn một giao dịch để xem chi tiết"}
                {list.data?.length === PAGE_LIMIT && " · chỉ hiển thị 500 giao dịch gần nhất"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {list.isLoading ? (
                <PaymentListSkeleton />
              ) : listError ? (
                <StateMessage
                  title="Không tải được danh sách thanh toán"
                  description={errorMessage(listError)}
                  action={
                    <Button
                      className="min-h-[44px]"
                      onClick={() => {
                        void day.refetch();
                        void list.refetch();
                      }}
                    >
                      Thử lại
                    </Button>
                  }
                />
              ) : (
                <PaymentList payments={list.data ?? []} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PaymentsShell>
  );
}
