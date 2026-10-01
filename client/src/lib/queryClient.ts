import { QueryClient, QueryFunction } from "@tanstack/react-query";

const STARTUP_RETRY_LIMIT = 3;
const STARTUP_MESSAGE = "Application initialization is not complete";

async function isStartupResponse(response: Response): Promise<boolean> {
  if (response.status !== 503) return false;

  try {
    const body = await response.clone().json();
    return body?.status === "starting" && body?.message === STARTUP_MESSAGE;
  } catch {
    return false;
  }
}

function getStartupRetryDelay(response: Response): number {
  const retryAfterSeconds = Number(response.headers.get("Retry-After"));
  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) return 5000;
  return Math.min(Math.max(retryAfterSeconds * 1000, 1000), 10000);
}

export async function fetchWithStartupRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let retries = 0;

  while (true) {
    const response = await fetch(input, init);
    if (retries >= STARTUP_RETRY_LIMIT || !(await isStartupResponse(response))) {
      return response;
    }

    // Plesk may route a request to a Passenger worker that is still starting.
    // This exact 503 is returned before API handlers run, so retrying it is safe.
    retries += 1;
    await new Promise((resolve) => setTimeout(resolve, getStartupRetryDelay(response)));
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let message = res.statusText;
    let data: Record<string, any> | undefined;
    try {
      data = JSON.parse(text);
      message = data?.message || data?.error || res.statusText;
    } catch {
      message = text || res.statusText;
    }
    const error = new Error(message) as Error & { status?: number; data?: Record<string, any> };
    error.status = res.status;
    error.data = data;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetchWithStartupRetry(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetchWithStartupRetry(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
