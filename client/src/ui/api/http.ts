import { clearToken, getToken } from "../auth/token";

export type ApiError = { error: string; details?: unknown };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (res.status === 204) return undefined as T;

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    if (res.status === 401) clearToken();
    const msg = typeof data?.error === "string" ? data.error : "Request failed";
    throw Object.assign(new Error(msg), { status: res.status, data });
  }
  return data as T;
}

