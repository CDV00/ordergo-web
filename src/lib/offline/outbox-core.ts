/**
 * Logic thuần (không React, không DOM, không axios) của hàng đợi offline cho POS.
 * Tách riêng để kiểm thử bằng `node --test` (xem `__tests__/run.mjs`) và để engine/UI dùng chung.
 *
 * Mô hình:
 *  - Mỗi lần bấm "Gửi bếp"/"Gửi thêm" sinh ra một CHUỖI bước (cùng `groupId`):
 *      bàn chưa có đơn  → create_order → send_to_kitchen (orderRef = id bước create)
 *      bàn đã có đơn    → add_lines → send_to_kitchen (orderId đã biết)
 *  - `id` của mỗi bước chính là `Idempotency-Key` → gửi lại bao nhiêu lần cũng an toàn.
 *  - Trong 1 chuỗi, bước sau chỉ chạy khi mọi bước trước đã xong (đã bị xoá khỏi hàng đợi).
 *  - Lần bấm tiếp theo cho cùng bàn khi chuỗi cũ chưa gửi xong → nối vào chuỗi cũ để giữ thứ tự.
 */

export type OutboxKind = "create_order" | "add_lines" | "send_to_kitchen";
export type OutboxStatus = "pending" | "failed";

export interface OutboxLineInput {
  menuItemId: string;
  variantId?: string;
  toppingOptionIds?: string[];
  quantity: number;
  note?: string;
}

/** Bản chụp hiển thị ("Chờ gửi (offline)") — không phải dữ liệu gửi server. */
export interface OutboxDisplayLine {
  name: string;
  quantity: number;
  unitPrice: number;
  variantName: string | null;
  toppingNames: string[];
  note: string | null;
}

export interface CreateOrderBody {
  venueId: string | null;
  orderType: "dine_in" | "takeaway";
  tableId?: string;
  lines: OutboxLineInput[];
}

interface OutboxItemBase {
  /** = Idempotency-Key gửi lên API. */
  id: string;
  groupId: string;
  createdAt: number;
  attempts: number;
  lastError: string | null;
  /** pending: chờ gửi / sẽ thử lại; failed: lỗi 4xx — dừng, chờ nhân viên "Thử lại" hoặc "Bỏ". */
  status: OutboxStatus;
  nextAttemptAt: number;
  tenantId: string;
  venueId: string | null;
  /** tableId hoặc "takeaway" — để hiện "Chờ gửi" đúng bàn. */
  cartKey: string;
  /** "Bàn 3" / "Mang về" */
  label: string;
}

export type OutboxItem =
  | (OutboxItemBase & {
      kind: "create_order";
      payload: { body: CreateOrderBody; display: OutboxDisplayLine[] };
    })
  | (OutboxItemBase & {
      kind: "add_lines";
      payload: {
        orderId: string | null;
        orderRef: string | null;
        lines: OutboxLineInput[];
        display: OutboxDisplayLine[];
      };
    })
  | (OutboxItemBase & {
      kind: "send_to_kitchen";
      payload: { orderId: string | null; orderRef: string | null };
    });

export const OUTBOX_TICK_MS = 15_000;
const MAX_BACKOFF_MS = 5 * 60_000;

// ─── Lập chuỗi bước ─────────────────────────────────────────────────────────

export interface PlanInput {
  newId: () => string;
  now: number;
  tenantId: string;
  venueId: string | null;
  cartKey: string;
  label: string;
  isTakeaway: boolean;
  /** Đơn đang mở mà máy biết (cache). */
  openOrderId: string | null;
  lines: OutboxLineInput[];
  display: OutboxDisplayLine[];
  /** Hàng đợi hiện tại — để nối vào chuỗi chưa gửi xong của cùng bàn. */
  queue: readonly OutboxItem[];
}

/** Chuỗi cuối cùng còn trong hàng đợi của bàn này (không áp dụng cho mang về). */
export function findOpenGroup(
  queue: readonly OutboxItem[],
  tenantId: string,
  cartKey: string,
): { groupId: string; createId: string | null; orderId: string | null } | null {
  if (cartKey === "takeaway") return null;
  const mine = queue.filter((i) => i.tenantId === tenantId && i.cartKey === cartKey);
  const last = mine[mine.length - 1];
  if (!last) return null;
  const group = mine.filter((i) => i.groupId === last.groupId);
  const create = group.find((i) => i.kind === "create_order");
  let orderId: string | null = null;
  for (const i of group) {
    if (i.kind !== "create_order" && i.payload.orderId) orderId = i.payload.orderId;
  }
  return { groupId: last.groupId, createId: create?.id ?? null, orderId };
}

