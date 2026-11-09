"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useDeleteMenuItem, useToggleMenuItemAvailability } from "@/hooks/api/use-menu";
import type { ApiException } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types/api";

const errMsg = (err: unknown) => (err as ApiException).error?.message ?? "Có lỗi xảy ra";

/** Trạng thái bán (Còn món / Hết món) + xoá món. */
export function ItemStatusCard({ item }: { item: MenuItem }) {
  const router = useRouter();
  const toggle = useToggleMenuItemAvailability();
  const del = useDeleteMenuItem();
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleToggle = async () => {
    const next = !item.isAvailable;
    try {
      await toggle.mutateAsync({
        id: item.id,
        isAvailable: next,
        reason: next ? undefined : reason.trim() || undefined,
      });
      setReason("");
      toast.success(next ? "Đã mở bán lại" : "Đã đánh dấu hết món");
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleDelete = async () => {
    try {
      await del.mutateAsync(item.id);
      toast.success(`Đã xoá "${item.name}"`);
      setConfirmOpen(false);
      router.push("/menu");
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Trạng thái</CardTitle>
        <Badge
          className={cn(
            "border-transparent",
            item.isAvailable
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
              : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
          )}
        >
          {item.isAvailable ? "Còn món" : "Hết món"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.isAvailable ? (
          <div className="space-y-2">
            <Label htmlFor="unavail-reason">Lý do hết món (tuỳ chọn)</Label>
            <Input
              id="unavail-reason"
              placeholder="vd: Hết nguyên liệu"
              value={reason}
              maxLength={200}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        ) : (
          item.unavailableReason && (
            <p className="text-muted-foreground text-sm">Lý do: {item.unavailableReason}</p>
          )
        )}
        <Button
          type="button"
          className="w-full"
          variant={item.isAvailable ? "outline" : "default"}
          onClick={handleToggle}
          disabled={toggle.isPending}
        >
          {item.isAvailable ? "Đánh dấu hết món" : "Mở bán lại"}
        </Button>

        <Separator />

        <Button
          type="button"
          variant="ghost"
          className="text-destructive w-full"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="mr-1 size-4" /> Xoá món
        </Button>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá món &quot;{item.name}&quot;?</DialogTitle>
            <DialogDescription>
              Món sẽ không còn hiển thị trên menu, POS và trang gọi món của khách. Các đơn cũ vẫn
              giữ nguyên.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={del.isPending}>
              Xoá món
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
