const BASE = import.meta.env.VITE_API_URL || '';

export const getToken = () => localStorage.getItem('token');
export const setSession = (token, user) => {
  localStorage.setItem('token', token);
  if (user) localStorage.setItem('user', JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

async function request(method, path, body, isForm = false) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // if (import.meta.env.DEV) {
  //   console.log('API response:', { method, path, status: res.status, data });
  // }

  if (res.status === 401) {
    clearSession();
    if (!path.includes('/auth/login')) window.location.href = '/login';
  }
  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      (typeof data === 'string' && data) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
  upload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', '/api/common/upload', fd, true);
  },
};

// ---------- response helpers (the exact backend response shape is unknown, so these are flexible) ----------

export function extractList(res) {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== 'object') return [];
  for (const k of ['data', 'content', 'items', 'results', 'bookings', 'customers', 'tests', 'timeSlots', 'slots', 'reports', 'payments']) {
    if (Array.isArray(res[k])) return res[k];
    if (res[k] && typeof res[k] === 'object') {
      const inner = extractList(res[k]);
      if (inner.length) return inner;
    }
  }
  for (const v of Object.values(res)) {
    if (Array.isArray(v)) return v;
  }
  return [];
}

export function findDeep(obj, regex, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 4) return undefined;
  for (const [k, v] of Object.entries(obj)) {
    if (regex.test(k) && typeof v === 'string') return v;
  }
  for (const v of Object.values(obj)) {
    const r = findDeep(v, regex, depth + 1);
    if (r) return r;
  }
  return undefined;
}

export function findUrl(res) {
  if (typeof res === 'string' && res.startsWith('http')) return res;
  const byKey = findDeep(res, /url|path|file|link/i);
  if (byKey) return byKey;
  return undefined;
}

export const idOf = (row) => row?.id ?? row?._id ?? row?.bookingId ?? row?.reportId;
