/**
 * Kiểm thử logic hàng đợi offline (thuần, không DOM). Chạy:
 *   node src/lib/offline/__tests__/run.mjs
 * (biên dịch bằng `typescript` có sẵn trong devDependencies rồi chạy `node --test`).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyFailure,
  applySuccess,
  backoffMs,
  classifyError,
  discardItem,
  isBlocked,
  nextRunnable,
  pendingLinesFor,
  planSubmission,
  retryItem,
  summarize,
  type OutboxItem,
  type PlanInput,
} from "../outbox-core";

let seq = 0;
const newId = () => `k${++seq}`;
const line = { menuItemId: "m1", quantity: 2 };
const disp = {
  name: "Cà phê",
  quantity: 2,
  unitPrice: 25_000,
  variantName: null,
  toppingNames: [],
  note: null,
};

function plan(over: Partial<PlanInput> = {}) {
  return planSubmission({
    newId,
    now: 1_000,
    tenantId: "t1",
    venueId: "v1",
    cartKey: "table-1",
    label: "Bàn 1",
    isTakeaway: false,
    openOrderId: null,
    lines: [line],
    display: [disp],
    queue: [],
    ...over,
  });
}

test("bàn chưa có đơn → create rồi send tham chiếu create", () => {
  const { steps, joinsQueue } = plan();
  assert.equal(joinsQueue, false);
  assert.deepEqual(
    steps.map((s) => s.kind),
    ["create_order", "send_to_kitchen"],
  );
  const [create, send] = steps;
  assert.equal(create.kind === "create_order" && create.payload.body.tableId, "table-1");
  assert.equal(send.kind === "send_to_kitchen" && send.payload.orderRef, create.id);
  assert.equal(create.groupId, send.groupId);
});

test("mang về không gắn bàn", () => {
  const { steps } = plan({ cartKey: "takeaway", isTakeaway: true });
  const create = steps[0];
  assert.ok(create.kind === "create_order");
  assert.equal(create.payload.body.orderType, "takeaway");
  assert.equal(create.payload.body.tableId, undefined);
});

test("bàn đã có đơn → add_lines + send với orderId", () => {
  const { steps } = plan({ openOrderId: "o1" });
  assert.deepEqual(
    steps.map((s) => [s.kind, s.kind === "create_order" ? null : s.payload.orderId]),
    [
      ["add_lines", "o1"],
      ["send_to_kitchen", "o1"],
    ],
  );
});

test("gọi thêm khi đơn tạo offline chưa gửi → nối vào chuỗi, tham chiếu create", () => {
  const first = plan().steps;
  const { steps, joinsQueue } = plan({ queue: first });
  assert.equal(joinsQueue, true);
  assert.ok(steps.every((s) => s.groupId === first[0].groupId));
  for (const s of steps) {
    assert.ok(s.kind !== "create_order");
    assert.equal(s.payload.orderRef, first[0].id);
    assert.equal(s.payload.orderId, null);
  }
});

test("mang về không bao giờ nối vào chuỗi cũ", () => {
  const first = plan({ cartKey: "takeaway", isTakeaway: true }).steps;
  const { steps, joinsQueue } = plan({ cartKey: "takeaway", isTakeaway: true, queue: first });
  assert.equal(joinsQueue, false);
  assert.notEqual(steps[0].groupId, first[0].groupId);
});

test("create xong → orderId điền cho bước sau, bước sau mới chạy được", () => {
  let q: OutboxItem[] = plan().steps;
  const [create, send] = q;
  assert.equal(nextRunnable(q, 2_000)?.id, create.id);
  q = applySuccess(q, create.id, "o9");
  assert.equal(q.length, 1);
  const next = nextRunnable(q, 2_000);
  assert.equal(next?.id, send.id);
  assert.ok(next && next.kind !== "create_order" && next.payload.orderId === "o9");
});

test("thứ tự: bước đầu chuỗi chưa xong thì bước sau không chạy; chuỗi khác vẫn chạy", () => {
  const a = plan().steps;
  const b = plan({ cartKey: "table-2", label: "Bàn 2" }).steps;
  let q: OutboxItem[] = [...a, ...b];
  q = applyFailure(q, a[0].id, "fatal", "Món đã hết", 2_000);
  assert.equal(q[0].status, "failed");
  assert.equal(isBlocked(q, q[1]), true);
  assert.equal(nextRunnable(q, 2_000)?.id, b[0].id);
});

test("lọc theo tenant", () => {
  const q = [...plan({ tenantId: "t2" }).steps, ...plan().steps];
  assert.equal(nextRunnable(q, 2_000, "t1")?.tenantId, "t1");
  assert.equal(summarize(q, "t1").groups, 1);
  assert.equal(summarize(q).groups, 2);
});

test("phân loại lỗi", () => {
  assert.equal(classifyError({ status: 0 }, "create_order"), "offline");
  assert.equal(classifyError({ status: 503 }, "create_order"), "retry");
  assert.equal(classifyError({ status: 429 }, "add_lines"), "retry");
  assert.equal(classifyError({ status: 401 }, "add_lines"), "retry");
  assert.equal(
    classifyError({ status: 409, code: "IDEMPOTENCY_IN_PROGRESS" }, "create_order"),
    "retry",
  );
  assert.equal(classifyError({ status: 400, code: "ITEM_UNAVAILABLE" }, "add_lines"), "fatal");
  assert.equal(
    classifyError({ status: 422, code: "IDEMPOTENCY_KEY_REUSED" }, "add_lines"),
    "fatal",
  );
  assert.equal(classifyError({ status: 400, code: "NOTHING_TO_SEND" }, "send_to_kitchen"), "done");
  assert.equal(classifyError({ status: 400, code: "NOTHING_TO_SEND" }, "add_lines"), "fatal");
});

test("backoff 15s → 30s → 60s, tối đa 5 phút; mất mạng không giãn", () => {
  assert.equal(backoffMs(1), 15_000);
  assert.equal(backoffMs(2), 30_000);
  assert.equal(backoffMs(3), 60_000);
  assert.equal(backoffMs(20), 300_000);

  const q = plan().steps;
  const retried = applyFailure(q, q[0].id, "retry", "503", 10_000);
  assert.equal(retried[0].nextAttemptAt, 25_000);
  assert.equal(nextRunnable(retried, 20_000), null);
  const offline = applyFailure(q, q[0].id, "offline", "mạng", 10_000);
  assert.equal(offline[0].nextAttemptAt, 10_000);
  assert.equal(offline[0].attempts, 1);
});

test("Thử lại / Bỏ", () => {
  const a = plan().steps;
  let q = applyFailure(a, a[0].id, "fatal", "Món đã hết", 0);
  q = retryItem(q, a[0].id);
  assert.equal(q[0].status, "pending");
  assert.equal(q[0].id, a[0].id, "giữ nguyên Idempotency-Key");
  assert.deepEqual(discardItem(q, a[0].id), [], "bỏ create → bỏ luôn send phụ thuộc");
  assert.equal(discardItem(q, a[1].id).length, 1);
});

test("món chờ gửi theo bàn", () => {
  const q = [...plan().steps, ...plan({ cartKey: "table-2" }).steps];
  assert.equal(pendingLinesFor(q, "t1", "table-1").length, 1);
  assert.equal(pendingLinesFor(q, "t1", "table-3").length, 0);
});
