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
  getTerms: (id: string) => api.get(`/students/${id}/terms`),
  // Bulk import from CSV / XLS / XLSX. The preview checks the file and creates nothing.
  importTemplate: () => api.get('/students/import/template', { responseType: 'blob' }),
  importPreview: (file: File, allowSimilar = false) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('allow_similar', String(allowSimilar));
    return api.post('/students/import/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  importStudents: (file: File, allowSimilar = false) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('allow_similar', String(allowSimilar));
    return api.post('/students/import', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 10 * 60 * 1000 });
  },
  // Fold an older record of the same person into this one (keeps balances, payments, documents and history)
  merge: (id: string, mergeStudentId: string) => api.post(`/students/${id}/merge`, { merge_student_id: mergeStudentId }),
};

// Finance
export const financeApi = {
  getFeeRecords: (params?: any) => api.get('/finance/students', { params }),
  createFeeRecord: (studentId: string, data: any) => api.patch(`/finance/students/${studentId}/fees`, data),
  getReports: () => api.get('/finance/summary'),
  getReportFilters: () => api.get('/finance/reports/filters'),
  // Fee analytics: computed from term bills and recorded payments
  getAnalytics: (params?: any) => api.get('/finance/analytics', { params }),
  getAnalyticsHealth: () => api.get('/finance/analytics/health'),
  // Excel downloads — returned as a Blob
  exportFeesReport: (params?: any) => api.get('/finance/reports/fees/export', { params, responseType: 'blob' }),
  exportStudentsReport: (params?: any) => api.get('/finance/reports/students/export', { params, responseType: 'blob' }),
};

// Student documents issued by the college (Admission Letter, Letter of Acceptance, ...)
export const studentDocumentsApi = {
  getMine: () => api.get('/student-documents/me'),
  getForStudent: (studentId: string) => api.get(`/student-documents/${studentId}`),
  issue: (studentId: string, data: { documents: string[] | 'all'; regenerate?: boolean }) => api.post(`/student-documents/${studentId}/issue`, data),
  bulkIssue: (data: { student_ids: string[]; documents: string[] | 'all'; regenerate?: boolean }) => api.post('/student-documents/bulk-issue', data),
  download: (studentId: string, slug: string, params?: any) => api.get(`/student-documents/${studentId}/${slug}/download`, { params, responseType: 'blob' }),
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
  update: (id: string, data: any) => api.patch(`/designations/${id}`, data),
  delete: (id: string) => api.delete(`/designations/${id}`),
};

// Leave Management
export const leavesApi = {
  getAll: (params?: any) => api.get('/leaves', { params }),
  getById: (id: string) => api.get(`/leaves/${id}`),
  getMyLeaveRequests: () => api.get('/leaves/me'),
  getMyLeaveBalance: (params?: any) => api.get('/leaves/balance', { params }),
  getStatistics: (params?: any) => api.get('/leaves/stats', { params }),
  create: (data: any) => api.post('/leaves', data),
  update: (id: string, data: any) => api.put(`/leaves/${id}`, data),
  approve: (id: string, data: any) => api.patch(`/leaves/${id}/approve`, data),
  reject: (id: string, data: any) => api.patch(`/leaves/${id}/approve`, { ...data, status: 'REJECTED' }),
  cancel: (id: string) => api.patch(`/leaves/${id}/cancel`),
};

