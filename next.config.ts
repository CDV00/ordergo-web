import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Cho phép build kiểm tra ra thư mục riêng khi đang chạy `next dev` (dùng chung .next sẽ hỏng cả hai).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        // Service worker (public/sw.js, scope "/"): luôn kiểm tra bản mới, không để CDN/trình duyệt giữ cũ.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
