"use client";

import { Building2, Settings } from "lucide-react";
import { MenuToggle } from "@/components/menu-toggle";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentVenue } from "@/hooks/api/use-tenant";
import { BankAccountCard } from "./_components/bank-account-card";
import { InvoiceTaxCard } from "./_components/invoice-tax-card";
import { apiErrorMessage } from "./_components/shared";
import { VenueInfoCard } from "./_components/venue-info-card";

export default function SettingsPage() {
  const venue = useCurrentVenue();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
      <FadeIn className="flex items-start gap-2">
        <MenuToggle className="mt-1" />
        <PageHeader
          className="min-w-0 flex-1"
          icon={Settings}
          title="Cài đặt"
          description={
            venue.data
              ? `Cơ sở: ${venue.data.name}`
              : "Thông tin quán, hoá đơn và thanh toán của cơ sở"
          }
        />
      </FadeIn>

      {venue.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : !venue.data ? (
        <EmptyState
          icon={Building2}
          className="bg-muted/30"
          title={venue.isError ? "Không tải được cài đặt" : "Chưa chọn cơ sở"}
          description={
            venue.isError
              ? apiErrorMessage(venue.error)
              : "Chưa chọn cơ sở. Hãy chọn một cơ sở để chỉnh cài đặt."
          }
        />
      ) : (
        // key theo venue để form nạp lại khi đổi cơ sở
        <Stagger key={venue.data.id} className="space-y-6" stagger={0.06}>
          <StaggerItem>
            <VenueInfoCard venue={venue.data} />
          </StaggerItem>
          <StaggerItem>
            <InvoiceTaxCard venue={venue.data} />
          </StaggerItem>
          <StaggerItem>
            <BankAccountCard venue={venue.data} />
          </StaggerItem>
        </Stagger>
      )}
    </div>
  );
}