// Procurement
export const suppliersApi = {
  getAll: (params?: any) => api.get('/suppliers', { params }),
  getById: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.patch(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
  approve: (id: string) => api.patch(`/suppliers/${id}/approve`),
};

export const requisitionsApi = {
  getAll: (params?: any) => api.get('/requisitions', { params }),
  getById: (id: string) => api.get(`/requisitions/${id}`),
  create: (data: any) => api.post('/requisitions', data),
  update: (id: string, data: any) => api.patch(`/requisitions/${id}`, data),
  submit: (id: string) => api.patch(`/requisitions/${id}/submit`),
  units: () => api.get('/requisitions/units'),
  approve: (id: string, data?: any) => api.patch(`/requisitions/${id}/approve`, data),
  delete: (id: string) => api.delete(`/requisitions/${id}`),
};

export const rfqsApi = {
  getAll: (params?: any) => api.get('/rfqs', { params }),
  getById: (id: string) => api.get(`/rfqs/${id}`),
  create: (data: any) => api.post('/rfqs', data),
  update: (id: string, data: any) => api.patch(`/rfqs/${id}`, data),
  close: (id: string) => api.patch(`/rfqs/${id}/close`),
  award: (id: string, data: any) => api.patch(`/rfqs/${id}/award`, data),
  submitQuotation: (id: string, data: any) => api.post(`/rfqs/${id}/quotations`, data),
  getPdfUrl: (id: string) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/rfqs/${id}/pdf`,
};

export const lposApi = {
  getAll: (params?: any) => api.get('/lpos', { params }),
  getById: (id: string) => api.get(`/lpos/${id}`),
  create: (data: any) => api.post('/lpos', data),
  update: (id: string, data: any) => api.patch(`/lpos/${id}`, data),
  approve: (id: string) => api.patch(`/lpos/${id}/approve`),
  issue: (id: string) => api.patch(`/lpos/${id}/issue`),
  getPdfUrl: (id: string) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/lpos/${id}/pdf`,
};

export const grnsApi = {
  getAll: (params?: any) => api.get('/grns', { params }),
  getById: (id: string) => api.get(`/grns/${id}`),
  create: (data: any) => api.post('/grns', data),
  update: (id: string, data: any) => api.patch(`/grns/${id}`, data),
  verify: (id: string, data: any) => api.patch(`/grns/${id}/verify`, data),
  updateItem: (id: string, itemId: string, data: any) => api.patch(`/grns/${id}/items/${itemId}`, data),
  getPdfUrl: (id: string) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/grns/${id}/pdf`,
};

export const inventoryApi = {
  getAll: (params?: any) => api.get('/inventory', { params }),
  getById: (id: string) => api.get(`/inventory/${id}`),
  create: (data: any) => api.post('/inventory', data),
  update: (id: string, data: any) => api.patch(`/inventory/${id}`, data),
  adjustStock: (id: string, data: any) => api.post(`/inventory/${id}/adjust`, data),
  units: () => api.get('/inventory/units'),
  delete: (id: string) => api.delete(`/inventory/${id}`),
};

export const assetsApi = {
  getAll: (params?: any) => api.get('/assets', { params }),
  getById: (id: string) => api.get(`/assets/${id}`),
  summary: () => api.get('/assets/summary'),
  options: () => api.get('/assets/options'),
  // numbering already used for an item type, and the next tag
  tagOptions: (params: { asset_class: string; category?: string }) => api.get('/assets/tag-options', { params }),
  create: (data: any) => api.post('/assets', data),
  update: (id: string, data: any) => api.patch(`/assets/${id}`, data),
  depreciate: (id: string) => api.post(`/assets/${id}/depreciate`),
  recordMaintenance: (id: string, data: any) => api.post(`/assets/${id}/maintenance`, data),
  dispose: (id: string, data: any) => api.patch(`/assets/${id}/dispose`, data),
  delete: (id: string) => api.delete(`/assets/${id}`),
  // locations
  types: (params?: any) => api.get('/assets/types', { params }),
  createType: (data: any) => api.post('/assets/types', data),
  updateType: (id: string, data: any) => api.patch(`/assets/types/${id}`, data),
  deleteType: (id: string) => api.delete(`/assets/types/${id}`),
  toTag: () => api.get('/assets/to-tag'),
  registerReceived: (itemId: string, data: any) => api.post(`/assets/to-tag/${itemId}`, data),
  locations: () => api.get('/assets/locations'),
  createLocation: (name: string) => api.post('/assets/locations', { name }),
  renameLocation: (id: string, name: string) => api.patch(`/assets/locations/${id}`, { name }),
  mergeLocation: (id: string, intoId: string) => api.post(`/assets/locations/${id}/merge`, { into_id: intoId }),
  deleteLocation: (id: string) => api.delete(`/assets/locations/${id}`),
  // import from the asset registers workbook; the preview checks it and creates nothing
  importPreview: (file: File, opts?: { update_existing?: boolean; fill_only?: boolean; groups?: string[] }) => {
    const fd = new FormData();
    fd.append('file', file);
    if (opts?.update_existing) { fd.append('update_existing', 'true'); fd.append('fill_only', String(opts.fill_only !== false)); if (opts.groups) fd.append('groups', opts.groups.join(',')); }
    return api.post('/assets/import/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  importWorkbook: (file: File, includeStock = true, opts?: { update_existing?: boolean; fill_only?: boolean; groups?: string[] }) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('include_stock', String(includeStock));
    if (opts?.update_existing) { fd.append('update_existing', 'true'); fd.append('fill_only', String(opts.fill_only !== false)); if (opts.groups) fd.append('groups', opts.groups.join(',')); }
    return api.post('/assets/import', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 10 * 60 * 1000 });
  },
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
  create: (data: FormData) => api.post('/resources', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: string) => api.delete(`/resources/${id}`),
};

// Gallery
export const galleryApi = {
  getAll: (params?: any) => api.get('/gallery', { params }),
  getById: (id: string) => api.get(`/gallery/${id}`),
  create: (data: FormData) => api.post('/gallery', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: FormData) => api.patch(`/gallery/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: string) => api.delete(`/gallery/${id}`),
  toggleFeatured: (id: string) => api.patch(`/gallery/${id}/toggle-featured`),
};

