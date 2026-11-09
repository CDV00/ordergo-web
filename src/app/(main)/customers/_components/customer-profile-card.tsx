"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useRevealCustomer,
  type CustomerDetail,
  type RevealedCustomer,
} from "@/hooks/api/use-customers";
import { ApiException } from "@/lib/api-client";
import { formatDateTime, formatVnd } from "@/lib/format";
import { displayName, errorMessage, StatusBadge } from "./customer-utils";

/** Thời gian hiện thông tin đầy đủ trước khi tự che lại. */
const REVEAL_SECONDS = 30;

function Row({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={`text-right text-sm font-medium break-all ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

/** "1990-05-17" → "17/05/1990" */
function formatYmd(ymd: string | null): string | null {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Hồ sơ khách: mặc định hiển thị bản đã che. "Hiện thông tin" gọi API reveal (chủ quán, có audit)
 * và chỉ giữ giá trị gốc trong state {REVEAL_SECONDS}s — không lưu cache/URL/localStorage.
 */
export function CustomerProfileCard({ customer }: { customer: CustomerDetail }) {
  const reveal = useRevealCustomer();
  const [revealed, setRevealed] = useState<{ data: RevealedCustomer; expiresAt: number } | null>(
    null,
  );
  const [now, setNow] = useState(() => Date.now());

  // Đếm ngược; hết hạn → che lại
  useEffect(() => {
    if (!revealed) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= revealed.expiresAt) setRevealed(null);
    }, 1000);
    return () => clearInterval(t);
  }, [revealed]);

  // Che lại khi chuyển khách khác hoặc khách vừa bị xoá dữ liệu
  useEffect(() => {
    setRevealed(null);
  }, [customer.id, customer.anonymizedAt]);

  const hide = () => setRevealed(null);
  const secondsLeft = revealed ? Math.max(0, Math.ceil((revealed.expiresAt - now) / 1000)) : 0;

  const onReveal = async () => {
    try {
      const data = await reveal.mutateAsync(customer.id);
      const n = Date.now();
      setNow(n);
      setRevealed({ data, expiresAt: n + REVEAL_SECONDS * 1000 });
    } catch (err) {
      if (err instanceof ApiException && err.status === 403) {
        toast.error("Chỉ chủ quán xem được thông tin đầy đủ");
      } else {
        toast.error(errorMessage(err));
      }
    }
  };

  const hasPii =
    !customer.anonymizedAt &&
    [customer.name, customer.phone, customer.email, customer.birthday].some((v) => v !== null);

  const raw = revealed?.data;
  const name = raw ? raw.name : customer.name;
  const phone = raw ? raw.phone : customer.phone;
  const email = raw ? raw.email : customer.email;
  const birthday = raw ? formatYmd(raw.birthday) : customer.birthday;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg sm:text-xl">
              {revealed ? (name ?? "Khách vãng lai") : displayName(name, customer.anonymizedAt)}
            </CardTitle>
            <CardDescription>
              Khách từ {formatDateTime(customer.createdAt)}
              {customer.marketingConsent && " · đồng ý nhận khuyến mãi"}
            </CardDescription>
          </div>
          <StatusBadge status={customer.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="divide-y">
          <Row label="Số điện thoại" value={phone} mono />
          <Row label="Email" value={email} />
          <Row label="Ngày sinh" value={birthday} />
          <Row label="Lượt ghé" value={String(customer.stats.visits)} />
          <Row label="Tổng chi tiêu" value={formatVnd(customer.stats.totalSpent.amount)} />
          <Row label="Lần đầu" value={formatDateTime(customer.stats.firstVisitAt)} />
          <Row label="Gần nhất" value={formatDateTime(customer.stats.lastVisitAt)} />
        </div>

        {customer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {customer.tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        )}
        {customer.note && (
          <p className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap">{customer.note}</p>
        )}

        {customer.anonymizedAt ? (
          <p className="text-muted-foreground text-sm">
            Dữ liệu cá nhân đã được xoá lúc {formatDateTime(customer.anonymizedAt)}. Thống kê và đơn
            hàng vẫn được giữ.
          </p>
        ) : (
          hasPii &&
          (revealed ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-sm dark:border-amber-800 dark:bg-amber-950/40">
              <span>Đang hiện thông tin đầy đủ · tự che sau {secondsLeft}s</span>
              <Button variant="outline" size="sm" className="min-h-[36px]" onClick={hide}>
                <EyeOff className="mr-1 h-4 w-4" />
                Che lại
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="min-h-[44px] w-full"
              onClick={onReveal}
              disabled={reveal.isPending}
            >
              <Eye className="mr-2 h-4 w-4" />
              {reveal.isPending ? "Đang tải..." : "Hiện thông tin"}
            </Button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
