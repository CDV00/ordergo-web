import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"], // hỗ trợ định dạng tối ưu
    remotePatterns: [], // nếu có ảnh từ domain ngoài thì thêm ở đây
  },
};

module.exports = nextConfig;
