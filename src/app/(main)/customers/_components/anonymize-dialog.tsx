"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useAnonymizeCustomer, type CustomerDetail } from "@/hooks/api/use-customers";
import { errorMessage } from "./customer-utils";

const CONFIRM_WORD = "XOÁ";

/** So khớp không phân biệt hoa thường / dấu: "xoa", "Xoá", "XOÁ" đều hợp lệ. */
function matchesConfirm(v: string): boolean {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();
  return norm(v) === norm(CONFIRM_WORD);
}

interface Props {
  customer: CustomerDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Xoá dữ liệu cá nhân (ẩn danh hoá) — chỉ chủ quán. Không thể hoàn tác. */
export function AnonymizeDialog({ customer, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <AnonymizeForm customer={customer} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AnonymizeForm({ customer, onDone }: { customer: CustomerDetail; onDone: () => void }) {
  const [confirm, setConfirm] = useState("");
  const anonymize = useAnonymizeCustomer(customer.id);
  const ok = matchesConfirm(confirm);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    try {
      await anonymize.mutateAsync();
      toast.success("Đã xoá dữ liệu cá nhân của khách");
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="text-destructive h-5 w-5" />
          Xoá dữ liệu cá nhân
        </DialogTitle>
        <DialogDescription>
          Thao tác này <strong>không thể hoàn tác</strong>.
        </DialogDescription>
      </DialogHeader>

      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>Xoá vĩnh viễn tên, số điện thoại, email, ngày sinh, nhãn và ghi chú của khách.</li>
        <li>Xoá tên/số điện thoại lưu kèm trên các đơn hàng cũ của khách.</li>
        <li>Khách sẽ không còn tích điểm cho tới khi xác thực lại.</li>
        <li>Giữ lại thống kê, thẻ thành viên và đơn hàng (đã ẩn danh) cho báo cáo.</li>
      </ul>

      <div className="space-y-2">
        <Label htmlFor="anonymize-confirm">
          Gõ <span className="font-mono font-semibold">{CONFIRM_WORD}</span> để xác nhận
        </Label>
        <Input
          id="anonymize-confirm"
          autoComplete="off"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="min-h-[44px]"
          autoFocus
        />
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" className="min-h-[44px]" onClick={onDone}>
          Huỷ
        </Button>
        <Button
          type="submit"
          variant="destructive"
          className="min-h-[44px]"
          disabled={!ok || anonymize.isPending}
        >
          {anonymize.isPending ? "Đang xoá..." : "Xoá dữ liệu cá nhân"}
        </Button>
      </DialogFooter>
    </form>
  );
}
