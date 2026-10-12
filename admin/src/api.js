const TOKEN_KEY = 'madi_admin_token';

export const auth = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  },
  set: (t) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = { Authorization: `Bearer ${auth.get()}`, 'ngrok-skip-browser-warning': '1' };
  if (body) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(`/api/admin${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  } catch {
    throw new Error("Server bilan aloqa yo'q. Backend ishlayaptimi?");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/login') {
    auth.set('');
    onUnauthorized();
  }
  if (!res.ok) throw new Error(data.error || 'Xatolik yuz berdi');
  return data;
}

export const api = {
  login: (password) => request('/login', { method: 'POST', body: { password } }),
  orders: (status) => request(`/orders${status ? `?status=${status}` : ''}`),
  // Chek rasmi — avtorizatsiya sarlavhasi bilan olinadi
  receipt: async (id) => {
    const res = await fetch(`/api/admin/orders/${id}/receipt`, { headers: { Authorization: `Bearer ${auth.get()}` } });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Chekni ochib bo'lmadi");
    return res.blob();
  },
  setStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  products: () => request('/products'),
  createProduct: (data) => request('/products', { method: 'POST', body: data }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  categories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  reviews: () => request('/reviews'),
  upload: (file) => {
    const form = new FormData();
    form.append('image', file);
    return request('/upload', { method: 'POST', form });
  },
  printQueue: () => request('/print-queue'),
  claimPrint: (id) => request(`/orders/${id}/print-claim`, { method: 'POST' }),
  printNow: (id) => request(`/orders/${id}/print`, { method: 'POST' }),
  printTest: () => request('/print-test', { method: 'POST' }),
  settings: () => request('/settings'),
  saveSettings: (data) => request('/settings', { method: 'PUT', body: data }),
};
