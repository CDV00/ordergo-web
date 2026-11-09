import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import {
  useChangeTableStatus,
  useCreateTable,
  useDeleteTable,
  useTables,
} from "@/hooks/api/use-tables";
import { ApiException } from "@/lib/api-client";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface TableForm {
  name: string;
  section: string;
  capacity: number;
}

export default function AddTableModal() {
  const { activeVenueId } = useAuth();
  const create = useCreateTable();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<TableForm>({
    defaultValues: { name: "", section: "Sảnh", capacity: 4 },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!activeVenueId) {
      toast.error("Chưa chọn cơ sở. Tải lại trang để thử lại.");
      return;
    }
    try {
      await create.mutateAsync({
        venueId: activeVenueId,
        name: values.name,
        section: values.section,
        capacity: values.capacity,
      });
      toast.success("Đã thêm bàn");
      setDialogOpen(false);
      form.reset();
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Lỗi");
    }
  });

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 size-4" /> Thêm bàn
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm bàn mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-section">Khu vực</Label>
            <Input id="t-section" {...form.register("section", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-name">Tên bàn *</Label>
            <Input id="t-name" placeholder="Bàn 1" {...form.register("name", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-cap">Số chỗ</Label>
            <Input
              id="t-cap"
              type="number"
              min="1"
              {...form.register("capacity", {
                required: true,
                valueAsNumber: true,
                min: 1,
              })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Thêm bàn
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
