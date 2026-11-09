/* OrderGo service worker — vỏ ứng dụng offline cho POS / màn bếp.
 *
 * - /_next/static/* và icon: cache-first (tên file có hash → không bao giờ cũ)
 * - Mở trang /pos, /kds: network-first, lỗi mạng → HTML thành công gần nhất trong cache
 * - KHÔNG cache: API (khác origin hoặc /v1, /api), /print/*, request có Authorization,
 *   mọi request không phải GET. Dữ liệu offline do app tự lưu (IndexedDB), không qua đây.
 *
 * Đổi VERSION khi đổi logic → activate xoá cache cũ.
 */
const VERSION = "v1";
const STATIC_CACHE = `ordergo-static-${VERSION}`;
const PAGE_CACHE = `ordergo-pages-${VERSION}`;
const KEEP = [STATIC_CACHE, PAGE_CACHE];
const MAX_STATIC_ENTRIES = 300;

const SHELL_PAGES = ["/pos", "/kds"];

self.addEventListener("install", () => {
  // Không precache gì nặng: trang được cache khi người dùng mở lần đầu lúc có mạng.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith("ordergo-") && !KEEP.includes(n))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/pwa-icon/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/icon" ||
    url.pathname === "/apple-icon"
  );
}

function isShellNavigation(request, url) {
  if (request.mode !== "navigate") return false;
  return SHELL_PAGES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`));
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === "basic") {
    await cache.put(request, res.clone());
    void trim(STATIC_CACHE, MAX_STATIC_ENTRIES);
  }
  return res;
}

async function networkFirstPage(request, url) {
  const cache = await caches.open(PAGE_CACHE);
  // Khoá theo đường dẫn (bỏ query) — /pos?x=1 vẫn dùng bản /pos đã lưu.
  const key = new Request(url.origin + url.pathname);
  try {
    const res = await fetch(request);
    if (res.ok && res.type === "basic" && !res.redirected) {
      await cache.put(key, res.clone());
    }
    return res;
  } catch (err) {
    const hit = await cache.match(key);
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.headers.has("Authorization")) return;

  const url = new URL(request.url);
  // API (khác origin), socket, file upload… → để trình duyệt tự xử lý.
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/print/") ||
    url.pathname.startsWith("/v1/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/")
  ) {
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (isShellNavigation(request, url)) {
    event.respondWith(networkFirstPage(request, url));
  }
});
