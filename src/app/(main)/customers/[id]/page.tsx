"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomer } from "@/hooks/api/use-customers";
import { usePermissions } from "@/hooks/use-permissions";
import { AnonymizeDialog } from "../_components/anonymize-dialog";
import {
  LoyaltyCard,
  LoyaltyTransactionsCard,
  RecentOrdersCard,
} from "../_components/customer-loyalty";
import { CustomerProfileCard } from "../_components/customer-profile-card";
import { displayName, errorMessage, isForbidden, isNotFound } from "../_components/customer-utils";
import { CustomersShell, StateMessage } from "../_components/customers-shell";
import { EditCustomerDialog } from "../_components/edit-customer-dialog";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const customer = useCustomer(id);
  const { can } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);
  const [anonymizeOpen, setAnonymizeOpen] = useState(false);
  const c = customer.data;

  if (customer.isLoading) {
    return (
      <CustomersShell title="Đang tải...">
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </CustomersShell>
    );
  }

  if (customer.error || !c) {
    const err = customer.error;
    const [title, description] = isForbidden(err)
      ? ["Bạn không có quyền xem khách hàng", undefined]
      : isNotFound(err) || !err
        ? ["Không tìm thấy khách hàng", "Khách không tồn tại hoặc thuộc quán khác."]
        : ["Không tải được khách hàng", errorMessage(err)];
    return (
      <CustomersShell title="Không tìm thấy">
        <StateMessage title={title} description={description} backLink />
      </CustomersShell>
    );
  }

  const anonymized = !!c.anonymizedAt;
  const canEdit = !anonymized && can("order.manage");
  const canAnonymize = !anonymized && can("customer.manage");
  const title = displayName(c.name, c.anonymizedAt);

  return (
    <CustomersShell title={title}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="truncate text-xl font-bold sm:text-2xl">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="min-h-[44px]" asChild>
            <Link href="/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>
          {canEdit && (
            <Button variant="outline" className="min-h-[44px]" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Sửa hồ sơ
            </Button>
          )}
          {canAnonymize && (
            <Button
              variant="destructive"
              className="min-h-[44px]"
              onClick={() => setAnonymizeOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xoá dữ liệu cá nhân
            </Button>
          )}
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <CustomerProfileCard customer={c} />
          <LoyaltyCard customer={c} />
        </div>
        <div className="space-y-4">
          <RecentOrdersCard customer={c} />
          <LoyaltyTransactionsCard customer={c} />
        </div>
      </div>

      {canEdit && <EditCustomerDialog customer={c} open={editOpen} onOpenChange={setEditOpen} />}
      {canAnonymize && (
        <AnonymizeDialog customer={c} open={anonymizeOpen} onOpenChange={setAnonymizeOpen} />
      )}
    </CustomersShell>
  );
}
