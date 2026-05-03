"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Store, AlertCircle } from "lucide-react";
import { useScanQr } from "@/hooks/api/use-public";
import { PublicApiException } from "@/lib/public-api-client";

/**
 * Trang đầu khi khách scan QR.
 * URL: /m/{tenantSlug}/t/{tableId}
 *
 * Flow:
 * 1. Auto POST /public/qr/{tenantSlug}/{tableId}
 * 2. Backend tạo/join session + customer, set cookies
 * 3. Lưu sessionId vào localStorage cho FE state
 * 4. Redirect → /m/{tenantSlug}/menu?s={sessionId}
 *
 * Nếu session đã có người (case khách scan + bàn đang phục vụ):
 *   isNewSession=false → hiện confirm "Bạn đang ngồi cùng nhóm?"
 */
export default function ScanEntryPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const tableId = params.tableId as string;

  const scan = useScanQr();
  const [needsJoinConfirm, setNeedsJoinConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantSlug || !tableId) return;
    scan
      .mutateAsync({ tenantSlug, tableId })
      .then((result) => {
        sessionStorage.setItem("ordergo.session.id", result.session.id);
        sessionStorage.setItem("ordergo.session.tableName", result.session.tableName);
        sessionStorage.setItem("ordergo.session.venueId", result.session.venueId);

        // Existing session với khác customer → confirm join
        if (!result.isNewSession && !result.isNewCustomer) {
          // Cùng cookie → silent continue
          router.replace(`/m/${tenantSlug}/menu`);
        } else if (!result.isNewSession && result.isNewCustomer) {
          // Có session đang chạy + customer mới → cần xác nhận
          setNeedsJoinConfirm(true);
        } else {
          router.replace(`/m/${tenantSlug}/menu`);
        }
      })
      .catch((err: PublicApiException) => {
        setError(err.error?.message ?? "Không thể quét QR. Vui lòng thử lại.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, tableId]);

  if (error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="text-destructive mb-4 size-16" />
        <h1 className="mb-2 text-xl font-semibold">Không thể quét QR</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground rounded-lg px-6 py-3 font-semibold"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (needsJoinConfirm && scan.data) {
    const orderCount = scan.data.session.orderCount;
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-amber-50 p-6 text-center dark:bg-amber-950/30">
        <div className="mb-4 rounded-full bg-amber-100 p-4 dark:bg-amber-900">
          <AlertCircle className="size-12 text-amber-700 dark:text-amber-400" />
        </div>
        <h1 className="mb-2 text-xl font-bold">Bàn này đang phục vụ</h1>
        <p className="text-muted-foreground mb-1">
          Bàn <strong>{scan.data.session.tableName}</strong> đang có{" "}
          <strong>{orderCount} đơn</strong> đang chạy.
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          Bạn đang cùng nhóm? Đặt thêm món sẽ vào cùng hoá đơn này.
        </p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={() => router.replace(`/m/${tenantSlug}/menu`)}
            className="bg-primary text-primary-foreground rounded-lg py-3.5 font-semibold transition-transform active:scale-95"
          >
            Vâng, tôi cùng nhóm — Đặt thêm
          </button>
          <button
            onClick={() => {
              sessionStorage.clear();
              setError("Vui lòng liên hệ nhân viên để được hướng dẫn.");
            }}
            className="bg-muted text-foreground rounded-lg py-3 font-medium"
          >
            Tôi không phải bàn này
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 text-center">
      <div className="bg-primary/10 mb-4 rounded-full p-4">
        <Store className="text-primary size-12" />
      </div>
      <h1 className="mb-2 text-xl font-semibold">Đang kết nối với quán...</h1>
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
    </div>
  );
}
