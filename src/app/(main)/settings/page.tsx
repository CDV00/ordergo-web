"use client";

import { Building2 } from "lucide-react";
import { MenuToggle } from "@/components/menu-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentVenue } from "@/hooks/api/use-tenant";
import { BankAccountCard } from "./_components/bank-account-card";
import { InvoiceTaxCard } from "./_components/invoice-tax-card";
import { apiErrorMessage } from "./_components/shared";
import { VenueInfoCard } from "./_components/venue-info-card";

export default function SettingsPage() {
  const venue = useCurrentVenue();

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <MenuToggle />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Cài đặt</h1>
        {venue.data && (
          <span className="text-muted-foreground ml-2 truncate text-sm">· {venue.data.name}</span>
        )}
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4 md:p-6">
        {venue.isLoading ? (
          <>
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-72 w-full" />
          </>
        ) : !venue.data ? (
          <Card>
            <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
              <Building2 className="size-10 opacity-50" />
              {venue.isError
                ? apiErrorMessage(venue.error)
                : "Chưa chọn cơ sở. Hãy chọn một cơ sở để chỉnh cài đặt."}
            </CardContent>
          </Card>
        ) : (
          // key theo venue để form nạp lại khi đổi cơ sở
          <div key={venue.data.id} className="space-y-6">
            <VenueInfoCard venue={venue.data} />
            <InvoiceTaxCard venue={venue.data} />
            <BankAccountCard venue={venue.data} />
          </div>
        )}
      </main>
    </div>
  );
}
