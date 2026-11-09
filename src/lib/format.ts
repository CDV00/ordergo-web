import type { KitchenStatus, OrderStatus, TableStatus } from "@/types/api";

const vndFormatter = new Intl.NumberFormat("vi-VN");

/** 25000 → "25.000đ" */
export function formatVnd(n: number): string {
  return `${vndFormatter.format(Math.round(n))}đ`;
}

/** ISO → "14:05" theo giờ máy (quán chạy ở VN) */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

/** ISO → "09/11/2026 14:05" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Hôm nay theo giờ máy, dạng YYYY-MM-DD (input type=date, query API). */
export function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Số phút kể từ ISO tới hiện tại. */
export function minutesSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Nháp",
  sent: "Đã gửi bếp",
  in_progress: "Bếp đang làm",
  ready: "Món đã xong",
  served: "Đã phục vụ",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
  cancelled: "Đã huỷ",
};

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  sent: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  in_progress: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  ready: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  served: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  refunded: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

export const KITCHEN_STATUS_LABEL: Record<KitchenStatus, string> = {
  queued: "Chờ làm",
  preparing: "Đang làm",
  ready: "Xong",
  served: "Đã phục vụ",
  cancelled: "Đã huỷ",
};

export const KITCHEN_STATUS_CLASS: Record<KitchenStatus, string> = {
  queued: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  ready: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  served: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-800 line-through dark:bg-red-900/50 dark:text-red-300",
};

export const TABLE_STATUS_LABEL: Record<TableStatus, string> = {
  available: "Trống",
  occupied: "Có khách",
  reserved: "Đã đặt",
  cleaning: "Cần dọn",
  out_of_order: "Tạm ngưng",
};
