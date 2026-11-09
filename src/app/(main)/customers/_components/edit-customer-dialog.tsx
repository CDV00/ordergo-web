"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import {
  useUpdateCustomer,
  type CustomerDetail,
  type UpdateCustomerInput,
} from "@/hooks/api/use-customers";
import { errorMessage } from "./customer-utils";

const textareaClass =
  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

/** Ô PII để trống = giữ nguyên (form KHÔNG điền sẵn giá trị gốc — tránh lộ PII qua màn sửa). */
const schema = z.object({
  name: z.string().trim().max(100, "Tối đa 100 ký tự"),
  email: z.union([z.literal(""), z.email("Email không hợp lệ").max(254)]),
  birthday: z
    .string()
    .refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && v <= todayIso()), {
      message: "Ngày sinh không hợp lệ",
    }),
  tags: z.string().max(700),
  note: z.string().max(500, "Tối đa 500 ký tự"),
});
type FormValues = z.infer<typeof schema>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseTags(s: string): string[] {
  return [
    ...new Set(
      s
        .split(",")
        .map((t) => t.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  ];
}

interface Props {
  customer: CustomerDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Sửa hồ sơ khách (quyền order.manage — quản lý / chủ quán). */
export function EditCustomerDialog({ customer, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Form nằm trong DialogContent nên bị unmount khi đóng → state tự reset */}
        <EditForm customer={customer} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditForm({ customer, onDone }: { customer: CustomerDetail; onDone: () => void }) {
  const update = useUpdateCustomer(customer.id);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      birthday: "",
      tags: customer.tags.join(", "),
      note: customer.note ?? "",
    },
  });

  const onSubmit = async (v: FormValues) => {
    const input: UpdateCustomerInput = {};
    if (v.name.trim()) input.name = v.name.trim();
    if (v.email) input.email = v.email;
    if (v.birthday) input.birthday = v.birthday;
    const tags = parseTags(v.tags);
    if (tags.some((t) => t.length > 30)) {
      toast.error("Mỗi nhãn tối đa 30 ký tự");
      return;
    }
    if (tags.length > 20) {
      toast.error("Tối đa 20 nhãn");
      return;
    }
    if (tags.join("\n") !== customer.tags.join("\n")) input.tags = tags;
    const note = v.note.trim();
    if (note !== (customer.note ?? "")) input.note = note || null;

    if (Object.keys(input).length === 0) {
      onDone();
      return;
    }
    try {
      await update.mutateAsync(input);
      toast.success("Đã cập nhật hồ sơ khách");
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Sửa hồ sơ khách</DialogTitle>
        <DialogDescription>
          Để trống tên, email, ngày sinh nếu không muốn thay đổi. Số điện thoại do khách tự xác
          thực, không sửa ở đây.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="cust-name">Tên</Label>
        <Input
          id="cust-name"
          autoComplete="off"
          placeholder={customer.name ?? "Chưa có"}
          className="min-h-[44px]"
          {...register("name")}
        />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cust-email">Email</Label>
          <Input
            id="cust-email"
            type="email"
            autoComplete="off"
            placeholder={customer.email ?? "Chưa có"}
            className="min-h-[44px]"
            {...register("email")}
          />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-birthday">Ngày sinh</Label>
          <Input
            id="cust-birthday"
            type="date"
            max={todayIso()}
            className="min-h-[44px]"
            {...register("birthday")}
          />
          {customer.birthday && (
            <p className="text-muted-foreground text-xs">Hiện tại: {customer.birthday}</p>
          )}
          {errors.birthday && <p className="text-destructive text-xs">{errors.birthday.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cust-tags">Nhãn</Label>
        <Input
          id="cust-tags"
          placeholder="vd: VIP, khách quen, thích ít đá"
          className="min-h-[44px]"
          {...register("tags")}
        />
        <p className="text-muted-foreground text-xs">Cách nhau bởi dấu phẩy, tối đa 20 nhãn.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cust-note">Ghi chú nội bộ</Label>
        <textarea
          id="cust-note"
          rows={3}
          maxLength={500}
          className={textareaClass}
          {...register("note")}
        />
        {errors.note && <p className="text-destructive text-xs">{errors.note.message}</p>}
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" className="min-h-[44px]" onClick={onDone}>
          Huỷ
        </Button>
        <Button type="submit" className="min-h-[44px]" disabled={update.isPending}>
          {update.isPending ? "Đang lưu..." : "Lưu"}
        </Button>
      </DialogFooter>
    </form>
  );
}
