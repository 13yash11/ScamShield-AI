export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

let sessionActive = false;
let refreshRequest: Promise<boolean> | null = null;

export function setSessionActive(active: boolean): void { sessionActive = active; }

async function fetchWithTimeout(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  try {
    return await fetch(`${API_BASE}${path}`, { ...init, credentials: 'include', signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('The request timed out. Please try again.');
    throw new Error('Cannot reach the server. Check your connection and try again.');
  } finally { clearTimeout(timeout); }
}

async function errorFor(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => ({}));
  const detail = typeof body.detail === 'string' ? body.detail : typeof body.message === 'string' ? body.message : `Request failed (HTTP ${response.status}).`;
  return new ApiError(detail, response.status);
}

async function refreshSession(): Promise<boolean> {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      const response = await fetchWithTimeout('/auth/refresh', { method: 'POST' });
      if (response.ok) return true;
      if (response.status !== 401) throw await errorFor(response);
      setSessionActive(false);
      window.dispatchEvent(new Event('scamshield:session-ended'));
      return false;
    })().finally(() => { refreshRequest = null; });
  }
  return refreshRequest;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (sessionActive) headers.set('X-ScamShield-Session', 'active');
  let response = await fetchWithTimeout(path, { ...init, headers });
  if (response.status === 401 && allowRefresh && await refreshSession()) response = await fetchWithTimeout(path, { ...init, headers });
  if (!response.ok) throw await errorFor(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function jsonBody(body: unknown): Pick<RequestInit, 'headers' | 'body'> {
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
