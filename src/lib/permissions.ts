/**
 * Kiểm quyền phía client — CHỈ để ẩn/hiện giao diện. API mới là nơi chặn thật.
 * Luật khớp `common/auth/permissions.ts` ở API:
 *  - `*` có mọi quyền
 *  - `<resource>.manage` bao gồm mọi `<resource>.*`
 */
export function hasPermission(granted: readonly string[], required?: string | null): boolean {
  if (!required) return true;
  if (granted.includes("*") || granted.includes(required)) return true;
  const dot = required.indexOf(".");
  return dot > 0 && granted.includes(`${required.substring(0, dot)}.manage`);
}
