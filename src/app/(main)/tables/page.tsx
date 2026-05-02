"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import {
  useChangeTableStatus,
  useCreateTable,
  useDeleteTable,
  useTables,
} from "@/hooks/api/use-tables";
import { ApiException } from "@/lib/api-client";
import type { RestaurantTable, TableStatus } from "@/types/api";

interface TableForm {
  name: string;
  section: string;
  capacity: number;
}

const STATUS_LABELS: Record<TableStatus, string> = {
  available: "Trống",
  occupied: "Đang phục vụ",
  reserved: "Đã đặt",
  cleaning: "Cần dọn",
  out_of_order: "Hỏng",
};

const STATUS_COLORS: Record<TableStatus, string> = {
  available: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
  occupied: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  reserved: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
  cleaning: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
  out_of_order: "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800",
};

export default function TablesPage() {
  const tables = useTables();
  const create = useCreateTable();
  const changeStatus = useChangeTableStatus();
  const remove = useDeleteTable();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<TableForm>({
    defaultValues: { name: "", section: "Sảnh", capacity: 4 },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync({
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

  const onChangeStatus = async (id: string, status: TableStatus) => {
    try {
      await changeStatus.mutateAsync({ id, status });
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Lỗi");
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Xoá bàn "${name}"?`)) return;
    try {
      await remove.mutateAsync(id);
      toast.success("Đã xoá");
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Lỗi");
    }
  };

  const grouped = (tables.data ?? []).reduce<Record<string, RestaurantTable[]>>(
    (acc, t) => {
      (acc[t.section] ??= []).push(t);
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Bàn ăn</h1>
        <div className="ml-auto">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4 mr-1" /> Thêm bàn
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {tables.isLoading ? (
          <p className="text-muted-foreground">Đang tải...</p>
        ) : tables.data?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Chưa có bàn nào. Bấm &quot;Thêm bàn&quot; để bắt đầu.
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([section, list]) => (
            <section key={section} className="space-y-3">
              <h2 className="text-base font-semibold">{section}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {list.map((t) => (
                  <Card key={t.id} className={`${STATUS_COLORS[t.status]} border-2`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{t.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => onDelete(t.id, t.name)}
                        >
                          <Trash2 className="size-3 text-destructive" />
                        </Button>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <Users className="size-3" /> {t.capacity} chỗ
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={t.status}
                        onValueChange={(v) => onChangeStatus(t.id, v as TableStatus)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_LABELS) as TableStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                {...form.register("capacity", { required: true, valueAsNumber: true, min: 1 })}
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
    </div>
  );
}
