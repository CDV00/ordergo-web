// ─── Identity ───
export interface PublicUser {
  id: string;
  phone: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  status: string;
}

export interface Membership {
  id: string;
  tenantId: string;
  userId: string;
  venueId: string | null;
  roleCode: string;
  permissions: string[];
  status: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessExpiresIn: string;
  };
  membership: {
    tenantId: string | null;
    venueId: string | null;
    roleCode: string | null;
    permissions: string[];
  };
  needsSetup: boolean;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface MeResult {
  user: PublicUser;
  memberships: Membership[];
  tenants: TenantSummary[];
}

// ─── Tenant & Venue ───
export interface Tenant {
  id: string;
  name: string;
  legalName: string | null;
  taxCode: string | null;
  ownerUserId: string;
  plan: {
    code: "free" | "starter" | "pro" | "business" | "enterprise";
    enabledModules: string[];
    seatLimit: number;
    venueLimit: number;
    trialEndsAt: string | null;
  };
  status: "active" | "suspended" | "cancelled";
}

export type BusinessType =
  | "restaurant"
  | "cafe"
  | "bar"
  | "hotel"
  | "homestay"
  | "spa"
  | "gym"
  | "education"
  | "coworking";

export interface Venue {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  businessType: BusinessType;
  // Mongoose bỏ object rỗng khi lưu → có thể không có
  address?: {
    line1?: string;
    ward?: string;
    district?: string;
    city?: string;
    province?: string;
    country?: string;
  };
  contact?: { phone?: string; email?: string };
  logoUrl: string | null;
  timezone: string;
  currency: string;
  status: "active" | "inactive" | "archived";
  settings: {
    serviceChargeRate: number;
    vatRate: number;
    autoEinvoice: boolean;
    einvoiceProvider: string | null;
    receiptFooter?: string | null;
    bankAccount: BankAccount | null;
  };
}

export interface BankAccount {
  bankBin: string;
  bankName: string | null;
  accountNumber: string;
  accountName: string | null;
}

export interface Bank {
  bin: string;
  name: string;
}

// ─── Catalog ───
export interface Money {
  amount: number;
  currency: string;
}

export interface MenuCategory {
  id: string;
  tenantId: string;
  venueId: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface Variant {
  id: string;
  name: string;
  priceModifier: Money;
  isDefault: boolean;
}

export interface ToppingOption {
  id: string;
  name: string;
  priceModifier: Money;
  isAvailable: boolean;
}

export interface ToppingGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: ToppingOption[];
}

export interface MenuItem {
  id: string;
  tenantId: string;
  venueId: string | null;
  categoryId: string;
  name: string;
  description: string | null;
  sku: string | null;
  basePrice: Money;
  imageUrl: string | null;
  displayOrder: number;
  variants: Variant[];
  toppingGroups: ToppingGroup[];
  isAvailable: boolean;
  unavailableReason: string | null;
  tags: string[];
}

// ─── Tables ───
export type TableStatus = "available" | "occupied" | "reserved" | "cleaning" | "out_of_order";

export interface RestaurantTable {
  id: string;
  tenantId: string;
  venueId: string;
  section: string;
  name: string;
  capacity: number;
  status: TableStatus;
  currentOrderId: string | null;
  occupiedSince: string | null;
}

// ─── Orders ───
export type OrderStatus =
  | "draft"
  | "sent"
  | "in_progress"
  | "ready"
  | "served"
  | "paid"
  | "refunded"
  | "cancelled";

export interface OrderLine {
  id: string;
  productType: string;
  productId: string;
  productSnapshot: { name: string; sku: string | null; imageUrl: string | null };
  variantId: string | null;
  variantSnapshot: { name: string; priceModifier: Money } | null;
  modifiers: Array<{
    groupId: string;
    groupName: string;
    optionId: string;
    optionName: string;
    priceModifier: Money;
  }>;
  quantity: number;
  unitPrice: Money;
  lineSubtotal: Money;
  lineTotal: Money;
  note: string | null;
  kitchenStatus: KitchenStatus;
  /** null = món chưa gửi bếp (vừa gọi thêm) */
  sentToKitchenAt: string | null;
  readyAt: string | null;
  servedAt: string | null;
}

export type KitchenStatus = "queued" | "preparing" | "ready" | "served" | "cancelled";

export interface DiscountInfo {
  type: "percent" | "amount";
  value: number;
  reason: string | null;
}

/** Trạng thái đơn còn mở (chưa thu / chưa huỷ) — khớp OPEN_ORDER_STATUSES của API */
export const OPEN_ORDER_STATUSES: OrderStatus[] = [
  "draft",
  "sent",
  "in_progress",
  "ready",
  "served",
];

export interface Order {
  id: string;
  tenantId: string;
  venueId: string;
  orderNumber: string;
  orderType: "dine_in" | "takeaway" | "delivery" | "online" | "room_service";
  customerId: string | null;
  tableId: string | null;
  tableName: string | null;
  lines: OrderLine[];
  pricing: {
    subtotal: Money;
    discount: Money;
    serviceCharge: Money;
    tax: Money;
    total: Money;
  };
  discountInfo: DiscountInfo | null;
  status: OrderStatus;
  source: "pos" | "qr_menu" | "online" | "third_party" | "phone";
  cancelReason: string | null;
  createdAt: string;
  sentAt: string | null;
  paidAt: string | null;
  /** Khách báo thanh toán từ trang QR, chờ nhân viên xác nhận (null khi chưa báo / đã xong) */
  paymentRequest?: {
    method: "vietqr" | "cash" | "card";
    amount: number;
    requestedAt: string;
  } | null;
  cancelledAt: string | null;
}
