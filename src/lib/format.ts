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

/**
 * Màu trạng thái: nền nhạt + chữ đậm (không tô đặc) — dễ đọc trên tablet, không chói.
 * Dùng token ngữ nghĩa (success/warning/info/primary) để tự đổi theo dark mode.
 */
const WARNING_TEXT = "text-[oklch(0.5_0.12_70)] dark:text-warning";

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: `bg-warning-soft ${WARNING_TEXT}`,
  in_progress: "bg-primary/10 text-primary dark:bg-primary/20",
  ready: "bg-info-soft text-info",
  served: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  paid: "bg-success-soft text-success",
  refunded: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  cancelled:
    "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive-foreground",
};

export const KITCHEN_STATUS_LABEL: Record<KitchenStatus, string> = {
  queued: "Chờ làm",
  preparing: "Đang làm",
  ready: "Xong",
  served: "Đã phục vụ",
  cancelled: "Đã huỷ",
};

export const KITCHEN_STATUS_CLASS: Record<KitchenStatus, string> = {
  queued: `bg-warning-soft ${WARNING_TEXT}`,
  preparing: "bg-primary/10 text-primary dark:bg-primary/20",
  ready: "bg-info-soft text-info",
  served: "bg-success-soft text-success",
  cancelled:
    "bg-destructive/10 text-destructive line-through dark:bg-destructive/20 dark:text-destructive-foreground",
};

export const TABLE_STATUS_LABEL: Record<TableStatus, string> = {
  available: "Trống",
  occupied: "Có khách",
  reserved: "Đã đặt",
  cleaning: "Cần dọn",
  out_of_order: "Tạm ngưng",
};

/** Chip trạng thái bàn (nền nhạt + chữ đậm). */
export const TABLE_STATUS_CLASS: Record<TableStatus, string> = {
  available: "bg-success-soft text-success",
  occupied: "bg-primary/10 text-primary dark:bg-primary/20",
  reserved: "bg-info-soft text-info",
  cleaning: `bg-warning-soft ${WARNING_TEXT}`,
  out_of_order: "bg-muted text-muted-foreground",
};

/** Chấm màu trạng thái bàn (chú thích + thẻ bàn). */
export const TABLE_STATUS_DOT: Record<TableStatus, string> = {
  available: "bg-success",
  occupied: "bg-primary",
  reserved: "bg-info",
  cleaning: "bg-warning",
  out_of_order: "bg-muted-foreground/50",
};

/** Viền nhấn bên trái của thẻ bàn. */
export const TABLE_STATUS_ACCENT: Record<TableStatus, string> = {
  available: "border-l-success",
  occupied: "border-l-primary",
  reserved: "border-l-info",
  cleaning: "border-l-warning",
  out_of_order: "border-l-muted-foreground/40",
};
