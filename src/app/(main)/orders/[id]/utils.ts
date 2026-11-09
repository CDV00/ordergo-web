import { ApiException } from "@/lib/api-client";
import type { Order } from "@/types/api";

/** Lấy message tiếng Việt từ lỗi API để hiện toast. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiException) return err.error?.message ?? "Có lỗi xảy ra";
  return "Có lỗi xảy ra, vui lòng thử lại";
}

export const ORDER_TYPE_LABEL: Record<Order["orderType"], string> = {
  dine_in: "Tại bàn",
  takeaway: "Mang về",
  delivery: "Giao hàng",
  online: "Đặt online",
  room_service: "Phục vụ phòng",
};

export const ORDER_SOURCE_LABEL: Record<Order["source"], string> = {
  qr_menu: "Khách tự gọi (QR)",
  pos: "POS",
  online: "Online",
  third_party: "Đối tác",
  phone: "Điện thoại",
};

/** Textarea thuần — dự án chưa có primitive textarea. */
export const TEXTAREA_CLASS =
  "border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none";
