import axios, { AxiosError, AxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

export interface PublicApiError {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export class PublicApiException extends Error {
  constructor(
    public readonly error: PublicApiError,
    public readonly status: number,
  ) {
    super(error.message);
    this.name = "PublicApiException";
  }
}

/**
 * API client cho customer-facing PWA — KHÔNG dùng JWT staff.
 * Dùng cookies HttpOnly do BE set ở /qr scan response.
 *
 * `withCredentials: true` để browser tự gửi cookie cross-origin.
 */
export const publicApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 15_000,
});

publicApi.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error: PublicApiError }>) => {
    const apiErr: PublicApiError = err.response?.data?.error ?? {
      code: "NETWORK_ERROR",
      message: err.message ?? "Lỗi mạng, vui lòng thử lại.",
    };
    throw new PublicApiException(apiErr, err.response?.status ?? 0);
  },
);

export async function pubGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await publicApi.get<{ data: T }>(url, config);
  return res.data.data;
}
export async function pubPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await publicApi.post<{ data: T }>(url, body, config);
  return res.data.data;
}
