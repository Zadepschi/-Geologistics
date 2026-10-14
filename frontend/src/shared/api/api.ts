
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export function apiFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return fetch(`${API_URL}${normalizedPath}`, options);
}