/**
 * Các bước cho 1 lần bấm gửi bếp. Trả về `joinsQueue = true` khi phải nối sau các bước
 * còn trong hàng đợi (khi đó KHÔNG được chạy online ngay, kể cả đang có mạng).
 */
export function planSubmission(input: PlanInput): { steps: OutboxItem[]; joinsQueue: boolean } {
  const base = {
    createdAt: input.now,
    attempts: 0,
    lastError: null,
    status: "pending" as const,
    nextAttemptAt: 0,
    tenantId: input.tenantId,
    venueId: input.venueId,
    cartKey: input.cartKey,
    label: input.label,
  };
  const open = findOpenGroup(input.queue, input.tenantId, input.cartKey);
  const groupId = open?.groupId ?? input.newId();
  // Chuỗi cũ còn bước tạo đơn → bám theo bước đó; không thì dùng đơn đã biết.
  const orderRef = open?.createId ?? null;
  const orderId = orderRef ? null : (input.openOrderId ?? open?.orderId ?? null);
  const steps: OutboxItem[] = [];

  if (orderId || orderRef) {
    if (input.lines.length > 0) {
      steps.push({
        ...base,
        id: input.newId(),
        groupId,
        kind: "add_lines",
        payload: { orderId, orderRef, lines: input.lines, display: input.display },
      });
    }
    steps.push({
      ...base,
      id: input.newId(),
      groupId,
      kind: "send_to_kitchen",
      payload: { orderId, orderRef },
    });
  } else {
    const createId = input.newId();
    steps.push({
      ...base,
      id: createId,
      groupId,
      kind: "create_order",
      payload: {
        body: {
          venueId: input.venueId,
          orderType: input.isTakeaway ? "takeaway" : "dine_in",
          tableId: input.isTakeaway ? undefined : input.cartKey,
          lines: input.lines,
        },
        display: input.display,
      },
    });
    steps.push({
      ...base,
      id: input.newId(),
      groupId,
      kind: "send_to_kitchen",
      payload: { orderId: null, orderRef: createId },
    });
  }
  return { steps, joinsQueue: !!open };
}

// ─── Thứ tự & chuỗi ─────────────────────────────────────────────────────────

/** Bước đầu tiên chạy được: đang pending, hết thời gian chờ, và là bước đầu còn lại của chuỗi. */
export function nextRunnable(
  queue: readonly OutboxItem[],
  now: number,
  tenantId?: string,
  skip: ReadonlySet<string> = new Set(),
): OutboxItem | null {
  const seenGroups = new Set<string>();
  for (const item of queue) {
    if (tenantId && item.tenantId !== tenantId) continue;
    if (seenGroups.has(item.groupId)) continue;
    seenGroups.add(item.groupId);
    if (skip.has(item.id)) continue;
    if (item.status === "pending" && item.nextAttemptAt <= now) return item;
  }
  return null;
}

/** Bước còn chờ một bước lỗi phía trước trong cùng chuỗi. */
export function isBlocked(queue: readonly OutboxItem[], item: OutboxItem): boolean {
  for (const other of queue) {
    if (other.id === item.id) return false;
    if (other.groupId === item.groupId) return true;
  }
  return false;
}

/** orderId mà bước cần gọi; null nếu bước create phía trước chưa xong. */
export function targetOrderId(item: OutboxItem): string | null {
  return item.kind === "create_order" ? null : item.payload.orderId;
}

/** Bước `id` xong: xoá khỏi hàng đợi; nếu là create → điền orderId cho các bước tham chiếu nó. */
export function applySuccess(
  queue: readonly OutboxItem[],
  id: string,
  orderId: string | null,
): OutboxItem[] {
  return queue
    .filter((i) => i.id !== id)
    .map((i) =>
      orderId && i.kind !== "create_order" && i.payload.orderRef === id
        ? ({ ...i, payload: { ...i.payload, orderId, orderRef: null } } as OutboxItem)
        : i,
    );
}

/** Chuỗi `groupId` đã gửi xong hết chưa. */
export function isGroupDone(queue: readonly OutboxItem[], groupId: string): boolean {
  return !queue.some((i) => i.groupId === groupId);
}

