/**
 * Tiny fetch wrapper.
 * - Prefixes /api
 * - Attaches the auth token when present
 * - Throws an Error carrying the server's message + status for every non-2xx
 */
import { useAuthStore } from '../store/auth';

/**
 * Local dev: requests go to `/api` and Vite proxies them to Express.
 * Production (Vercel): set VITE_API_URL to your Render API origin, e.g.
 *   VITE_API_URL=https://meridian-api.onrender.com/api
 */
const BASE = import.meta.env.VITE_API_URL || '/api';

export const api = async (path, { method = 'GET', body, params } = {}) => {
  let url = `${BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const token = useAuthStore.getState().token;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    const err = new Error(json?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = json?.errors;
    throw err;
  }

  return json;
};

export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n ?? 0);

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
