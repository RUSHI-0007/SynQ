/**
 * Central utility to handle API and WebSocket URL building.
 * Ensures the app works on both local and production environments.
 */

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const getApiUrl = (path: string = ''): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${NEXT_PUBLIC_API_URL}${cleanPath}`;
};

export const getWsUrl = (path: string = ''): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Convert http/https to ws/wss
  const wsBase = NEXT_PUBLIC_API_URL.replace(/^http/, 'ws');
  
  return `${wsBase}${cleanPath}`;
};

/**
 * Returns common headers for API calls, including the Ngrok bypass.
 */
export const getApiHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
