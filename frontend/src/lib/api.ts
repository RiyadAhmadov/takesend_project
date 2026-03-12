import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('takesend-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const authAPI = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (data: { phone: string; code: string; name?: string; surname?: string; role?: string }) =>
    api.post('/auth/verify-otp', data),
  getMe: () => api.get('/auth/me')
};

export const ordersAPI = {
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  accept: (id: string) => api.post(`/orders/${id}/accept`),
  updateStatus: (id: string, status: string, note?: string) =>
    api.patch(`/orders/${id}/status`, { status, note }),
  estimatePrice: (params: any) => api.get('/orders/price/estimate', { params }),
  review: (id: string, data: { rating: number; comment?: string }) =>
    api.post(`/orders/${id}/review`, data)
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.patch('/users/profile', data),
  setAvailability: (isOnline: boolean) => api.patch('/users/availability', { isOnline }),
  getEarnings: () => api.get('/users/stats/earnings')
};

export const uploadsAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  banUser: (id: string, isBanned: boolean, reason?: string) =>
    api.patch(`/admin/users/${id}/ban`, { isBanned, reason }),
  verifyId: (id: string) => api.patch(`/admin/users/${id}/verify-id`),
  getOrders: (params?: any) => api.get('/admin/orders', { params }),
  getPricing: () => api.get('/admin/pricing'),
  updatePricing: (data: any) => api.post('/admin/pricing', data),
  getLogs: () => api.get('/admin/logs')
};
