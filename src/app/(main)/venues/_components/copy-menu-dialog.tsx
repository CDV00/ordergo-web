"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCopyMenu } from "@/hooks/api/use-menu";
import { ApiException } from "@/lib/api-client";
import type { Venue } from "@/types/api";

/**
 * "Sao chép menu từ cơ sở…": chép nhóm + món (biến thể, topping, ảnh) từ 1 cơ sở khác sang `target`.
 * Nếu `target` đã có menu, API trả 409 MENU_NOT_EMPTY → hỏi lại trước khi thay thế (xoá menu cũ).
 */
export function CopyMenuDialog({
  target,
  venues,
  onOpenChange,
}: {
  /** null = đóng */
  target: Venue | null;
  venues: Venue[];
  onOpenChange: (v: boolean) => void;
}) {
  const copy = useCopyMenu();
  const sources = venues.filter((v) => v.id !== target?.id);
  const [fromVenueId, setFromVenueId] = useState("");
  const [conflict, setConflict] = useState<{ items: number } | null>(null);

  useEffect(() => {
    if (!target) return;
    setFromVenueId("");
    setConflict(null);
  }, [target]);

  const run = async (replace: boolean) => {
    if (!target || !fromVenueId) return;
    try {
      const res = await copy.mutateAsync({ venueId: target.id, fromVenueId, replace });
      toast.success(
        `Đã sao chép ${res.categories} nhóm, ${res.items} món sang ${target.name}` +
          (res.replacedItems ? ` (thay ${res.replacedItems} món cũ)` : ""),
      );
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiException && err.error?.code === "MENU_NOT_EMPTY") {
        const details = err.error.details as { items?: number } | undefined;
        setConflict({ items: details?.items ?? 0 });
        return;
      }
      toast.error((err as ApiException).error?.message ?? "Không sao chép được menu");
    }
  };

  const fromName = sources.find((v) => v.id === fromVenueId)?.name;

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sao chép menu sang {target?.name}</DialogTitle>
          <DialogDescription>
            Chép toàn bộ nhóm món và món (kèm size, topping, ảnh, giá) từ một cơ sở khác. Món dùng
            chung toàn chuỗi đã có sẵn ở mọi cơ sở nên không cần chép.
          </DialogDescription>
        </DialogHeader>

        {conflict ? (
          <div className="border-destructive/40 bg-destructive/5 flex gap-3 rounded-lg border p-3 text-sm">
            <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">{target?.name} đã có menu riêng.</p>
              <p className="text-muted-foreground">
                {conflict.items > 0 ? `${conflict.items} món hiện có` : "Các nhóm món hiện có"} sẽ
                bị xoá và thay bằng menu của {fromName}. Đơn cũ không bị ảnh hưởng.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="copy-from">Sao chép từ cơ sở</Label>
            <Select value={fromVenueId} onValueChange={(v) => v && setFromVenueId(v)}>
              <SelectTrigger id="copy-from">
                <SelectValue placeholder="Chọn cơ sở nguồn" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} ({v.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sources.length === 0 && (
              <p className="text-muted-foreground text-xs">Chưa có cơ sở nào khác để sao chép.</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          {conflict ? (
            <Button variant="destructive" disabled={copy.isPending} onClick={() => run(true)}>
              {copy.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Thay thế menu
            </Button>
          ) : (
            <Button disabled={!fromVenueId || copy.isPending} onClick={() => run(false)}>
              {copy.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Copy className="mr-1.5 size-4" />
              )}
              Sao chép
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
