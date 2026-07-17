import api from './api';

// Departments & Courses
export const departmentsApi = {
  getAll: () => api.get('/departments'),
  getBySlug: (slug: string) => api.get(`/departments/${slug}`),
  getCourses: (slug: string) => api.get(`/departments/${slug}/courses`),
  getAllCourses: () => api.get('/departments/courses/all'),
  create: (data: any) => api.post('/departments', data),
  update: (id: string, data: any) => api.put(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

export const coursesApi = {
  getAll: (params?: any) => api.get('/courses', { params }),
  create: (data: any) => api.post('/courses', data),
  update: (id: string, data: any) => api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
};

// Applications (Admin)
export const applicationsApi = {
  getAll: (params?: any) => api.get('/applications', { params }),
  getById: (id: string) => api.get(`/applications/${id}`),
  updateStatus: (id: string, data: any) => api.patch(`/applications/${id}/status`, data),
  importKuccps: (file: File) => {
    const formData = new FormData();
    formData.append('csv_file', file);
    return api.post('/applications/import/kuccps', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Students (Admin)
export const studentsApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  getById: (id: string) => api.get(`/students/${id}`),
  getStats: () => api.get('/students/stats'),
  update: (id: string, data: any) => api.patch(`/students/${id}`, data),
  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post(`/students/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  generateIdCard: (id: string) => api.get(`/students/${id}/id-card`),
};

// Finance
export const financeApi = {
  getFeeRecords: (params?: any) => api.get('/finance/students', { params }),
  createFeeRecord: (studentId: string, data: any) => api.patch(`/finance/students/${studentId}/fees`, data),
  getReports: () => api.get('/finance/summary'),
};

// Staff
export const staffApi = {
  getAll: (params?: any) => api.get('/staff', { params }),
  getById: (id: string) => api.get(`/staff/${id}`),
  getMyProfile: () => api.get('/staff/me'),
  getStats: () => api.get('/staff/stats'),
  create: (data: any) => api.post('/staff', data),
  update: (id: string, data: any) => api.patch(`/staff/${id}`, data),
  delete: (id: string) => api.delete(`/staff/${id}`),
};

// Designations
export const designationsApi = {
  getAll: () => api.get('/designations'),
  create: (data: any) => api.post('/designations', data),
  update: (id: string, data: any) => api.put(`/designations/${id}`, data),
  delete: (id: string) => api.delete(`/designations/${id}`),
};

// Leave Management
export const leavesApi = {
  getAll: (params?: any) => api.get('/leaves', { params }),
  getById: (id: string) => api.get(`/leaves/${id}`),
  create: (data: any) => api.post('/leaves', data),
  update: (id: string, data: any) => api.put(`/leaves/${id}`, data),
  approve: (id: string, data: any) => api.patch(`/leaves/${id}/approve`, data),
  reject: (id: string, data: any) => api.patch(`/leaves/${id}/reject`, data),
  cancel: (id: string) => api.patch(`/leaves/${id}/cancel`),
};

// Procurement
export const suppliersApi = {
  getAll: (params?: any) => api.get('/suppliers', { params }),
  getById: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
  approve: (id: string) => api.patch(`/suppliers/${id}/approve`),
};

export const requisitionsApi = {
  getAll: (params?: any) => api.get('/requisitions', { params }),
  getById: (id: string) => api.get(`/requisitions/${id}`),
  create: (data: any) => api.post('/requisitions', data),
  update: (id: string, data: any) => api.patch(`/requisitions/${id}`, data),
  submit: (id: string) => api.patch(`/requisitions/${id}/submit`),
  approve: (id: string) => api.patch(`/requisitions/${id}/approve`),
  delete: (id: string) => api.delete(`/requisitions/${id}`),
};

export const rfqsApi = {
  getAll: (params?: any) => api.get('/rfqs', { params }),
  getById: (id: string) => api.get(`/rfqs/${id}`),
  create: (data: any) => api.post('/rfqs', data),
  update: (id: string, data: any) => api.put(`/rfqs/${id}`, data),
  close: (id: string) => api.patch(`/rfqs/${id}/close`),
  award: (id: string, data: any) => api.patch(`/rfqs/${id}/award`, data),
};

export const lposApi = {
  getAll: (params?: any) => api.get('/lpos', { params }),
  getById: (id: string) => api.get(`/lpos/${id}`),
  create: (data: any) => api.post('/lpos', data),
  update: (id: string, data: any) => api.put(`/lpos/${id}`, data),
  approve: (id: string) => api.patch(`/lpos/${id}/approve`),
  issue: (id: string) => api.patch(`/lpos/${id}/issue`),
};

export const grnsApi = {
  getAll: (params?: any) => api.get('/grns', { params }),
  getById: (id: string) => api.get(`/grns/${id}`),
  create: (data: any) => api.post('/grns', data),
  update: (id: string, data: any) => api.put(`/grns/${id}`, data),
  verify: (id: string, data: any) => api.patch(`/grns/${id}/verify`, data),
};

export const inventoryApi = {
  getAll: (params?: any) => api.get('/inventory', { params }),
  getById: (id: string) => api.get(`/inventory/${id}`),
  create: (data: any) => api.post('/inventory', data),
  update: (id: string, data: any) => api.put(`/inventory/${id}`, data),
  adjustStock: (id: string, data: any) => api.post(`/inventory/${id}/adjust`, data),
};

export const assetsApi = {
  getAll: (params?: any) => api.get('/assets', { params }),
  getById: (id: string) => api.get(`/assets/${id}`),
  create: (data: any) => api.post('/assets', data),
  update: (id: string, data: any) => api.patch(`/assets/${id}`, data),
  depreciate: (id: string) => api.post(`/assets/${id}/depreciate`),
  recordMaintenance: (id: string, data: any) => api.post(`/assets/${id}/maintenance`, data),
  dispose: (id: string, data: any) => api.patch(`/assets/${id}/dispose`, data),
  delete: (id: string) => api.delete(`/assets/${id}`),
};

export const budgetsApi = {
  getAll: (params?: any) => api.get('/budgets', { params }),
  getById: (id: string) => api.get(`/budgets/${id}`),
  create: (data: any) => api.post('/budgets', data),
  update: (id: string, data: any) => api.put(`/budgets/${id}`, data),
};

// Resources
export const resourcesApi = {
  getAll: (params?: any) => api.get('/resources', { params }),
  getById: (id: string) => api.get(`/resources/${id}`),
  create: (data: any) => api.post('/resources', data),
  delete: (id: string) => api.delete(`/resources/${id}`),
};

// News
export const newsApi = {
  getAll: (params?: any) => api.get('/news', { params }),
  getById: (id: string) => api.get(`/news/${id}`),
  create: (data: FormData) => api.post('/news', data),
  update: (id: string, data: FormData) => api.put(`/news/${id}`, data),
  delete: (id: string) => api.delete(`/news/${id}`),
};
