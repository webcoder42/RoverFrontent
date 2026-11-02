import { queryClient } from "@/lib/queryClient";

interface CachedResponse {
  body: string;
  headers: [string, string][];
  status: number;
  statusText: string;
}

class UncachedResponseError extends Error {
  constructor(readonly response: Response) {
    super("This response should not be cached.");
  }
}

const createResponse = (cached: CachedResponse): Response => {
  const headers = new Headers(cached.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");

  return new Response([204, 205, 304].includes(cached.status) ? null : cached.body, {
    status: cached.status,
    statusText: cached.statusText,
    headers,
  });
};

const getApiRequest = (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : undefined;
  const url = new URL(request?.url ?? input.toString(), window.location.origin);
  const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
  const headers = new Headers(request?.headers);
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
  return { url, method, headers };
};

const getResponseSnapshot = async (response: Response): Promise<CachedResponse> => ({
  body: await response.text(),
  headers: Array.from(response.headers.entries()),
  status: response.status,
  statusText: response.statusText,
});

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { url, method, headers } = getApiRequest(input, init);
  const isSameOriginApi = url.origin === window.location.origin && url.pathname.startsWith("/api/");

  if (!isSameOriginApi || method !== "GET") {
    const response = await fetch(input, init);
    if (isSameOriginApi && method !== "GET" && response.ok) {
      await queryClient.invalidateQueries({ queryKey: ["api"] });
    }
    return response;
  }

  const requestHeaders = Array.from(headers.entries()).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const queryKey = ["api", url.toString(), requestHeaders] as const;

  try {
    const cached = await queryClient.fetchQuery({
      queryKey,
      staleTime: Infinity,
      retry: false,
      queryFn: async (): Promise<CachedResponse> => {
        const response = await fetch(input, init);
        const contentType = response.headers.get("content-type") ?? "";
        const redisCacheStatus = response.headers.get("x-redis-cache");

        if (
          !response.ok ||
          !/\bapplication\/(?:[\w.-]+\+)?json\b/i.test(contentType) ||
          (redisCacheStatus !== "HIT" && redisCacheStatus !== "MISS")
        ) {
          throw new UncachedResponseError(response);
        }

        return getResponseSnapshot(response.clone());
      },
    });

    return createResponse(cached);
  } catch (error) {
    if (error instanceof UncachedResponseError) {
      return error.response;
    }
    throw error;
  }
}