// ─── Phân loại lỗi & thử lại ────────────────────────────────────────────────

export type ErrorClass =
  /** Không tới được server (mất mạng / timeout) → dừng lượt, chờ có mạng. */
  | "offline"
  /** Lỗi tạm thời (5xx, 429, 409 đang xử lý, 401) → thử lại sau (backoff). */
  | "retry"
  /** Lỗi nghiệp vụ 4xx (món hết, đơn đã đóng...) → dừng bước này, chờ nhân viên. */
  | "fatal"
  /** Coi như đã xong (vd gửi bếp lại nhưng món đã được gửi). */
  | "done";

export interface ErrorLike {
  status: number;
  code?: string;
}

export function classifyError(err: ErrorLike, kind: OutboxKind): ErrorClass {
  const { status, code } = err;
  if (!status) return "offline";
  if (kind === "send_to_kitchen" && status === 400 && code === "NOTHING_TO_SEND") return "done";
  if (status === 401 || status === 408 || status === 425 || status === 429) return "retry";
  if (status === 409 && code === "IDEMPOTENCY_IN_PROGRESS") return "retry";
  if (status >= 500) return "retry";
  if (status >= 400) return "fatal";
  return "retry";
}

/** 15s, 30s, 60s… tối đa 5 phút. */
export function backoffMs(attempts: number): number {
  const n = Math.max(1, attempts);
  return Math.min(OUTBOX_TICK_MS * 2 ** (n - 1), MAX_BACKOFF_MS);
}

export function applyFailure(
  queue: readonly OutboxItem[],
  id: string,
  cls: Exclude<ErrorClass, "done">,
  message: string,
  now: number,
): OutboxItem[] {
  return queue.map((i) => {
    if (i.id !== id) return i;
    const attempts = i.attempts + 1;
    if (cls === "fatal") return { ...i, attempts, lastError: message, status: "failed" };
    // Mất mạng: không giãn — lượt sau (online / 15s) thử lại ngay.
    const wait = cls === "offline" ? 0 : backoffMs(attempts);
    return { ...i, attempts, lastError: message, status: "pending", nextAttemptAt: now + wait };
  });
}

/** "Thử lại": đưa bước lỗi về pending, chạy ngay ở lượt tới (cùng Idempotency-Key). */
export function retryItem(queue: readonly OutboxItem[], id: string): OutboxItem[] {
  return queue.map((i) =>
    i.id === id ? { ...i, status: "pending" as const, nextAttemptAt: 0 } : i,
  );
}

/** "Bỏ": xoá bước và mọi bước sau nó trong cùng chuỗi (chúng phụ thuộc bước này). */
export function discardItem(queue: readonly OutboxItem[], id: string): OutboxItem[] {
  const idx = queue.findIndex((i) => i.id === id);
  if (idx < 0) return [...queue];
  const groupId = queue[idx].groupId;
  return queue.filter((i, n) => !(i.groupId === groupId && n >= idx));
}

// ─── Hiển thị ───────────────────────────────────────────────────────────────

/** Món đang chờ gửi của 1 bàn (create + add_lines chưa xong). */
export function pendingLinesFor(
  queue: readonly OutboxItem[],
  tenantId: string,
  cartKey: string,
): OutboxDisplayLine[] {
  const out: OutboxDisplayLine[] = [];
  for (const i of queue) {
    if (i.tenantId !== tenantId || i.cartKey !== cartKey) continue;
    if (i.kind === "create_order" || i.kind === "add_lines") out.push(...i.payload.display);
  }
  return out;
}

/** Số "đơn" chờ (= số chuỗi), số chuỗi có bước lỗi. */
export function summarize(
  queue: readonly OutboxItem[],
  tenantId?: string,
): { groups: number; failedGroups: number } {
  const groups = new Set<string>();
  const failed = new Set<string>();
  for (const i of queue) {
    if (tenantId && i.tenantId !== tenantId) continue;
    groups.add(i.groupId);
    if (i.status === "failed") failed.add(i.groupId);
  }
  return { groups: groups.size, failedGroups: failed.size };
}

/** Cartkeys đang có món chờ gửi (cho badge ở sơ đồ bàn). */
export function pendingCartKeys(queue: readonly OutboxItem[], tenantId: string): Set<string> {
  return new Set(queue.filter((i) => i.tenantId === tenantId).map((i) => i.cartKey));
}
