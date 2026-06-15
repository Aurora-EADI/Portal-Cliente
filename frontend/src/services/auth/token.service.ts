import axios from 'axios';

const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

const EXPIRES_AT_KEY = 'token_expires_at';

export function saveTokenExpiry(expiresAt: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(EXPIRES_AT_KEY, expiresAt);
}

export function getTokenExpiry(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(EXPIRES_AT_KEY);
}

export function isSessionExpired(): boolean {
  if (MOCK_MODE) return false;
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return new Date(expiry).getTime() < Date.now();
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post(`${backendApiUrl}/auth/refresh`, null, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });

    const { expires_at } = response.data;

    if (expires_at) {
      saveTokenExpiry(expires_at);
    }

    return expires_at ?? 'ok';
  } catch {
    return null;
  }
}

export async function refreshAccessTokenWithRetry(maxRetries = 2): Promise<string | null> {
  if (MOCK_MODE) return 'mock-token';
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await refreshAccessToken();
    if (result) return result;
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  return null;
}

export async function logout(): Promise<void> {
  if (MOCK_MODE) return;
  try {
    await axios.post(`${backendApiUrl}/auth/logout`, null, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Keep local cleanup even if the backend is unavailable.
  }
}

export function clearAllAuthData(): void {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem('auth_session');
  localStorage.removeItem('user_permissions');
  document.cookie = 'auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}
