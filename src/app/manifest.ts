import type { MetadataRoute } from "next";

/** PWA cho máy POS / tablet bếp: cài lên màn hình chính, mở toàn màn hình, xoay tự do. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OrderGo — Quản lý quán",
    short_name: "OrderGo",
    description: "Gọi món, màn bếp, thu tiền cho quán cà phê và nhà hàng",
    start_url: "/pos",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    lang: "vi",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "POS — Gọi món", url: "/pos" },
      { name: "Màn bếp", url: "/kds" },
    ],
  };
}
