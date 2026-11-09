import { Badge } from "@/components/ui/badge";
import { ApiException } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  CUSTOMER_STATUS_LABEL,
  LOYALTY_TIER_CLASS,
  LOYALTY_TIER_LABEL,
  type CustomerStatus,
  type LoyaltyTier,
} from "@/hooks/api/use-customers";

export function TierBadge({ tier, className }: { tier: LoyaltyTier; className?: string }) {
  return (
    <Badge className={cn("border-transparent", LOYALTY_TIER_CLASS[tier], className)}>
      {LOYALTY_TIER_LABEL[tier]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <Badge variant="outline" className="font-normal">
      {CUSTOMER_STATUS_LABEL[status]}
    </Badge>
  );
}

/** Tên hiển thị (đã che) — khách chưa để lại tên thì ghi "Khách vãng lai". */
export function displayName(name: string | null, anonymizedAt?: string | null): string {
  if (anonymizedAt) return "Đã xoá dữ liệu cá nhân";
  return name ?? "Khách vãng lai";
}

export function isForbidden(err: unknown): boolean {
  return err instanceof ApiException && err.status === 403;
}

export function isNotFound(err: unknown): boolean {
  return err instanceof ApiException && err.status === 404;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiException) return err.error?.message ?? err.message;
  if (err instanceof Error) return err.message;
  return "Đã có lỗi xảy ra, vui lòng thử lại.";
}
