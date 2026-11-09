"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

/** Upload ảnh (JPG/PNG/WEBP ≤ 2MB) → `{ url }` tương đối, dùng `mediaUrl()` để hiển thị. */
export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      if (!ACCEPT.includes(file.type)) throw new Error("Chỉ nhận ảnh JPG, PNG hoặc WEBP.");
      if (file.size > MAX_BYTES) throw new Error("Ảnh tối đa 2MB.");
      const form = new FormData();
      form.append("file", file);
      const res = await api.post<{ data: { url: string; bytes: number } }>(
        "/uploads/images",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data.data;
    },
  });
}
