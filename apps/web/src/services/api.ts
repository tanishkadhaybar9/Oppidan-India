import type { ApiResponse } from "../types/auth";

const defaultApiUrl = import.meta.env.PROD
  ? "https://erms-api-xp4w.onrender.com"
  : "";
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || defaultApiUrl).trim();
const API_BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
const inFlightGetRequests = new Map<string, Promise<any>>();

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export interface ApiError<T = unknown> extends ApiResponse<T> {
  statusCode?: number;
  retryAfter?: number;
  isRateLimit?: boolean;
}

async function executeFetch<T>(url: string, options: RequestOptions, skipAuth: boolean): Promise<ApiResponse<T>> {
  const { headers = {}, ...restOptions } = options;

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Content-Type") && !(restOptions.body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  // Attach access token if available
  if (!skipAuth && inMemoryAccessToken) {
    requestHeaders.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }

  let response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
    credentials: "include", // Ensure cookies (refreshToken) are always sent
  });

  // Handle 401 and attempt automatic token refresh (synchronized across all concurrent requests)
  if (
    response.status === 401 &&
    !url.includes("/auth/login") &&
    !url.includes("/auth/register") &&
    !url.includes("/auth/refresh")
  ) {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          if (refreshRes.ok) {
            const refreshData = (await refreshRes.json()) as ApiResponse<{
              accessToken: string;
            }>;
            if (refreshData.data?.accessToken) {
              setAccessToken(refreshData.data.accessToken);
              return refreshData.data.accessToken;
            }
          }
          setAccessToken(null);
          return null;
        } catch {
          setAccessToken(null);
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    const newToken = await refreshPromise;
    if (newToken) {
      requestHeaders.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
        credentials: "include",
      });
    }
  }

  // Handle 429 Too Many Requests
  if (response.status === 429) {
    const retryAfterHeader = response.headers.get("Retry-After");
    const retrySec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
    const errPayload = await response.json().catch(() => null);

    const error: ApiError = {
      success: false,
      message: errPayload?.message || "Too many requests. Please slow down.",
      statusCode: 429,
      retryAfter: isNaN(retrySec) ? 60 : retrySec,
      isRateLimit: true,
    };
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let data: ApiResponse<T>;

  if (isJson) {
    try {
      data = (await response.json()) as ApiResponse<T>;
    } catch {
      data = {
        success: false,
        message: "Failed to parse JSON response from server.",
      };
    }
  } else {
    // Non-JSON response received (e.g. HTML 404, Vercel SPA fallback, or server error page)
    console.error(`[API Error] Received non-JSON response from: ${url} (status: ${response.status}, content-type: ${contentType})`);

    let fallbackMsg = "Backend returned an unexpected non-JSON response.";
    if (!API_BASE_URL) {
      fallbackMsg = "Backend URL is not configured. Please add VITE_API_BASE_URL in Vercel Environment Variables and Redeploy.";
    } else if (response.status === 404) {
      fallbackMsg = `API endpoint not found (404) at ${url}.`;
    } else if (response.status === 502 || response.status === 503 || response.status === 504) {
      fallbackMsg = "Backend server is waking up (Render cold start). Please wait 10-20 seconds and try again.";
    } else if (response.status >= 500) {
      fallbackMsg = `Backend server error (${response.status}) at ${url}. Check Render server logs.`;
    }

    data = {
      success: false,
      message: fallbackMsg,
    };
  }

  if (!response.ok || !isJson) {
    const error: ApiError = {
      ...data,
      success: false,
      statusCode: response.status,
    };
    throw error;
  }

  return data;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { skipAuth = false } = options;
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const method = (options.method || "GET").toUpperCase();

  // Deduplicate identical in-flight GET requests
  if (method === "GET") {
    const cacheKey = `${url}|${skipAuth}|${inMemoryAccessToken || ""}`;
    if (inFlightGetRequests.has(cacheKey)) {
      return inFlightGetRequests.get(cacheKey)!;
    }

    const promise = executeFetch<T>(url, options, skipAuth).finally(() => {
      inFlightGetRequests.delete(cacheKey);
    });

    inFlightGetRequests.set(cacheKey, promise);
    return promise;
  }

  return executeFetch<T>(url, options, skipAuth);
}

