const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

/** Origin của API (bỏ phần /v1) — ảnh upload được phục vụ tại `${API_ORIGIN}/uploads/...`. */
export const API_ORIGIN = API_URL.replace(/\/v\d+\/?$/, "");

/**
 * Ảnh do API lưu trả về đường dẫn tương đối `/uploads/...` → ghép origin API.
 * URL tuyệt đối (http/https/data) giữ nguyên. Rỗng → null.
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/uploads/")) return `${API_ORIGIN}${url}`;
  return url;
}
