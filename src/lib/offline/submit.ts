"use client";

import { ApiException } from "@/lib/api-client";
import type { Order } from "@/types/api";
import { enqueue, executeStep } from "./outbox";
import { applyFailure, applySuccess, classifyError, type OutboxItem } from "./outbox-core";

export type SubmitOutcome =
  /** Đã gửi bếp online; `order` = đơn sau bước cuối. */
  | { kind: "sent"; order: Order; created: boolean }
  /** Đã lưu vào hàng đợi offline (toàn bộ hoặc phần còn lại của chuỗi). */
  | { kind: "queued" };

/**
 * Chạy chuỗi bước của 1 lần "Gửi bếp"/"Gửi thêm":
 *  - đang offline, hoặc phải nối sau chuỗi còn trong hàng đợi → xếp hàng hết
 *  - online: chạy lần lượt (mỗi bước có Idempotency-Key riêng). Lỗi mạng giữa chừng → xếp hàng
 *    phần còn lại với CÙNG key (server đã xử lý rồi thì lần gửi lại trả kết quả cũ).
 *  - lỗi có phản hồi ở bước đầu (chưa ghi gì) → ném ra như trước, giỏ giữ nguyên.
 *  - lỗi có phản hồi SAU khi đã ghi (vd tạo đơn xong, gửi bếp 5xx/4xx) → xếp hàng phần còn lại
 *    (4xx hiện "Lỗi" trong hàng đợi) để nhân viên không nhập lại món đã vào đơn.
 */
export async function submitSteps(
  steps: OutboxItem[],
  joinsQueue: boolean,
): Promise<SubmitOutcome> {
  if (joinsQueue || (typeof navigator !== "undefined" && navigator.onLine === false)) {
    await enqueue(steps);
    return { kind: "queued" };
  }

  let remaining = steps;
  let last: Order | null = null;
  let committed = false;
  let created = false;
  let skipped: unknown = null;
  while (remaining.length > 0) {
    const step = remaining[0];
    try {
      last = await executeStep(step);
      if (step.kind === "create_order") created = true;
      remaining = applySuccess(remaining, step.id, step.kind === "create_order" ? last.id : null);
      committed = true;
    } catch (err) {
      const e =
        err instanceof ApiException
          ? { status: err.status, code: err.error.code, message: err.error.message }
          : { status: 0, message: (err as Error)?.message ?? "Lỗi không xác định" };
      const cls = classifyError(e, step.kind);
      if (cls === "done") {
        skipped = err;
        remaining = applySuccess(remaining, step.id, null);
        continue;
      }
      if (cls === "offline") {
        await enqueue(remaining);
        return { kind: "queued" };
      }
      if (!committed) throw err;
      await enqueue(applyFailure(remaining, step.id, cls, e.message, Date.now()));
      return { kind: "queued" };
    }
  }
  // Chỉ có bước gửi bếp và server báo "không có món mới" → báo lỗi như trước.
  if (!last) throw skipped ?? new Error("Chuỗi gửi bếp rỗng");
  return { kind: "sent", order: last, created };
}
