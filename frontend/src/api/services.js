import api from './axios';

// Auth
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Library
const libraryRequestConfig = { headers: { 'x-skip-logout': 'true' } };

export const libraryAPI = {
  get: (libraryId) => api.get('/library', { params: libraryId ? { libraryId } : undefined }),
  getAll: () => api.get('/library', { params: { all: true } }),
  getById: (id) => api.get('/library', { params: { libraryId: id } }),
  update: (data) => api.put('/library', data, libraryRequestConfig),
  uploadLogo: (formData) => api.post('/library/logo', formData, { ...libraryRequestConfig, headers: { ...libraryRequestConfig.headers, 'Content-Type': 'multipart/form-data' } }),
  uploadBanner: (formData) => api.post('/library/banner', formData, { ...libraryRequestConfig, headers: { ...libraryRequestConfig.headers, 'Content-Type': 'multipart/form-data' } }),
  uploadGallery: (formData) => api.post('/library/gallery', formData, { ...libraryRequestConfig, headers: { ...libraryRequestConfig.headers, 'Content-Type': 'multipart/form-data' } }),
  deleteGalleryImage: (imageUrl) => api.delete('/library/gallery', { ...libraryRequestConfig, data: { imageUrl } }),
  uploadUpiQr: (formData) => api.post('/library/upi-qr', formData, { ...libraryRequestConfig, headers: { ...libraryRequestConfig.headers, 'Content-Type': 'multipart/form-data' } }),
};

// Notices
export const noticeAPI = {
  getPublic: (params) => api.get('/notices/public', { params }),
  getAll: () => api.get('/notices'),
  create: (data) => api.post('/notices', data),
  update: (id, data) => api.put(`/notices/${id}`, data),
  delete: (id) => api.delete(`/notices/${id}`),
};

// Slots
export const slotAPI = {
  getAll: (params) => api.get('/slots', { params }),
  getOne: (id) => api.get(`/slots/${id}`),
  create: (data) => api.post('/slots', data),
  update: (id, data) => api.put(`/slots/${id}`, data),
  delete: (id) => api.delete(`/slots/${id}`),
};

// Seats
export const seatAPI = {
  getAll: (params) => api.get('/seats', { params }),
  getAvailable: (slotId, params) => api.get('/seats/available', { params: { slotId, ...params } }),
  getOne: (id) => api.get(`/seats/${id}`),
  create: (data) => api.post('/seats', data),
  createBulk: (data) => api.post('/seats/bulk', data),
  update: (id, data) => api.put(`/seats/${id}`, data),
  delete: (id) => api.delete(`/seats/${id}`),
  checkAvailability: (id, slotId) => api.post(`/seats/${id}/check-availability`, { slotId }),
};

// Members
export const memberAPI = {
  getAll: (params) => api.get('/members', { params }),
  getOne: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
};

// Fees
export const feeAPI = {
  getMemberFees: (memberId) => api.get(`/fees/member/${memberId}`),
  updateStatus: (id, data) => api.put(`/fees/${id}`, data),
  getTodaySummary: () => api.get('/fees/summary/today'),
  getPendingSummary: () => api.get('/fees/summary/pending'),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  getSlotDetails: (id) => api.get(`/dashboard/slot/${id}`),
};
