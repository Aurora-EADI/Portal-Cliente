const FALLBACK_API_URL = '/api';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_URL;

export const backendApiUrl = rawApiUrl.replace(/\/+$/, '');
export const backendProxyBasePath = '/backend-api';
