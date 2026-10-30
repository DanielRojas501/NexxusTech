const TOKEN_KEY = 'nexxustech_access_token';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api')
  .replace(/\/+$/, '');

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const clearAccessToken = () => {
  if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
};

async function request(path, options = {}) {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return result;
}

function saveAuth(result) {
  if (typeof result?.token !== 'string') throw new Error('The API returned an invalid session.');
  window.localStorage.setItem(TOKEN_KEY, result.token);
  return result;
}

const auth = {
  async register({ email, password }) {
    return saveAuth(await request('/auth/register', { method: 'POST', body: { email, password } }));
  },
  async login({ email, password }) {
    return saveAuth(await request('/auth/login', { method: 'POST', body: { email, password } }));
  },
  async me() {
    return request('/auth/me');
  },
  async updateMe(updates) {
    return request('/auth/me', { method: 'PATCH', body: updates });
  },
  async requestPasswordReset(email) {
    return request('/auth/forgot-password', { method: 'POST', body: { email } });
  },
  async resetPassword(token, password) {
    return request('/auth/reset-password', { method: 'POST', body: { token, password } });
  },
  logout() {
    clearAccessToken();
  },
};

const entities = new Proxy({}, {
  get(_target, entity) {
    if (typeof entity !== 'string') return undefined;
    const endpoint = `/entities/${encodeURIComponent(entity)}`;
    const query = (filters, sort, limit, skip) => {
      const params = new URLSearchParams();
      if (filters && Object.keys(filters).length) params.set('query', JSON.stringify(filters));
      if (typeof sort === 'string') params.set('sort', sort);
      else if (sort && typeof sort === 'object') {
        if (sort.sort) params.set('sort', sort.sort);
        if (sort.limit) params.set('limit', String(sort.limit));
        if (sort.skip) params.set('skip', String(sort.skip));
      }
      if (limit) params.set('limit', String(limit));
      if (skip) params.set('skip', String(skip));
      return params.size ? `?${params}` : '';
    };
    return {
      list: (sort, limit, skip) => request(`${endpoint}${query({}, sort, limit, skip)}`),
      filter: (filters, sort, limit, skip) =>
        request(`${endpoint}${query(filters || {}, sort, limit, skip)}`),
      get: (id) => request(`${endpoint}/${encodeURIComponent(id)}`),
      create: (record) => request(endpoint, { method: 'POST', body: record }),
      update: (id, updates) =>
        request(`${endpoint}/${encodeURIComponent(id)}`, { method: 'PATCH', body: updates }),
      delete: (id) => request(`${endpoint}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    };
  },
});

const functions = {
  invoke: (name, payload) =>
    request(`/functions/${encodeURIComponent(name)}`, { method: 'POST', body: payload }),
};

export const api = { auth, entities, functions };

export async function invokeBackendFunction(name, payload) {
  return functions.invoke(name, payload);
}
