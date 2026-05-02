import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { authStorage } from "./auth-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export class ApiException extends Error {
  constructor(
    public readonly error: ApiError,
    public readonly status: number,
  ) {
    super(error.message);
    this.name = "ApiException";
  }
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ─── Request: attach token + tenant headers ───
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = authStorage.getAccess();
  if (access && config.headers) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  const tenantId = authStorage.getActiveTenantId();
  if (tenantId && config.headers) {
    config.headers["X-Tenant-Id"] = tenantId;
  }
  const venueId = authStorage.getActiveVenueId();
  if (venueId && config.headers) {
    config.headers["X-Venue-Id"] = venueId;
  }
  return config;
});

// ─── Response: unwrap {data}, refresh on 401, normalize error ───
let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  const refreshToken = authStorage.getRefresh();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(
      `${API_URL}/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );
    const tokens = res.data?.data;
    if (tokens?.accessToken && tokens?.refreshToken) {
      authStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      return tokens.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<{ error: ApiError }>) => {
    const original = err.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (err.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      if (!refreshPromise) refreshPromise = tryRefresh();
      const newAccess = await refreshPromise;
      refreshPromise = null;
      if (newAccess && original.headers) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      }
      // Refresh failed → clear + redirect
      authStorage.clear();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    const apiErr: ApiError = err.response?.data?.error ?? {
      code: "NETWORK_ERROR",
      message: err.message ?? "Lỗi mạng, vui lòng thử lại.",
    };
    throw new ApiException(apiErr, err.response?.status ?? 0);
  },
);

// Helper trả ra `data` field của response
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<{ data: T }>(url, config);
  return res.data.data;
}
export async function apiPost<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post<{ data: T }>(url, body, config);
  return res.data.data;
}
export async function apiPatch<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.patch<{ data: T }>(url, body, config);
  return res.data.data;
}
export async function apiPut<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.put<{ data: T }>(url, body, config);
  return res.data.data;
}
export async function apiDelete(url: string, config?: AxiosRequestConfig): Promise<void> {
  await api.delete(url, config);
}
