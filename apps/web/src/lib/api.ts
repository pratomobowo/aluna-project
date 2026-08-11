const BASE_URL = import.meta.env.VITE_API_URL ?? "";

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { headers, body, ...rest } = opts;
  const isForm = body instanceof FormData;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(isForm ? {} : { "content-type": "application/json" }),
      ...headers,
    },
    body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => null)) as T | { error?: string } | null;

  if (!res.ok) {
    const msg = data && typeof data === "object" && "error" in data ? String((data as { error?: string }).error) : `Request gagal (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}
