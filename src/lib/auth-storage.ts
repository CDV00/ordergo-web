// MVP: localStorage. Production: chuyển sang httpOnly cookie qua route handler.

const ACCESS = "ordergo.accessToken";
const REFRESH = "ordergo.refreshToken";
const TENANT = "ordergo.activeTenantId";
const VENUE = "ordergo.activeVenueId";

export const authStorage = {
  getAccess(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS);
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH);
  },
  setTokens(access: string, refresh: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS, access);
    window.localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS);
    window.localStorage.removeItem(REFRESH);
    window.localStorage.removeItem(TENANT);
    window.localStorage.removeItem(VENUE);
  },
  getActiveTenantId(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TENANT);
  },
  setActiveTenantId(id: string | null) {
    if (typeof window === "undefined") return;
    if (id) window.localStorage.setItem(TENANT, id);
    else window.localStorage.removeItem(TENANT);
  },
  getActiveVenueId(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(VENUE);
  },
  setActiveVenueId(id: string | null) {
    if (typeof window === "undefined") return;
    if (id) window.localStorage.setItem(VENUE, id);
    else window.localStorage.removeItem(VENUE);
  },
};
