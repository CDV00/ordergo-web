import type { ApiException } from "@/lib/api-client";

/** Dòng báo lỗi nhỏ dưới ô nhập. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}

/** Lỗi từ API (kể cả 403 không đủ quyền) → message tiếng Việt của server. */
export function apiErrorMessage(err: unknown): string {
  const e = err as ApiException;
  if (e?.error?.message) return e.error.message;
  if (e?.status === 403) return "Bạn không có quyền thay đổi cài đặt cơ sở";
  return "Có lỗi xảy ra, vui lòng thử lại";
}

/** "Nguyễn Văn Á" → "NGUYEN VAN A" (tên chủ tài khoản theo chuẩn ngân hàng). */
export function toBankAccountName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

export const textareaClass =
  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";