// News
export const newsApi = {
  getAll: (params?: any) => api.get('/news', { params }),
  getById: (id: string) => api.get(`/news/${id}`),
  create: (data: FormData) => api.post('/news', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: FormData) => api.put(`/news/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: string) => api.delete(`/news/${id}`),
};

// Fee Types
export const feeTypesApi = {
  getAll: (params?: any) => api.get('/fee-types', { params }),
  getById: (id: string) => api.get(`/fee-types/${id}`),
  create: (data: any) => api.post('/fee-types', data),
  update: (id: string, data: any) => api.patch(`/fee-types/${id}`, data),
  delete: (id: string) => api.delete(`/fee-types/${id}`),
};

// Terms
export const termsApi = {
  getAll: (params?: any) => api.get('/terms', { params }),
  getById: (id: string) => api.get(`/terms/${id}`),
  create: (data: any) => api.post('/terms', data),
  update: (id: string, data: any) => api.patch(`/terms/${id}`, data),
  delete: (id: string) => api.delete(`/terms/${id}`),
  enrollStudent: (termId: string, studentId: string) => api.post(`/terms/${termId}/enroll/${studentId}`),
  unenrollStudent: (termId: string, studentId: string) => api.delete(`/terms/${termId}/enroll/${studentId}`),
  // What changing the term fee would do to students already billed (nothing is saved)
  feeImpact: (id: string, termCost: number) => api.get(`/terms/${id}/fee-impact`, { params: { term_cost: termCost } }),
};

// Fee corrections (Admin / Finance)
export const feeCorrectionsApi = {
  getSummary: (studentId: string) => api.get(`/fees/students/${studentId}/summary`),
  getHistory: (studentId: string) => api.get(`/fees/students/${studentId}/history`),
  recordPayment: (studentId: string, termId: string, amount: number, notes?: string) =>
    api.post(`/fees/students/${studentId}/terms/${termId}/payment`, { amount, notes: notes || undefined }),
  editPayment: (id: string, data: any) => api.patch(`/fees/records/${id}`, data),
  voidPayment: (id: string, reason: string) => api.post(`/fees/records/${id}/void`, { reason }),
  setTermFee: (studentId: string, termId: string, totalFees: number | null, reason: string) =>
    api.patch(`/fees/students/${studentId}/terms/${termId}/fee`, { total_fees: totalFees, reason }),
  reassignTerm: (studentId: string, termId: string, toTermId: string, reason?: string) =>
    api.post(`/students/${studentId}/terms/${termId}/reassign`, { to_term_id: toTermId, reason }),
  removeTerm: (studentId: string, termId: string, reason?: string) =>
    api.delete(`/students/${studentId}/terms/${termId}`, { params: { reason } }),
  // apply=false only reports what would change
  reconcile: (data: { student_id?: string; term_id?: string; apply?: boolean }) => api.post('/fees/reconcile', data),
};

// Term Progression
export const termProgressionApi = {
  admitToTerm: (data: any) => api.post('/term-progression/admit', data),
  getProgression: (studentId: string) => api.get(`/term-progression/${studentId}`),
  getHistory: (studentId: string) => api.get(`/term-progression/${studentId}/history`),
  getBalances: (studentId: string) => api.get(`/term-progression/${studentId}/balances`),
  updateNotes: (id: string, data: any) => api.patch(`/term-progression/${id}/notes`, data),
  getAllPromotions: (params?: { level?: string; academic_year?: string; page?: number; limit?: number }) =>
    api.get('/term-progression/admin/all', { params }),
};

export const invoicesApi = {
  getAll: (params?: any) => api.get('/invoices', { params }),
  getById: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.patch(`/invoices/${id}`, data),
  recordPayment: (id: string, data: any) => api.patch(`/invoices/${id}/pay`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  getPdfUrl: (id: string) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/invoices/${id}/pdf`,
};
