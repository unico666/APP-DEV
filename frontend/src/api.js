const AUTH_URL = 'http://localhost:4000';
const BLOG_URL = 'http://localhost:5000';

export const tokens = {
  get access() { return localStorage.getItem('accessToken'); },
  get refresh() { return localStorage.getItem('refreshToken'); },
  set(access, refresh) {
    if (access) localStorage.setItem('accessToken', access);
    if (refresh) localStorage.setItem('refreshToken', refresh);
  },
  clear() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

async function send(url, method, body, withToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (withToken && tokens.access) headers.Authorization = `Bearer ${tokens.access}`;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  return { res, data };
}

async function refreshAccessToken() {
  if (!tokens.refresh) return false;
  const { res, data } = await send(`${AUTH_URL}/refresh`, 'POST', { refreshToken: tokens.refresh });
  if (!res.ok) return false;
  tokens.set(data.accessToken, null);
  return true;
}

// Calls an endpoint; on a 401 it tries /refresh once and retries.
async function request(base, path, { method = 'GET', body, auth = false } = {}) {
  let { res, data } = await send(base + path, method, body, auth);
  if (auth && res.status === 401 && (await refreshAccessToken())) {
    ({ res, data } = await send(base + path, method, body, auth));
  }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

export const authApi = {
  register: (body) => request(AUTH_URL, '/register', { method: 'POST', body }),
  login: (body) => request(AUTH_URL, '/login', { method: 'POST', body }),
  logout: (refreshToken) => request(AUTH_URL, '/logout', { method: 'POST', body: { refreshToken } }),
};

export const blogApi = {
  list: () => request(BLOG_URL, '/api/posts'),
  get: (id) => request(BLOG_URL, `/api/posts/${id}`),
  create: (body) => request(BLOG_URL, '/api/posts', { method: 'POST', body, auth: true }),
  update: (id, body) => request(BLOG_URL, `/api/posts/${id}`, { method: 'PUT', body, auth: true }),
  remove: (id) => request(BLOG_URL, `/api/posts/${id}`, { method: 'DELETE', auth: true }),
  mine: () => request(BLOG_URL, '/api/me/posts', { auth: true }),
};
