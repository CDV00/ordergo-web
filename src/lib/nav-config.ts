import {
  BarChart3,
  ChefHat,
  Clock,
  DollarSign,
  Home,
  type LucideIcon,
  Receipt,
  Settings,
  Store,
  UserCog,
  Users,
  UtensilsCrossed,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** Action chính cho server hot path — render ở mobile bottom nav */
  hotPath?: boolean;
  /** Quyền yêu cầu (so với membership.permissions). Chưa enforce, để doc */
  permission?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Vận hành",
    items: [
      { title: "POS — Gọi món", url: "/pos", icon: UtensilsCrossed, hotPath: true, permission: "order.create" },
      { title: "Bàn ăn", url: "/tables", icon: Clock, hotPath: true },
      { title: "Đơn hàng", url: "/orders", icon: Receipt, hotPath: true },
      { title: "Màn bếp", url: "/kds", icon: ChefHat, hotPath: true, permission: "order.update_kitchen_status" },
    ],
  },
  {
    label: "Quản lý",
    items: [
      { title: "Menu & Món", url: "/menu", icon: Store, permission: "menu.manage" },
      { title: "Khách hàng", url: "/customers", icon: Users },
      { title: "Nhân viên", url: "/staff", icon: UserCog, permission: "staff.invite" },
    ],
  },
  {
    label: "Thống kê",
    items: [
      { title: "Tổng quan", url: "/", icon: Home },
      { title: "Báo cáo", url: "/reports", icon: BarChart3, permission: "report.view" },
      { title: "Thanh toán", url: "/payments", icon: DollarSign },
    ],
  },
];

export const NAV_FOOTER: NavItem[] = [
  { title: "Cài đặt", url: "/settings", icon: Settings },
];

/** Ô bottom nav mobile — luôn 4 items, item thứ 5 là "Khác" mở sheet */
export const MOBILE_NAV: NavItem[] = NAV_GROUPS[0].items.slice(0, 4);

export const ALL_NAV_ITEMS: NavItem[] = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  ...NAV_FOOTER,
];

/**
 * Match url với pathname.
 *  - "/" chỉ active đúng "/"
 *  - "/orders" active cho "/orders" và "/orders/:id"
 */
export function isNavActive(itemUrl: string, pathname: string): boolean {
  if (itemUrl === "/") return pathname === "/";
  return pathname === itemUrl || pathname.startsWith(itemUrl + "/");
}
