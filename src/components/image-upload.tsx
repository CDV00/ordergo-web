"use client";

import { useRef } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUploadImage } from "@/hooks/api/use-uploads";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { ApiException } from "@/lib/api-client";

interface Props {
  /** Đường dẫn ảnh hiện tại (tương đối `/uploads/...` hoặc URL tuyệt đối) */
  value: string | null;
  /** Gọi với URL mới sau khi upload xong, hoặc null khi bấm xoá */
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
  /** Tỉ lệ khung xem trước, mặc định vuông */
  aspect?: "square" | "wide";
  disabled?: boolean;
}

/** Chọn ảnh → upload ngay → trả URL cho form. JPG/PNG/WEBP ≤ 2MB. */
export function ImageUpload({
  value,
  onChange,
  label = "Tải ảnh lên",
  className,
  aspect = "square",
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadImage();
  const src = mediaUrl(value);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const res = await upload.mutateAsync(file);
      onChange(res.url);
      toast.success("Đã tải ảnh lên");
    } catch (err) {
      const e = err as ApiException & Error;
      toast.error(e.error?.message ?? e.message ?? "Tải ảnh thất bại");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "bg-muted relative overflow-hidden rounded-lg border",
          aspect === "square" ? "aspect-square w-40" : "aspect-[3/1] w-full max-w-sm",
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh từ API, không qua Next Image optimizer
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <ImagePlus className="size-8 opacity-50" />
          </div>
        )}
        {upload.isPending && (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
        {src && !upload.isPending && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="bg-background/90 hover:bg-background absolute top-1.5 right-1.5 rounded-full p-1 shadow"
            aria-label="Xoá ảnh"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="mr-1.5 size-4" />
        {src ? "Đổi ảnh" : label}
      </Button>
      <p className="text-muted-foreground text-xs">JPG, PNG hoặc WEBP, tối đa 2MB.</p>
    </div>
  );
}
