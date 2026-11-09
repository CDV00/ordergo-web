/**
 * Kho key–value tối giản trên IndexedDB (1 DB, 1 object store) cho hàng đợi offline và cache query.
 * Chọn IndexedDB thay vì localStorage: không chặn main thread, dung lượng lớn hơn (menu có ảnh/URL dài),
 * và không đụng hạn mức ~5MB mà localStorage dùng chung với token/giỏ hàng.
 * Trình duyệt không có IndexedDB (SSR, private mode cũ) → các hàm trả null / bỏ qua, không ném lỗi.
 */

const DB_NAME = "ordergo-offline";
const STORE = "kv";
const VERSION = 1;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  dbPromise ??= new Promise<IDBDatabase | null>((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => {
        const db = req.result;
        // Tab khác nâng version → đóng để không chặn nó; lần sau mở lại.
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const tx = db.transaction(STORE, mode);
          const req = fn(tx.objectStore(STORE));
          tx.oncomplete = () => resolve(req.result ?? null);
          tx.onerror = () => resolve(null);
          tx.onabort = () => resolve(null);
        } catch {
          resolve(null);
        }
      }),
  );
}

export const idb = {
  get<T>(key: string): Promise<T | null> {
    return run<T>("readonly", (s) => s.get(key) as IDBRequest<T>);
  },
  async set(key: string, value: unknown): Promise<void> {
    await run("readwrite", (s) => s.put(value, key));
  },
  async del(key: string): Promise<void> {
    await run("readwrite", (s) => s.delete(key));
  },
};

/** UUID v4 — `crypto.randomUUID` chỉ có trong secure context, máy POS trong LAN có thể chạy http. */
export function newUuid(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
