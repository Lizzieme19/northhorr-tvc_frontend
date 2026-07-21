'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { studentsApi, applicationsApi, departmentsApi, coursesApi, resourcesApi, newsApi, feeTypesApi, termsApi } from '@/lib/services';
import ChangePassword from '@/components/ChangePassword';

interface Stats { total: number; active: number; graduated: number; pendingApps: number; approvedApps: number; }
interface Application { id: string; application_no: string; surname: string; other_names: string; email: string; status: string; type: string; created_at: string; course?: { name: string }; department?: { name: string }; [key: string]: any; }

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appTotal, setAppTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'overview' | 'applications' | 'students' | 'users' | 'courses' | 'resources' | 'news' | 'fee-types' | 'terms'>('overview');
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [intake, setIntake] = useState('SEPTEMBER');
  const [studentCredentials, setStudentCredentials] = useState<any>(null);
  const [appDocFiles, setAppDocFiles] = useState({
    doc_kcpe: null as File | null,
    doc_kcse: null as File | null,
    doc_id_copy: null as File | null,
    doc_birth_cert: null as File | null,
    doc_medical: null as File | null,
  });
  const [uploadingAppDocs, setUploadingAppDocs] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', category: 'Prospectus' });
  const [news, setNews] = useState<any[]>([]);
  const [newsForm, setNewsForm] = useState({ title: '', excerpt: '', content: '', category: 'News', is_featured: false, is_published: false });
  const [newsImage, setNewsImage] = useState<File | null>(null);
  const [uploadingNews, setUploadingNews] = useState(false);
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [feeTypeForm, setFeeTypeForm] = useState({ name: '', code: '', description: '', amount: '', is_required: false, is_disabled: false, applies_to: 'ALL', course_id: '', level: '', term_based: false });
  const [editingFeeType, setEditingFeeType] = useState<any>(null);
  const [savingFeeType, setSavingFeeType] = useState(false);
  const [terms, setTerms] = useState<any[]>([]);
  const [termForm, setTermForm] = useState({ name: '', start_date: '', end_date: '', academic_year: '', term_cost: '', is_active: true });
  const [editingTerm, setEditingTerm] = useState<any>(null);
  const [savingTerm, setSavingTerm] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    studentsApi.getStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'resources') {
      resourcesApi.getAll().then(r => setResources(r.data || [])).catch(() => setResources([]));
    }
    if (tab === 'news') {
      newsApi.getAll().then(r => setNews(r.data.news || [])).catch(() => setNews([]));
    }
    if (tab === 'fee-types') {
      feeTypesApi.getAll().then(r => setFeeTypes(r.data.fee_types || [])).catch(() => setFeeTypes([]));
    }
    if (tab === 'terms') {
      termsApi.getAll().then(r => setTerms(r.data.terms || [])).catch(() => setTerms([]));
    }
  }, [tab]);

  useEffect(() => {
    const params: any = { page, limit: 15 };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    applicationsApi.getAll(params).then(r => {
      setApplications(r.data.applications);
      setAppTotal(r.data.pagination.total);
    }).catch(() => {});
  }, [page, statusFilter, search, tab]);

  const handleStatus = async (id: string, status: string) => {
    setApproving(id);
    try {
      const response = await applicationsApi.updateStatus(id, { status, review_notes: reviewNotes, intake, year: new Date().getFullYear() });
      setSelectedApp(null);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      
      // Display student credentials if application was approved
      if (status === 'APPROVED' && response.data.student_credentials) {
        setStudentCredentials(response.data.student_credentials);
      }
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Error updating status');
    } finally { setApproving(null); }
  };

  const generateLetter = async (studentId: string) => {
    try {
      const r = await api.post(`/admissions/generate/${studentId}`);
      alert('Admission letter generated! URL: ' + r.data.letter_url);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to generate letter');
    }
  };

  const handleResourceUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceFile || !resourceForm.title || !resourceForm.category) {
      alert('Please fill in all required fields');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', resourceFile);
      formData.append('title', resourceForm.title);
      formData.append('description', resourceForm.description);
      formData.append('category', resourceForm.category);
      
      await api.post('/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Resource uploaded successfully!');
      setResourceFile(null);
      setResourceForm({ title: '', description: '', category: 'Prospectus' });
      resourcesApi.getAll().then(r => setResources(r.data || []));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to upload resource');
    } finally {
      setUploading(false);
    }
  };

  const handleResourceDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await resourcesApi.delete(id);
      setResources(prev => prev.filter(r => r.id !== id));
      alert('Resource deleted successfully');
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to delete resource');
    }
  };

  const handleNewsUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.excerpt || !newsForm.category) {
      alert('Please fill in all required fields');
      return;
    }
    setUploadingNews(true);
    try {
      const formData = new FormData();
      formData.append('title', newsForm.title);
      formData.append('excerpt', newsForm.excerpt);
      formData.append('content', newsForm.content);
      formData.append('category', newsForm.category);
      formData.append('is_featured', newsForm.is_featured.toString());
      formData.append('is_published', newsForm.is_published.toString());
      if (newsImage) {
        formData.append('image', newsImage);
      }
      
      await newsApi.create(formData);
      
      alert('News created successfully!');
      setNewsForm({ title: '', excerpt: '', content: '', category: 'News', is_featured: false, is_published: false });
      setNewsImage(null);
      newsApi.getAll().then(r => setNews(r.data.news || []));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to create news');
    } finally {
      setUploadingNews(false);
    }
  };

  const handleNewsDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news item?')) return;
    try {
      await newsApi.delete(id);
      setNews(prev => prev.filter(n => n.id !== id));
      alert('News deleted successfully');
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to delete news');
    }
  };

  const handleAppDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setUploadingAppDocs(true);
    try {
      const formData = new FormData();
      Object.entries(appDocFiles).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });
      
      await api.patch(`/applications/${selectedApp.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Documents uploaded successfully!');
      setAppDocFiles({
        doc_kcpe: null,
        doc_kcse: null,
        doc_id_copy: null,
        doc_birth_cert: null,
        doc_medical: null,
      });
      
      const updated = await applicationsApi.getAll({ page, limit: 15, search, status: statusFilter });
      setApplications(updated.data.applications);
      setSelectedApp(updated.data.applications.find((a: Application) => a.id === selectedApp.id) || null);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to upload documents');
    } finally {
      setUploadingAppDocs(false);
    }
  };

  const handleFeeTypeSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFeeType(true);
    try {
      const data = {
        ...feeTypeForm,
        amount: parseFloat(feeTypeForm.amount) || 0,
        course_id: feeTypeForm.course_id || null,
      };
      if (editingFeeType) {
        await feeTypesApi.update(editingFeeType.id, data);
        setFeeTypes(prev => prev.map(ft => ft.id === editingFeeType.id ? { ...ft, ...data } : ft));
        alert('Fee type updated successfully');
      } else {
        const response = await feeTypesApi.create(data);
        setFeeTypes(prev => [...prev, response.data.fee_type]);
        alert('Fee type created successfully');
      }
      setFeeTypeForm({ name: '', code: '', description: '', amount: '', is_required: false, is_disabled: false, applies_to: 'ALL', course_id: '', level: '', term_based: false });
      setEditingFeeType(null);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to save fee type');
    } finally {
      setSavingFeeType(false);
    }
  };

  const handleFeeTypeEdit = (ft: any) => {
    setEditingFeeType(ft);
    setFeeTypeForm({
      name: ft.name,
      code: ft.code,
      description: ft.description || '',
      amount: ft.amount.toString(),
      is_required: ft.is_required,
      is_disabled: ft.is_disabled || false,
      applies_to: ft.applies_to,
      course_id: ft.course_id || '',
      level: ft.level || '',
      term_based: ft.term_based,
    });
  };

  const handleFeeTypeDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee type?')) return;
    try {
      await feeTypesApi.delete(id);
      setFeeTypes(prev => prev.filter(ft => ft.id !== id));
      alert('Fee type deleted successfully');
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to delete fee type');
    }
  };

  const handleTermSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTerm(true);
    try {
      const data = {
        ...termForm,
        start_date: new Date(termForm.start_date).toISOString(),
        end_date: new Date(termForm.end_date).toISOString(),
        term_cost: parseFloat(termForm.term_cost) || 0,
      };
      if (editingTerm) {
        await termsApi.update(editingTerm.id, data);
        setTerms(prev => prev.map(t => t.id === editingTerm.id ? { ...t, ...data } : t));
        alert('Term updated successfully');
      } else {
        const response = await termsApi.create(data);
        setTerms(prev => [...prev, response.data.term]);
        alert('Term created successfully');
      }
      setTermForm({ name: '', start_date: '', end_date: '', academic_year: '', term_cost: '', is_active: true });
      setEditingTerm(null);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to save term');
    } finally {
      setSavingTerm(false);
    }
  };

  const handleTermEdit = (t: any) => {
    setEditingTerm(t);
    setTermForm({
      name: t.name,
      start_date: t.start_date.split('T')[0],
      end_date: t.end_date.split('T')[0],
      academic_year: t.academic_year,
      term_cost: t.term_cost?.toString() || '',
      is_active: t.is_active,
    });
  };

  const handleTermDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this term?')) return;
    try {
      await termsApi.delete(id);
      setTerms(prev => prev.filter(t => t.id !== id));
      alert('Term deleted successfully');
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to delete term');
    }
  };

  const handleTermToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/terms/${id}`, { is_active: !currentStatus });
      setTerms(prev => prev.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t));
      alert(`Term ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to update term status');
    }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-cream-deep">
      {/* Top bar */}
      <header className="bg-brand-dark text-cream px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gold grid place-items-center font-display font-bold text-brand-dark text-sm">NT</div>
          <span className="font-display font-semibold hidden sm:block">North Horr TVC Admin Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-cream/70 text-sm hidden md:block">{user.email}</span>
          <span className="px-2 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold">ADMIN</span>
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="text-sm text-cream/60 hover:text-cream transition">Change Password</button>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm text-cream/60 hover:text-cream transition">Logout</button>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="bg-white border-b border-stone/15 px-6 flex gap-1 overflow-x-auto">
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'applications', label: '📋 Applications' },
          { key: 'students', label: '🎓 Students' },
          { key: 'users', label: '👥 Users' },
          { key: 'courses', label: '📚 Dept & Courses' },
          { key: 'resources', label: '📁 Resources' },
          { key: 'news', label: '📰 News' },
          { key: 'fee-types', label: '💰 Fee Types' },
          { key: 'terms', label: '📅 Terms' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-5 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.key ? 'border-brand text-brand' : 'border-transparent text-stone hover:text-brand-dark'}`}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showPasswordChange && (
          <div className="bg-white rounded-2xl p-6 mb-6 border border-stone/10 shadow-sm">
            <h2 className="font-display text-xl text-brand-dark mb-4">Change Password</h2>
            <ChangePassword />
            <button onClick={() => setShowPasswordChange(false)} className="mt-4 text-sm text-stone hover:text-brand transition">Cancel</button>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            <h1 className="font-display text-2xl text-brand-dark mb-6">Dashboard Overview</h1>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {[
                { label: 'Total Students', value: stats?.total ?? '—', icon: '🎓', color: 'bg-brand' },
                { label: 'Active Students', value: stats?.active ?? '—', icon: '✅', color: 'bg-green-600' },
                { label: 'Pending Applications', value: stats?.pendingApps ?? '—', icon: '⏳', color: 'bg-yellow-500' },
                { label: 'Approved Applications', value: stats?.approvedApps ?? '—', icon: '📝', color: 'bg-terracotta' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
                  <div className={`h-11 w-11 rounded-xl ${card.color} grid place-items-center text-xl mb-4`}>{card.icon}</div>
                  <div className="font-display text-3xl font-bold text-brand-dark">{card.value}</div>
                  <div className="text-sm text-stone mt-1">{card.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <h2 className="font-display text-lg text-brand-dark mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <button onClick={() => setTab('applications')} className="p-4 rounded-xl border-2 border-dashed border-brand/30 hover:border-brand hover:bg-brand/5 transition text-left">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-semibold text-brand-dark">Review Applications</div>
                  <div className="text-xs text-stone mt-1">{stats?.pendingApps || 0} pending</div>
                </button>
                <button onClick={() => setTab('users')} className="p-4 rounded-xl border-2 border-dashed border-purple/30 hover:border-purple hover:bg-purple/5 transition text-left">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-semibold text-brand-dark">Manage Users</div>
                  <div className="text-xs text-stone mt-1">View all system users</div>
                </button>
                <button onClick={() => setTab('students')} className="p-4 rounded-xl border-2 border-dashed border-terracotta/30 hover:border-terracotta hover:bg-terracotta/5 transition text-left">
                  <div className="text-2xl mb-2">🎓</div>
                  <div className="font-semibold text-brand-dark">View All Students</div>
                  <div className="text-xs text-stone mt-1">{stats?.total || 0} enrolled</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── APPLICATIONS ── */}
        {tab === 'applications' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className="font-display text-2xl text-brand-dark">Applications ({appTotal})</h1>
              <div className="flex gap-2">
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search name, email, ref…"
                  className="px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand w-48" />
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand">
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Ref No.</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Course</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone/10">
                    {applications.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-stone">No applications found</td></tr>
                    )}
                    {applications.map(app => (
                      <tr key={app.id} className="hover:bg-cream-deep/50 transition">
                        <td className="px-4 py-3 font-mono text-xs text-brand">{app.application_no}</td>
                        <td className="px-4 py-3 font-medium text-brand-dark">{app.surname} {app.other_names}</td>
                        <td className="px-4 py-3 text-stone">{app.course?.name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${app.type === 'KUCCPS' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{app.type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] || ''}`}>{app.status}</span>
                        </td>
                        <td className="px-4 py-3 text-stone text-xs">{new Date(app.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelectedApp(app)} className="text-brand hover:text-brand-dark font-medium text-xs transition">Review</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="px-4 py-3 border-t border-stone/10 flex items-center justify-between text-sm text-stone">
                <span>Page {page} of {Math.ceil(appTotal / 15)}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">← Prev</button>
                  <button disabled={page >= Math.ceil(appTotal / 15)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">Next →</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STUDENTS ── */}
        {tab === 'students' && <StudentsTab generateLetter={generateLetter} />}

        {/* ── USERS ── */}
        {tab === 'users' && <UsersTab />}

        {/* ── COURSES & DEPTS ── */}
        {tab === 'courses' && <CoursesTab />}

        {/* ── RESOURCES ── */}
        {tab === 'resources' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Resource */}
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <h2 className="font-display text-lg text-brand-dark mb-5">Upload Resource</h2>
              <form onSubmit={handleResourceUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Title *</label>
                  <input
                    type="text"
                    required
                    value={resourceForm.title}
                    onChange={e => setResourceForm({...resourceForm, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Category *</label>
                  <select
                    required
                    value={resourceForm.category}
                    onChange={e => setResourceForm({...resourceForm, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                  >
                    <option value="Prospectus">Prospectus</option>
                    <option value="Forms">Forms</option>
                    <option value="Timetables">Timetables</option>
                    <option value="Policies">Policies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Description</label>
                  <textarea
                    value={resourceForm.description}
                    onChange={e => setResourceForm({...resourceForm, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">File *</label>
                  <label className="block w-full border-2 border-dashed border-brand/30 rounded-xl p-6 text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition">
                    <input type="file" className="hidden" onChange={e => setResourceFile(e.target.files?.[0] || null)} />
                    <div className="text-3xl mb-2">📁</div>
                    <div className="text-sm font-medium text-brand-dark">{resourceFile ? resourceFile.name : 'Click to upload file'}</div>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={!resourceFile || uploading}
                  className="w-full px-4 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : 'Upload Resource'}
                </button>
              </form>
            </div>

            {/* Resources List */}
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <h2 className="font-display text-lg text-brand-dark mb-5">Uploaded Resources</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {resources.length === 0 ? (
                  <p className="text-stone text-center py-8">No resources uploaded yet</p>
                ) : (
                  resources.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-cream-deep/50 rounded-xl border border-stone/10">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-brand-dark truncate">{r.title}</div>
                        <div className="text-sm text-stone">{r.category} • {r.file_type} • {r.file_size}</div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <a
                          href={r.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleResourceDelete(r.id)}
                          className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── FEE TYPES ── */}
        {tab === 'fee-types' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Create/Edit Fee Type */}
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <h2 className="font-display text-lg text-brand-dark mb-5">{editingFeeType ? 'Edit Fee Type' : 'Create Fee Type'}</h2>
              <form onSubmit={handleFeeTypeSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Name *</label>
                  <input
                    type="text"
                    required
                    value={feeTypeForm.name}
                    onChange={e => setFeeTypeForm({...feeTypeForm, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    placeholder="e.g. Tuition Fee"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Code *</label>
                  <input
                    type="text"
                    required
                    value={feeTypeForm.code}
                    onChange={e => setFeeTypeForm({...feeTypeForm, code: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm font-mono"
                    placeholder="e.g. TUITION"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Description</label>
                  <textarea
                    value={feeTypeForm.description}
                    onChange={e => setFeeTypeForm({...feeTypeForm, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    rows={2}
                    placeholder="Optional description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Amount *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={feeTypeForm.amount}
                    onChange={e => setFeeTypeForm({...feeTypeForm, amount: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    placeholder="e.g. 15000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Applies To *</label>
                  <select
                    required
                    value={feeTypeForm.applies_to}
                    onChange={e => setFeeTypeForm({...feeTypeForm, applies_to: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                  >
                    <option value="ALL">All Students</option>
                    <option value="SPECIFIC_COURSE">Specific Course</option>
                    <option value="SPECIFIC_LEVEL">Specific Level</option>
                  </select>
                </div>
                {feeTypeForm.applies_to === 'SPECIFIC_COURSE' && (
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Course</label>
                    <select
                      value={feeTypeForm.course_id}
                      onChange={e => setFeeTypeForm({...feeTypeForm, course_id: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    >
                      <option value="">Select course...</option>
                      {/* Will populate with courses */}
                    </select>
                  </div>
                )}
                {feeTypeForm.applies_to === 'SPECIFIC_LEVEL' && (
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Level</label>
                    <select
                      value={feeTypeForm.level}
                      onChange={e => setFeeTypeForm({...feeTypeForm, level: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    >
                      <option value="">Select level...</option>
                      <option value="Certificate">Certificate</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Artisan">Artisan</option>
                    </select>
                  </div>
                )}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feeTypeForm.is_required}
                      onChange={e => setFeeTypeForm({...feeTypeForm, is_required: e.target.checked})}
                      className="w-4 h-4 rounded border-stone/25"
                    />
                    <span className="text-sm text-brand-dark">Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feeTypeForm.term_based}
                      onChange={e => setFeeTypeForm({...feeTypeForm, term_based: e.target.checked})}
                      className="w-4 h-4 rounded border-stone/25"
                    />
                    <span className="text-sm text-brand-dark">Term-based</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feeTypeForm.is_disabled}
                      onChange={e => setFeeTypeForm({...feeTypeForm, is_disabled: e.target.checked})}
                      className="w-4 h-4 rounded border-stone/25"
                    />
                    <span className="text-sm text-brand-dark">Disabled</span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={savingFeeType}
                  className="w-full px-4 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
                >
                  {savingFeeType ? 'Saving…' : (editingFeeType ? 'Update Fee Type' : 'Create Fee Type')}
                </button>
                {editingFeeType && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFeeType(null);
                      setFeeTypeForm({ name: '', code: '', description: '', amount: '', is_required: false, is_disabled: false, applies_to: 'ALL', course_id: '', level: '', term_based: false });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition"
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>

            {/* Fee Types List */}
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <h2 className="font-display text-lg text-brand-dark mb-5">Fee Types ({feeTypes.length})</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {feeTypes.length === 0 ? (
                  <p className="text-stone text-center py-8">No fee types configured yet</p>
                ) : (
                  feeTypes.map(ft => (
                    <div key={ft.id} className={`flex items-center justify-between p-4 rounded-xl border ${ft.is_active ? 'bg-cream-deep/50 border-stone/10' : 'bg-stone/50 border-stone/20 opacity-60'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-brand-dark truncate">{ft.name}</div>
                        <div className="text-sm text-stone">{ft.code} • KES {ft.amount} • {ft.applies_to} {ft.term_based && '• Term-based'}</div>
                        <div className="text-xs text-stone mt-1">{ft.is_required ? 'Required' : 'Optional'} • {ft.is_active ? 'Active' : 'Disabled'}</div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleFeeTypeEdit(ft)}
                          className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleFeeTypeDelete(ft.id)}
                          className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TERMS ── */}
        {tab === 'terms' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Create/Edit Term */}
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <h2 className="font-display text-lg text-brand-dark mb-5">{editingTerm ? 'Edit Term' : 'Create Term'}</h2>
              <form onSubmit={handleTermSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Term Name *</label>
                  <input
                    type="text"
                    required
                    value={termForm.name}
                    onChange={e => setTermForm({...termForm, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    placeholder="e.g. Term 1 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={termForm.academic_year}
                    onChange={e => setTermForm({...termForm, academic_year: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    placeholder="e.g. 2024/2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Term Cost</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={termForm.term_cost}
                    onChange={e => setTermForm({...termForm, term_cost: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    placeholder="e.g. 45000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={termForm.start_date}
                      onChange={e => setTermForm({...termForm, start_date: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">End Date *</label>
                    <input
                      type="date"
                      required
                      value={termForm.end_date}
                      onChange={e => setTermForm({...termForm, end_date: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termForm.is_active}
                      onChange={e => setTermForm({...termForm, is_active: e.target.checked})}
                      className="w-4 h-4 rounded border-stone/25"
                    />
                    <span className="text-sm text-brand-dark">Active Term</span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={savingTerm}
                  className="w-full px-4 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
                >
                  {savingTerm ? 'Saving…' : (editingTerm ? 'Update Term' : 'Create Term')}
                </button>
                {editingTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTerm(null);
                      setTermForm({ name: '', start_date: '', end_date: '', academic_year: '', term_cost: '', is_active: true });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition"
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>

            {/* Terms List */}
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <h2 className="font-display text-lg text-brand-dark mb-5">Academic Terms ({terms.length})</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {terms.length === 0 ? (
                  <p className="text-stone text-center py-8">No terms configured yet</p>
                ) : (
                  terms.map(t => (
                    <div key={t.id} className={`flex items-center justify-between p-4 rounded-xl border ${t.is_active ? 'bg-cream-deep/50 border-stone/10' : 'bg-stone/50 border-stone/20 opacity-60'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-brand-dark truncate">{t.name}</div>
                        <div className="text-sm text-stone">{t.academic_year} • {new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}</div>
                        <div className="text-xs text-stone mt-1">
                          {t._count?.students || 0} students • {t._count?.student_balances || 0} balances
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleTermToggleActive(t.id, t.is_active)}
                          className={`px-3 py-1 rounded-lg text-sm transition ${t.is_active ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                        >
                          {t.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleTermEdit(t)}
                          className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTermDelete(t.id)}
                          className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── NEWS ── */}
        {tab === 'news' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Create News */}
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <h2 className="font-display text-lg text-brand-dark mb-5">Create News</h2>
              <form onSubmit={handleNewsUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Title *</label>
                  <input
                    type="text"
                    required
                    value={newsForm.title}
                    onChange={e => setNewsForm({...newsForm, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Excerpt *</label>
                  <textarea
                    required
                    value={newsForm.excerpt}
                    onChange={e => setNewsForm({...newsForm, excerpt: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Content</label>
                  <textarea
                    value={newsForm.content}
                    onChange={e => setNewsForm({...newsForm, content: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Category *</label>
                  <select
                    required
                    value={newsForm.category}
                    onChange={e => setNewsForm({...newsForm, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                  >
                    <option value="News">News</option>
                    <option value="Event">Event</option>
                    <option value="Announcement">Announcement</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newsForm.is_featured}
                      onChange={e => setNewsForm({...newsForm, is_featured: e.target.checked})}
                      className="w-4 h-4 rounded border-stone/25"
                    />
                    <span className="text-sm text-brand-dark">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newsForm.is_published}
                      onChange={e => setNewsForm({...newsForm, is_published: e.target.checked})}
                      className="w-4 h-4 rounded border-stone/25"
                    />
                    <span className="text-sm text-brand-dark">Published</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Image</label>
                  <label className="block w-full border-2 border-dashed border-brand/30 rounded-xl p-6 text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition">
                    <input type="file" accept="image/*" className="hidden" onChange={e => setNewsImage(e.target.files?.[0] || null)} />
                    <div className="text-3xl mb-2">🖼️</div>
                    <div className="text-sm font-medium text-brand-dark">{newsImage ? newsImage.name : 'Click to upload image'}</div>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={uploadingNews}
                  className="w-full px-4 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
                >
                  {uploadingNews ? 'Creating…' : 'Create News'}
                </button>
              </form>
            </div>

            {/* News List */}
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <h2 className="font-display text-lg text-brand-dark mb-5">News Items</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {news.length === 0 ? (
                  <p className="text-stone text-center py-8">No news items yet</p>
                ) : (
                  news.map(n => (
                    <div key={n.id} className="flex items-center justify-between p-4 bg-cream-deep/50 rounded-xl border border-stone/10">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-brand-dark truncate">{n.title}</div>
                        <div className="text-sm text-stone">{n.category} • {n.is_published ? 'Published' : 'Draft'} {n.is_featured && '• Featured'}</div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {n.image_url && (
                          <a
                            href={n.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition"
                          >
                            View Image
                          </a>
                        )}
                        <button
                          onClick={() => handleNewsDelete(n.id)}
                          className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Student Credentials Modal */}
      {studentCredentials && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="font-display text-xl text-brand-dark mb-4">Student Account Created</h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="text-green-800 font-semibold mb-2">✅ Application Approved</div>
              <p className="text-green-700 text-sm">Student account has been created successfully.</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-stone/10 pb-2">
                <span className="text-stone">Email:</span>
                <span className="font-medium text-brand-dark">{studentCredentials.email}</span>
              </div>
              <div className="flex justify-between border-b border-stone/10 pb-2">
                <span className="text-stone">Admission No:</span>
                <span className="font-medium text-brand-dark">{studentCredentials.admission_no}</span>
              </div>
              <div className="flex justify-between border-b border-stone/10 pb-2">
                <span className="text-stone">Temporary Password:</span>
                <span className="font-mono font-bold text-brand">{studentCredentials.temporary_password}</span>
              </div>
            </div>
            <p className="text-xs text-stone mt-4 italic">{studentCredentials.note}</p>
            <button onClick={() => setStudentCredentials(null)} className="mt-6 w-full py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <h2 className="font-display text-xl text-brand-dark mb-1">Review Application</h2>
            <p className="text-sm text-stone mb-4">{selectedApp.application_no} — {selectedApp.surname} {selectedApp.other_names}</p>
            
            <div className="flex-1 overflow-y-auto mb-5 pr-2 space-y-4 text-sm bg-stone/5 p-4 rounded-xl">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="text-stone">Course:</div><div className="font-medium text-brand-dark">{selectedApp.course?.name || '—'}</div>
                <div className="text-stone">Type:</div><div className="font-medium text-brand-dark">{selectedApp.type}</div>
                <div className="text-stone">Gender:</div><div className="font-medium text-brand-dark">{selectedApp.gender || '—'}</div>
                <div className="text-stone">DOB:</div><div className="font-medium text-brand-dark">{selectedApp.date_of_birth ? new Date(selectedApp.date_of_birth).toLocaleDateString() : '—'}</div>
                <div className="text-stone">Email:</div><div className="font-medium text-brand-dark">{selectedApp.email || '—'}</div>
                <div className="text-stone">Phone:</div><div className="font-medium text-brand-dark">{selectedApp.phone || '—'}</div>
                <div className="text-stone">Address:</div><div className="font-medium text-brand-dark">{selectedApp.address || '—'}</div>
                
                <div className="col-span-2 mt-3 font-semibold text-brand-dark border-b border-stone/10 pb-1">Academic Info</div>
                <div className="text-stone">Previous School:</div><div className="font-medium text-brand-dark">{selectedApp.previous_school || '—'}</div>
                <div className="text-stone">KCPE Index / Marks:</div><div className="font-medium text-brand-dark">{selectedApp.kcpe_index || '—'} / {selectedApp.kcpe_marks || '—'}</div>
                <div className="text-stone">KCSE Index / Grade:</div><div className="font-medium text-brand-dark">{selectedApp.kcse_index || '—'} / {selectedApp.kcse_grade || '—'}</div>
                
                <div className="col-span-2 mt-3 font-semibold text-brand-dark border-b border-stone/10 pb-1">Parent & Emergency Info</div>
                <div className="text-stone">Parent Name:</div><div className="font-medium text-brand-dark">{selectedApp.parent_names || '—'} ({selectedApp.parent_relationship || '—'})</div>
                <div className="text-stone">Parent Phone:</div><div className="font-medium text-brand-dark">{selectedApp.parent_phone || '—'}</div>
                <div className="text-stone">Emergency Contact:</div><div className="font-medium text-brand-dark">{selectedApp.emergency_person || '—'}</div>
                <div className="text-stone">Emergency Phone:</div><div className="font-medium text-brand-dark">{selectedApp.emergency_phone || '—'}</div>
                <div className="text-stone">Medical/Disability:</div><div className="font-medium text-brand-dark">{selectedApp.medical_conditions || selectedApp.disability || 'None'}</div>
                
                <div className="col-span-2 mt-3 font-semibold text-brand-dark border-b border-stone/10 pb-1">Uploaded Documents</div>
                <div className="col-span-2 flex flex-wrap gap-2">
                  {selectedApp.doc_kcpe && <a href={selectedApp.doc_kcpe} target="_blank" className="px-3 py-1 bg-white border border-stone/20 rounded-full text-xs hover:bg-brand/10 hover:text-brand transition">📄 KCPE</a>}
                  {selectedApp.doc_kcse && <a href={selectedApp.doc_kcse} target="_blank" className="px-3 py-1 bg-white border border-stone/20 rounded-full text-xs hover:bg-brand/10 hover:text-brand transition">📄 KCSE</a>}
                  {selectedApp.doc_id_copy && <a href={selectedApp.doc_id_copy} target="_blank" className="px-3 py-1 bg-white border border-stone/20 rounded-full text-xs hover:bg-brand/10 hover:text-brand transition">📄 ID</a>}
                  {selectedApp.doc_birth_cert && <a href={selectedApp.doc_birth_cert} target="_blank" className="px-3 py-1 bg-white border border-stone/20 rounded-full text-xs hover:bg-brand/10 hover:text-brand transition">📄 Birth Cert</a>}
                  {selectedApp.doc_medical && <a href={selectedApp.doc_medical} target="_blank" className="px-3 py-1 bg-white border border-stone/20 rounded-full text-xs hover:bg-brand/10 hover:text-brand transition">📄 Medical</a>}
                  {!selectedApp.doc_kcpe && !selectedApp.doc_kcse && !selectedApp.doc_id_copy && !selectedApp.doc_birth_cert && !selectedApp.doc_medical && <span className="text-stone text-xs italic">No documents uploaded.</span>}
                </div>

                <div className="col-span-2 mt-3 font-semibold text-brand-dark border-b border-stone/10 pb-1">Upload Additional Documents</div>
                <div className="col-span-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input type="file" accept=".pdf,image/*" onChange={e => setAppDocFiles({...appDocFiles, doc_kcpe: e.target.files?.[0] || null})} className="hidden" />
                      <span className="px-2 py-1 bg-brand/10 text-brand rounded cursor-pointer hover:bg-brand/20">📄 KCPE</span>
                      {appDocFiles.doc_kcpe && <span className="text-xs text-green-600">✓</span>}
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="file" accept=".pdf,image/*" onChange={e => setAppDocFiles({...appDocFiles, doc_kcse: e.target.files?.[0] || null})} className="hidden" />
                      <span className="px-2 py-1 bg-brand/10 text-brand rounded cursor-pointer hover:bg-brand/20">📄 KCSE</span>
                      {appDocFiles.doc_kcse && <span className="text-xs text-green-600">✓</span>}
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="file" accept=".pdf,image/*" onChange={e => setAppDocFiles({...appDocFiles, doc_id_copy: e.target.files?.[0] || null})} className="hidden" />
                      <span className="px-2 py-1 bg-brand/10 text-brand rounded cursor-pointer hover:bg-brand/20">📄 ID Copy</span>
                      {appDocFiles.doc_id_copy && <span className="text-xs text-green-600">✓</span>}
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="file" accept=".pdf,image/*" onChange={e => setAppDocFiles({...appDocFiles, doc_birth_cert: e.target.files?.[0] || null})} className="hidden" />
                      <span className="px-2 py-1 bg-brand/10 text-brand rounded cursor-pointer hover:bg-brand/20">📄 Birth Cert</span>
                      {appDocFiles.doc_birth_cert && <span className="text-xs text-green-600">✓</span>}
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="file" accept=".pdf,image/*" onChange={e => setAppDocFiles({...appDocFiles, doc_medical: e.target.files?.[0] || null})} className="hidden" />
                      <span className="px-2 py-1 bg-brand/10 text-brand rounded cursor-pointer hover:bg-brand/20">📄 Medical</span>
                      {appDocFiles.doc_medical && <span className="text-xs text-green-600">✓</span>}
                    </label>
                  </div>
                  <button onClick={handleAppDocUpload} disabled={uploadingAppDocs || Object.values(appDocFiles).every(f => !f)}
                    className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                    {uploadingAppDocs ? 'Uploading…' : 'Upload Documents'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-stone/10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">Intake (if approving)</label>
                  <select value={intake} onChange={e => setIntake(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm">
                    <option value="SEPTEMBER">September</option>
                    <option value="JANUARY">January</option>
                    <option value="MAY">May</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">Review Notes</label>
                  <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                    rows={1} placeholder="Optional notes…"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm resize-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleStatus(selectedApp.id, 'APPROVED')} disabled={!!approving}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50">
                  {approving === selectedApp.id ? '…' : '✅ Approve'}
                </button>
                <button onClick={() => handleStatus(selectedApp.id, 'UNDER_REVIEW')} disabled={!!approving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  🔍 Under Review
                </button>
                <button onClick={() => handleStatus(selectedApp.id, 'REJECTED')} disabled={!!approving}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50">
                  ❌ Reject
                </button>
              </div>
              <button onClick={() => setSelectedApp(null)} className="w-full py-2 text-sm text-stone hover:text-brand-dark transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentsTab({ generateLetter }: { generateLetter: (id: string) => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [docFiles, setDocFiles] = useState({
    id_copy_front: null as File | null,
    id_copy_back: null as File | null,
    parent_id_copy_front: null as File | null,
    parent_id_copy_back: null as File | null,
    medical_report: null as File | null,
    kcse_certificate: null as File | null,
    birth_certificate: null as File | null,
    other_documents: null as File | null,
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeSummary, setFeeSummary] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [progressionForm, setProgressionForm] = useState({ toLevel: '', termId: '', notes: '', forcePromote: false });
  const [promoting, setPromoting] = useState(false);
  const [terms, setTerms] = useState<any[]>([]);

  useEffect(() => {
    studentsApi.getAll({ page, limit: 15, search })
      .then(r => { setStudents(r.data.students); setTotal(r.data.pagination.total); })
      .catch(() => {});
  }, [page, search]);

  useEffect(() => {
    api.get('/terms').then(r => setTerms(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const handleKuccpsImport = async () => {
    if (!csvFile) return;
    setImporting(true);
    try {
      const r = await applicationsApi.importKuccps(csvFile);
      setImportResult(r.data);
      const updated = await studentsApi.getAll({ page, limit: 15, search });
      setStudents(updated.data.students);
      setTotal(updated.data.pagination.total);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Import failed');
    } finally { setImporting(false); }
  };

  const handleViewFeeSummary = async (studentId: string) => {
    try {
      const r = await api.get(`/fees/students/${studentId}/summary`);
      setFeeSummary(r.data);
      setShowFeeModal(true);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to fetch fee summary');
    }
  };

  const handleRecordPayment = async (studentId: string, termId: string) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    setRecordingPayment(true);
    try {
      await api.post(`/fees/students/${studentId}/terms/${termId}/payment`, {
        amount: parseFloat(paymentAmount),
        notes: paymentNotes,
      });
      alert('Payment recorded successfully');
      setPaymentAmount('');
      setPaymentNotes('');
      handleViewFeeSummary(studentId);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  const handlePromoteStudent = async (studentId: string) => {
    if (!progressionForm.toLevel || !progressionForm.termId) {
      alert('Please select level and term');
      return;
    }
    setPromoting(true);
    try {
      await api.post(`/fees/students/${studentId}/promote`, progressionForm);
      alert('Student promoted successfully');
      setShowProgressionModal(false);
      setProgressionForm({ toLevel: '', termId: '', notes: '', forcePromote: false });
      const updated = await studentsApi.getAll({ page, limit: 15, search });
      setStudents(updated.data.students);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to promote student');
    } finally {
      setPromoting(false);
    }
  };

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setEditForm({
      phone: student.application?.phone || '',
      address: student.application?.address || '',
      id_number: student.application?.id_number || '',
      emergency_person: student.application?.emergency_person || '',
      emergency_phone: student.application?.emergency_phone || '',
      father_present: student.application?.father_present !== false,
      father_name: student.application?.father_name || '',
      father_phone: student.application?.father_phone || '',
      father_email: student.application?.father_email || '',
      father_occupation: student.application?.father_occupation || '',
      mother_present: student.application?.mother_present !== false,
      mother_name: student.application?.mother_name || '',
      mother_phone: student.application?.mother_phone || '',
      mother_email: student.application?.mother_email || '',
      mother_occupation: student.application?.mother_occupation || '',
      level: student.level || '',
      intake: student.intake || '',
      year: student.year || '',
      status: student.status || '',
      course_id: student.course_id || '',
      department_id: student.department_id || '',
    });
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      // Upload profile photo if selected
      if (profilePhoto) {
        const photoFormData = new FormData();
        photoFormData.append('photo', profilePhoto);
        await api.post(`/students/${selectedStudent.id}/photo`, photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Update the student profile data
      await studentsApi.update(selectedStudent.id, editForm);
      
      // Upload documents if any files are selected
      const formData = new FormData();
      if (docFiles.id_copy_front) formData.append('id_copy_front', docFiles.id_copy_front);
      if (docFiles.id_copy_back) formData.append('id_copy_back', docFiles.id_copy_back);
      if (docFiles.parent_id_copy_front) formData.append('parent_id_copy_front', docFiles.parent_id_copy_front);
      if (docFiles.parent_id_copy_back) formData.append('parent_id_copy_back', docFiles.parent_id_copy_back);
      if (docFiles.medical_report) formData.append('medical_report', docFiles.medical_report);
      if (docFiles.kcse_certificate) formData.append('kcse_certificate', docFiles.kcse_certificate);
      if (docFiles.birth_certificate) formData.append('birth_certificate', docFiles.birth_certificate);
      if (docFiles.other_documents) formData.append('other_documents', docFiles.other_documents);
      
      if (formData.has('id_copy_front') || formData.has('id_copy_back') || 
          formData.has('parent_id_copy_front') || formData.has('parent_id_copy_back') ||
          formData.has('medical_report') || formData.has('kcse_certificate') ||
          formData.has('birth_certificate') || formData.has('other_documents')) {
        setUploadingDocs(true);
        await api.post(`/students/${selectedStudent.id}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      const updated = await studentsApi.getAll({ page, limit: 15, search });
      setStudents(updated.data.students);
      setSelectedStudent(null);
      setProfilePhoto(null);
      setDocFiles({ 
        id_copy_front: null, 
        id_copy_back: null, 
        parent_id_copy_front: null, 
        parent_id_copy_back: null,
        medical_report: null,
        kcse_certificate: null,
        birth_certificate: null,
        other_documents: null
      });
      alert('Student profile updated successfully');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update student profile');
    } finally {
      setUpdating(false);
      setUploadingDocs(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl text-brand-dark">Students ({total})</h1>
        <div className="flex gap-3">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search admission no, name…"
            className="px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand w-56" />
        </div>
      </div>

      {/* KUCCPS Import */}
      <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm mb-6">
        <h2 className="font-display text-lg text-brand-dark mb-2">KUCCPS CSV Import</h2>
        <p className="text-sm text-stone mb-4">Upload a CSV with columns: surname, other_names, gender, dob, email, phone, kcse_index, kcse_grade</p>
        <label className="block w-full border-2 border-dashed border-brand/30 rounded-xl p-6 text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition">
          <input type="file" accept=".csv" className="hidden" onChange={e => setCsvFile(e.target.files?.[0] || null)} />
          <div className="text-3xl mb-2">📄</div>
          <div className="text-sm font-medium text-brand-dark">{csvFile ? csvFile.name : 'Click to upload CSV'}</div>
        </label>
        <button onClick={handleKuccpsImport} disabled={!csvFile || importing}
          className="mt-4 w-full px-4 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
          {importing ? 'Importing…' : 'Import KUCCPS Students'}
        </button>
        {importResult && (
          <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-sm">
            <div className="font-semibold text-green-800">Import complete!</div>
            <div className="text-green-700">Imported: {importResult.imported} | Errors: {importResult.errors}</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Admission No.</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Level</th>
                <th className="px-4 py-3 text-left">Intake</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Letter</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/10">
              {students.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-stone">No students enrolled yet</td></tr>}
              {students.map(s => (
                <tr key={s.id} className="hover:bg-cream-deep/50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-brand">{s.admission_no}</td>
                  <td className="px-4 py-3 font-medium text-brand-dark">{s.application?.surname} {s.application?.other_names}</td>
                  <td className="px-4 py-3 text-stone text-xs">{s.course?.name}</td>
                  <td className="px-4 py-3 text-stone">{s.level}</td>
                  <td className="px-4 py-3 text-stone">{s.intake} {s.year}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-stone/20 text-stone'}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.admission_letter ? (
                      <a href={s.admission_letter.letter_url} target="_blank" rel="noreferrer" className="text-brand text-xs hover:underline">Download</a>
                    ) : (
                      <button onClick={() => generateLetter(s.id)} className="text-terracotta text-xs hover:underline">Generate</button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditStudent(s)} className="text-brand hover:text-brand-dark font-medium text-xs transition">Edit</button>
                      <button onClick={() => handleViewFeeSummary(s.id)} className="text-green-600 hover:text-green-800 font-medium text-xs transition">Fees</button>
                      <button onClick={() => { setShowProgressionModal(true); setProgressionForm({ ...progressionForm, toLevel: s.level }); setSelectedStudent(s); }} className="text-purple-600 hover:text-purple-800 font-medium text-xs transition">Promote</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-stone/10 flex items-center justify-between text-sm text-stone">
          <span>Page {page} of {Math.ceil(total / 15)}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">← Prev</button>
            <button disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">Next →</button>
          </div>
        </div>
      </div>

      {/* Student Profile Edit Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
            <h2 className="font-display text-xl text-brand-dark mb-1">Edit Student Profile</h2>
            <p className="text-sm text-stone mb-4">{selectedStudent.admission_no} — {selectedStudent.application?.surname} {selectedStudent.application?.other_names}</p>
            
            <form onSubmit={handleUpdateStudent} className="flex-1 overflow-y-auto mb-5 pr-2 space-y-6">
              {/* Profile Photo */}
              <div>
                <h3 className="font-semibold text-brand-dark mb-3 border-b border-stone/10 pb-2">Profile Photo</h3>
                <div className="flex items-center gap-4">
                  {selectedStudent.profile_picture_url && (
                    <img src={selectedStudent.profile_picture_url} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-stone/20" />
                  )}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-brand-dark mb-1">Upload New Photo</label>
                    <input type="file" accept="image/*" onChange={e => setProfilePhoto(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h3 className="font-semibold text-brand-dark mb-3 border-b border-stone/10 pb-2">Academic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Level</label>
                    <select value={editForm.level} onChange={e => setEditForm({ ...editForm, level: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm">
                      <option value="">Select Level</option>
                      <option value="Level 3">Level 3 (Short Course)</option>
                      <option value="Level 4">Level 4 (Artisan)</option>
                      <option value="Level 5">Level 5 (Certificate)</option>
                      <option value="Level 6">Level 6 (Diploma)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Intake</label>
                    <select value={editForm.intake} onChange={e => setEditForm({ ...editForm, intake: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm">
                      <option value="">Select Intake</option>
                      <option value="JANUARY">January</option>
                      <option value="MAY">May</option>
                      <option value="SEPTEMBER">September</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Year</label>
                    <input type="number" value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Status</label>
                    <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm">
                      <option value="">Select Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="DEFERRED">Deferred</option>
                      <option value="GRADUATED">Graduated</option>
                      <option value="WITHDRAWN">Withdrawn</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-brand-dark mb-3 border-b border-stone/10 pb-2">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Phone</label>
                    <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Address</label>
                    <input type="text" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">ID Number</label>
                    <input type="text" value={editForm.id_number} onChange={e => setEditForm({ ...editForm, id_number: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                </div>
              </div>

              {/* Father Information */}
              <div>
                <div className="flex items-center gap-3 mb-3 border-b border-stone/10 pb-2">
                  <h3 className="font-semibold text-brand-dark">Father Information</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-stone">Present?</label>
                    <button type="button" onClick={() => setEditForm({ ...editForm, father_present: !editForm.father_present })}
                      className={`w-12 h-6 rounded-full transition ${editForm.father_present ? 'bg-brand' : 'bg-stone/30'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition ${editForm.father_present ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
                {editForm.father_present && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Father's Name</label>
                      <input type="text" value={editForm.father_name} onChange={e => setEditForm({ ...editForm, father_name: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Father's Phone</label>
                      <input type="text" value={editForm.father_phone} onChange={e => setEditForm({ ...editForm, father_phone: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Father's Email</label>
                      <input type="email" value={editForm.father_email} onChange={e => setEditForm({ ...editForm, father_email: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Father's Occupation</label>
                      <input type="text" value={editForm.father_occupation} onChange={e => setEditForm({ ...editForm, father_occupation: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Mother Information */}
              <div>
                <div className="flex items-center gap-3 mb-3 border-b border-stone/10 pb-2">
                  <h3 className="font-semibold text-brand-dark">Mother Information</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-stone">Present?</label>
                    <button type="button" onClick={() => setEditForm({ ...editForm, mother_present: !editForm.mother_present })}
                      className={`w-12 h-6 rounded-full transition ${editForm.mother_present ? 'bg-brand' : 'bg-stone/30'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition ${editForm.mother_present ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
                {editForm.mother_present && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Mother's Name</label>
                      <input type="text" value={editForm.mother_name} onChange={e => setEditForm({ ...editForm, mother_name: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Mother's Phone</label>
                      <input type="text" value={editForm.mother_phone} onChange={e => setEditForm({ ...editForm, mother_phone: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Mother's Email</label>
                      <input type="email" value={editForm.mother_email} onChange={e => setEditForm({ ...editForm, mother_email: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Mother's Occupation</label>
                      <input type="text" value={editForm.mother_occupation} onChange={e => setEditForm({ ...editForm, mother_occupation: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="font-semibold text-brand-dark mb-3 border-b border-stone/10 pb-2">Emergency Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Emergency Contact Name</label>
                    <input type="text" value={editForm.emergency_person} onChange={e => setEditForm({ ...editForm, emergency_person: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Emergency Contact Phone</label>
                    <input type="text" value={editForm.emergency_phone} onChange={e => setEditForm({ ...editForm, emergency_phone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                </div>
              </div>

              {/* Document Uploads */}
              <div>
                <h3 className="font-semibold text-brand-dark mb-3 border-b border-stone/10 pb-2">Document Uploads</h3>
                
                {/* Existing Documents */}
                <div className="mb-4 p-4 bg-cream-deep/30 rounded-xl">
                  <h4 className="text-sm font-semibold text-brand-dark mb-3">Uploaded Documents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {selectedStudent.id_copy_front_url && (
                      <a href={selectedStudent.id_copy_front_url} target="_blank" rel="noreferrer" className="text-brand hover:underline flex items-center gap-2">
                        📄 Student ID (Front)
                      </a>
                    )}
                    {selectedStudent.id_copy_back_url && (
                      <a href={selectedStudent.id_copy_back_url} target="_blank" rel="noreferrer" className="text-brand hover:underline flex items-center gap-2">
                        📄 Student ID (Back)
                      </a>
                    )}
                    {selectedStudent.parent_id_copy_front_url && (
                      <a href={selectedStudent.parent_id_copy_front_url} target="_blank" rel="noreferrer" className="text-brand hover:underline flex items-center gap-2">
                        📄 Parent ID (Front)
                      </a>
                    )}
                    {selectedStudent.parent_id_copy_back_url && (
                      <a href={selectedStudent.parent_id_copy_back_url} target="_blank" rel="noreferrer" className="text-brand hover:underline flex items-center gap-2">
                        📄 Parent ID (Back)
                      </a>
                    )}
                    {selectedStudent.medical_report_url && (
                      <a href={selectedStudent.medical_report_url} target="_blank" rel="noreferrer" className="text-brand hover:underline flex items-center gap-2">
                        📄 Medical Report
                      </a>
                    )}
                    {selectedStudent.kcse_certificate_url && (
                      <a href={selectedStudent.kcse_certificate_url} target="_blank" rel="noreferrer" className="text-brand hover:underline flex items-center gap-2">
                        📄 KCSE Certificate
                      </a>
                    )}
                    {selectedStudent.birth_certificate_url && (
                      <a href={selectedStudent.birth_certificate_url} target="_blank" rel="noreferrer" className="text-brand hover:underline flex items-center gap-2">
                        📄 Birth Certificate
                      </a>
                    )}
                    {selectedStudent.other_documents_url && (
                      <a href={selectedStudent.other_documents_url} target="_blank" rel="noreferrer" className="text-brand hover:underline flex items-center gap-2">
                        📄 Other Documents
                      </a>
                    )}
                    {!selectedStudent.id_copy_front_url && !selectedStudent.id_copy_back_url && 
                     !selectedStudent.parent_id_copy_front_url && !selectedStudent.parent_id_copy_back_url &&
                     !selectedStudent.medical_report_url && !selectedStudent.kcse_certificate_url &&
                     !selectedStudent.birth_certificate_url && !selectedStudent.other_documents_url && (
                      <p className="text-stone col-span-2">No documents uploaded yet</p>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-brand-dark mb-3">Upload New Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Student ID Copy (Front)</label>
                      <input type="file" accept="image/*" onChange={e => setDocFiles({...docFiles, id_copy_front: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Student ID Copy (Back)</label>
                      <input type="file" accept="image/*" onChange={e => setDocFiles({...docFiles, id_copy_back: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Parent ID Copy (Front)</label>
                      <input type="file" accept="image/*" onChange={e => setDocFiles({...docFiles, parent_id_copy_front: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Parent ID Copy (Back)</label>
                      <input type="file" accept="image/*" onChange={e => setDocFiles({...docFiles, parent_id_copy_back: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Medical Report</label>
                      <input type="file" accept=".pdf,image/*" onChange={e => setDocFiles({...docFiles, medical_report: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">KCSE Certificate</label>
                      <input type="file" accept=".pdf,image/*" onChange={e => setDocFiles({...docFiles, kcse_certificate: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Birth Certificate</label>
                      <input type="file" accept=".pdf,image/*" onChange={e => setDocFiles({...docFiles, birth_certificate: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Other Documents</label>
                      <input type="file" accept=".pdf,image/*" onChange={e => setDocFiles({...docFiles, other_documents: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                  </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-stone/10">
                <button type="submit" disabled={updating || uploadingDocs}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                  {updating || uploadingDocs ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setSelectedStudent(null)} className="flex-1 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Summary Modal */}
      {showFeeModal && feeSummary && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <h2 className="font-display text-xl text-brand-dark mb-1">Fee Summary</h2>
            <p className="text-sm text-stone mb-4">{feeSummary.student.admission_no} — Level {feeSummary.student.level}</p>
            
            <div className="flex-1 overflow-y-auto mb-5 pr-2 space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-cream-deep rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-dark">{feeSummary.summary.totalBalance.toLocaleString()}</div>
                  <div className="text-xs text-stone">Total Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{feeSummary.summary.totalPaid.toLocaleString()}</div>
                  <div className="text-xs text-stone">Total Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand">{feeSummary.summary.totalTerms}</div>
                  <div className="text-xs text-stone">Terms Enrolled</div>
                </div>
              </div>

              <h3 className="font-semibold text-brand-dark">Term Balances</h3>
              <div className="space-y-2">
                {feeSummary.balances.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between p-3 border border-stone/10 rounded-lg">
                    <div>
                      <div className="font-medium text-brand-dark">{b.term.name}</div>
                      <div className="text-xs text-stone">Level: {b.level}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${b.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {b.balance > 0 ? b.balance.toLocaleString() : 'Paid'}
                      </div>
                      <div className="text-xs text-stone">{b.status}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-semibold text-brand-dark">Record Payment</h3>
              {feeSummary.balances.length > 0 && feeSummary.balances[0].balance > 0 && (
                <div className="space-y-3">
                  <select
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                  >
                    <option value="">Select amount or enter custom</option>
                    {feeSummary.balances.map((b: any) => (
                      <option key={b.id} value={b.balance}>Full Term Payment ({b.balance.toLocaleString()})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    placeholder="Or enter custom amount"
                    className="w-full px-3 py-2 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                  />
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    placeholder="Payment notes (optional)"
                    className="w-full px-3 py-2 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                  />
                  <button
                    onClick={() => handleRecordPayment(feeSummary.student.id, feeSummary.balances[0].term_id)}
                    disabled={recordingPayment}
                    className="w-full py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {recordingPayment ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => { setShowFeeModal(false); setFeeSummary(null); }} className="w-full py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Progression Modal */}
      {showProgressionModal && selectedStudent && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="font-display text-xl text-brand-dark mb-1">Promote Student</h2>
            <p className="text-sm text-stone mb-4">{selectedStudent.admission_no} — Current: {selectedStudent.level}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">New Level</label>
                <select
                  value={progressionForm.toLevel}
                  onChange={e => setProgressionForm({ ...progressionForm, toLevel: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                >
                  <option value="">Select Level</option>
                  <option value="Level 3">Level 3 (Short Course)</option>
                  <option value="Level 4">Level 4 (Artisan)</option>
                  <option value="Level 5">Level 5 (Certificate)</option>
                  <option value="Level 6">Level 6 (Diploma)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Term</label>
                <select
                  value={progressionForm.termId}
                  onChange={e => setProgressionForm({ ...progressionForm, termId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                >
                  <option value="">Select Term</option>
                  {terms.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.academic_year})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Notes (optional)</label>
                <textarea
                  value={progressionForm.notes}
                  onChange={e => setProgressionForm({ ...progressionForm, notes: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="forcePromote"
                  checked={progressionForm.forcePromote}
                  onChange={e => setProgressionForm({ ...progressionForm, forcePromote: e.target.checked })}
                  className="rounded border-stone/25"
                />
                <label htmlFor="forcePromote" className="text-sm text-stone">Force promotion (ignore outstanding balances)</label>
              </div>
              <button
                onClick={() => handlePromoteStudent(selectedStudent.id)}
                disabled={promoting}
                className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              >
                {promoting ? 'Promoting...' : 'Promote Student'}
              </button>
              <button
                onClick={() => { setShowProgressionModal(false); setProgressionForm({ toLevel: '', termId: '', notes: '', forcePromote: false }); }}
                className="w-full py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [staffForm, setStaffForm] = useState({ email: '', password: '', role: 'DEPT_HEAD', department_id: '' });
  const [departments, setDepartments] = useState<any[]>([]);
  const [savingStaff, setSavingStaff] = useState(false);
  const [staffMsg, setStaffMsg] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ email: '', role: '', department_id: '', new_password: '', confirm_password: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  useEffect(() => {
    departmentsApi.getAll().then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params: any = { page, limit: 20 };
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;
    api.get('/auth/users', { params }).then(r => {
      // Filter out students from the users list
      const filteredUsers = r.data.users.filter((u: any) => u.role !== 'STUDENT');
      setUsers(filteredUsers);
      setTotal(filteredUsers.length);
    }).catch(err => {
      console.error('Failed to fetch users:', err);
      alert('Failed to load users. Please check your connection.');
    });
  }, [page, roleFilter, search]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setUpdating(userId);
    try {
      await api.patch(`/auth/users/${userId}`, { is_active: !currentStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
    } catch (err) {
      alert('Failed to update user status');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setUpdating(userId);
    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      setTotal(total - 1);
      alert('User deleted successfully');
    } catch (err) {
      alert('Failed to delete user');
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStaff(true);
    setStaffMsg('');
    try {
      await api.post('/auth/create-staff', staffForm);
      setStaffMsg('✅ Staff account created successfully!');
      setStaffForm({ email: '', password: '', role: 'DEPT_HEAD', department_id: '' });
      setShowCreateForm(false);
      const updated = await api.get('/auth/users', { params: { page, limit: 20, role: roleFilter, search } });
      setUsers(updated.data.users.filter((u: any) => u.role !== 'STUDENT'));
      setTotal(updated.data.users.filter((u: any) => u.role !== 'STUDENT').length);
    } catch (err: any) {
      setStaffMsg(err?.response?.data?.error || 'Failed to create staff account');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditForm({
      email: user.email,
      role: user.role,
      department_id: user.student?.department?.id || '',
      new_password: '',
      confirm_password: ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditMsg('');
    try {
      const updateData: any = {
        email: editForm.email,
        role: editForm.role,
      };
      if (editForm.role === 'DEPT_HEAD' && editForm.department_id) {
        updateData.department_id = editForm.department_id;
      }
      if (editForm.new_password) {
        if (editForm.new_password !== editForm.confirm_password) {
          setEditMsg('Passwords do not match');
          setSavingEdit(false);
          return;
        }
        updateData.password = editForm.new_password;
      }
      await api.patch(`/auth/users/${editingUser.id}`, updateData);
      setEditMsg('✅ User updated successfully!');
      const updated = await api.get('/auth/users', { params: { page, limit: 20, role: roleFilter, search } });
      setUsers(updated.data.users.filter((u: any) => u.role !== 'STUDENT'));
      setTotal(updated.data.users.filter((u: any) => u.role !== 'STUDENT').length);
      setTimeout(() => {
        setShowEditModal(false);
        setEditingUser(null);
        setEditMsg('');
      }, 1500);
    } catch (err: any) {
      setEditMsg(err?.response?.data?.error || 'Failed to update user');
    } finally {
      setSavingEdit(false);
    }
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    DEPT_HEAD: 'bg-blue-100 text-blue-800',
    FINANCE: 'bg-green-100 text-green-800',
    STAFF: 'bg-gray-100 text-gray-800',
    PROCUREMENT: 'bg-orange-100 text-orange-800',
    HR: 'bg-pink-100 text-pink-800',
    STUDENT: 'bg-brand/10 text-brand',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl text-brand-dark">Users ({total})</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-4 py-2 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition">
            {showCreateForm ? 'Cancel' : '+ Create Staff'}
          </button>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand">
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="DEPT_HEAD">Dept Head</option>
            <option value="FINANCE">Finance</option>
            <option value="STAFF">Staff</option>
            <option value="PROCUREMENT">Procurement</option>
            <option value="HR">HR</option>
          </select>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search email…"
            className="px-3 py-2 rounded-xl border border_stone/25 bg-white text-sm focus:outline-none focus:border-brand w-56" />
        </div>
      </div>

      {/* Create Staff Form */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm mb-6">
          <h2 className="font-display text-lg text-brand-dark mb-5">Create Staff Account</h2>
          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email *</label>
                <input type="email" required value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Password *</label>
                <input type="password" required value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Role *</label>
                <select required value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                  <option value="ADMIN">Admin</option>
                  <option value="DEPT_HEAD">Dept Head</option>
                  <option value="FINANCE">Finance</option>
                  <option value="STAFF">Staff</option>
                  <option value="PROCUREMENT">Procurement</option>
                  <option value="HR">HR</option>
                </select>
              </div>
              {staffForm.role === 'DEPT_HEAD' && (
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Department</label>
                  <select value={staffForm.department_id} onChange={e => setStaffForm({...staffForm, department_id: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            {staffMsg && (
              <div className={`p-3 rounded-xl text-sm ${staffMsg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                {staffMsg}
              </div>
            )}
            <button type="submit" disabled={savingStaff}
              className="w-full px-4 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
              {savingStaff ? 'Creating…' : 'Create Staff Account'}
            </button>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="font-display text-xl text-brand-dark mb-1">Edit User</h2>
            <p className="text-sm text-stone mb-4">{editingUser.email}</p>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Email *</label>
                <input type="email" required value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Role *</label>
                <select required value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm">
                  <option value="ADMIN">Admin</option>
                  <option value="DEPT_HEAD">Dept Head</option>
                  <option value="FINANCE">Finance</option>
                  <option value="STAFF">Staff</option>
                  <option value="PROCUREMENT">Procurement</option>
                  <option value="HR">HR</option>
                </select>
              </div>
              {editForm.role === 'DEPT_HEAD' && (
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">Department</label>
                  <select value={editForm.department_id} onChange={e => setEditForm({...editForm, department_id: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm">
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="border-t border-stone/10 pt-4">
                <label className="block text-sm font-medium text-brand-dark mb-2">Change Password (optional)</label>
                <input type="password" value={editForm.new_password} onChange={e => setEditForm({...editForm, new_password: e.target.value})}
                  placeholder="New password" className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm mb-3" />
                <input type="password" value={editForm.confirm_password} onChange={e => setEditForm({...editForm, confirm_password: e.target.value})}
                  placeholder="Confirm new password" className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
              </div>
              {editMsg && (
                <div className={`p-3 rounded-xl text-sm ${editMsg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                  {editMsg}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                  {savingEdit ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingUser(null); setEditMsg(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Student Info</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/10">
              {users.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-stone">No users found</td></tr>}
              {users.map(u => (
                <tr key={u.id} className="hover:bg-cream-deep/50 transition">
                  <td className="px-4 py-3 font-medium text-brand-dark">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-stone/20 text-stone'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone text-xs">
                    {u.student ? `${u.student.admission_no} • ${u.student.course?.name || 'N/A'}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-stone text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditUser(u)}
                        className="text-xs px-2 py-1 rounded-lg border border-stone/25 hover:border-brand transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        disabled={updating === u.id}
                        className="text-xs px-2 py-1 rounded-lg border border-stone/25 hover:border-brand transition disabled:opacity-50"
                      >
                        {updating === u.id ? '...' : (u.is_active ? 'Deactivate' : 'Activate')}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={updating === u.id}
                        className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-stone/10 flex items-center justify-between text-sm text-stone">
          <span>Page {page} of {Math.ceil(total / 20)}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">← Prev</button>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoursesTab() {
  const [subTab, setSubTab] = useState<'courses' | 'departments'>('courses');
  const [depts, setDepts] = useState<any[]>([]);
  
  // Department CRUD states
  const [deptForm, setDeptForm] = useState({ id: '', name: '', tagline: '', description: '', icon: '🏢', image_url: '' });
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [savingDept, setSavingDept] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');

  // Course CRUD states
  const [courses, setCourses] = useState<any[]>([]);
  const [courseTotal, setCourseTotal] = useState(0);
  const [coursePage, setCoursePage] = useState(1);
  const [courseSearch, setCourseSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [courseForm, setCourseForm] = useState({ id: '', name: '', levels: '', shortcode: '', department_id: '' });
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);

  const fetchDepts = () => {
    departmentsApi.getAll().then(r => setDepts(r.data)).catch(() => {});
  };

  const fetchCourses = () => {
    coursesApi.getAll({ page: coursePage, limit: 15, search: courseSearch, department_id: deptFilter })
      .then(r => {
        setCourses(r.data.courses);
        setCourseTotal(r.data.pagination.total);
      }).catch(() => {});
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [coursePage, courseSearch, deptFilter]);

  const handleDeptSubmit = async (e: any) => {
    e.preventDefault();
    setSavingDept(true);
    try {
      if (deptForm.id) {
        await departmentsApi.update(deptForm.id, deptForm);
      } else {
        await departmentsApi.create(deptForm);
      }
      fetchDepts();
      setIsDeptModalOpen(false);
      setDeptForm({ id: '', name: '', tagline: '', description: '', icon: '🏢', image_url: '' });
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save department');
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeptDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await departmentsApi.delete(id);
      fetchDepts();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete department');
    }
  };

  const handleCourseSubmit = async (e: any) => {
    e.preventDefault();
    setSavingCourse(true);
    try {
      if (courseForm.id) {
        await coursesApi.update(courseForm.id, courseForm);
      } else {
        await coursesApi.create(courseForm);
      }
      fetchCourses();
      setIsCourseModalOpen(false);
      setCourseForm({ id: '', name: '', levels: '', shortcode: '', department_id: '' });
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save course');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleCourseDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await coursesApi.delete(id);
      fetchCourses();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete course');
    }
  };

  const filteredDepts = depts.filter(d => 
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    (d.tagline && d.tagline.toLowerCase().includes(deptSearch.toLowerCase()))
  );

  return (
    <div>
      {/* Sub-tabs header */}
      <div className="flex gap-4 mb-6 border-b border-stone/15">
        <button onClick={() => setSubTab('courses')}
          className={`pb-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${subTab === 'courses' ? 'border-brand text-brand' : 'border-transparent text-stone hover:text-brand-dark'}`}>
          📚 Courses & Shortcodes
        </button>
        <button onClick={() => setSubTab('departments')}
          className={`pb-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${subTab === 'departments' ? 'border-brand text-brand' : 'border-transparent text-stone hover:text-brand-dark'}`}>
          🏢 Departments
        </button>
      </div>

      {/* ── COURSES SUB-TAB ── */}
      {subTab === 'courses' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl text-brand-dark">Courses ({courseTotal})</h2>
              <button onClick={() => {
                setCourseForm({ id: '', name: '', levels: 'Level 3, Level 4, Level 5', shortcode: '', department_id: depts[0]?.id || '' });
                setIsCourseModalOpen(true);
              }} className="px-3 py-1.5 rounded-xl bg-brand text-cream text-xs font-semibold hover:bg-brand-dark transition shadow">
                + Add Course
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <input value={courseSearch} onChange={e => { setCourseSearch(e.target.value); setCoursePage(1); }}
                placeholder="Search course name, shortcode…"
                className="px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand w-48" />
              <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setCoursePage(1); }}
                className="px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand max-w-xs">
                <option value="">All Departments</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Shortcode</th>
                    <th className="px-4 py-3 text-left">Course Name</th>
                    <th className="px-4 py-3 text-left">Levels</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/10">
                  {courses.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-stone">No courses found</td></tr>}
                  {courses.map(c => (
                    <tr key={c.id} className="hover:bg-cream-deep/50 transition">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-brand">{c.shortcode}</td>
                      <td className="px-4 py-3 font-medium text-brand-dark">{c.name}</td>
                      <td className="px-4 py-3 text-stone">{c.levels}</td>
                      <td className="px-4 py-3 text-stone text-xs">{c.department?.name}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => {
                          setCourseForm({ id: c.id, name: c.name, levels: c.levels, shortcode: c.shortcode, department_id: c.department_id });
                          setIsCourseModalOpen(true);
                        }} className="text-brand hover:underline text-xs font-semibold">Edit</button>
                        <button onClick={() => handleCourseDelete(c.id)} className="text-red-600 hover:underline text-xs font-semibold">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-stone/10 flex items-center justify-between text-sm text-stone">
              <span>Page {coursePage} of {Math.ceil(courseTotal / 15) || 1}</span>
              <div className="flex gap-2">
                <button disabled={coursePage === 1} onClick={() => setCoursePage(p => p - 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">← Prev</button>
                <button disabled={coursePage >= Math.ceil(courseTotal / 15)} onClick={() => setCoursePage(p => p + 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">Next →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DEPARTMENTS SUB-TAB ── */}
      {subTab === 'departments' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl text-brand-dark">Departments ({filteredDepts.length})</h2>
              <button onClick={() => {
                setDeptForm({ id: '', name: '', tagline: '', description: '', icon: '🏢', image_url: '' });
                setIsDeptModalOpen(true);
              }} className="px-3 py-1.5 rounded-xl bg-brand text-cream text-xs font-semibold hover:bg-brand-dark transition shadow">
                + Add Department
              </button>
            </div>
            <input value={deptSearch} onChange={e => setDeptSearch(e.target.value)}
              placeholder="Search department name…"
              className="px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand w-56" />
          </div>

          <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">Icon</th>
                    <th className="px-4 py-3 text-left">Department Name</th>
                    <th className="px-4 py-3 text-left">Tagline</th>
                    <th className="px-4 py-3 text-left">Slug</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/10">
                  {filteredDepts.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-stone">No departments found</td></tr>}
                  {filteredDepts.map(d => (
                    <tr key={d.id} className="hover:bg-cream-deep/50 transition">
                      <td className="px-4 py-3 text-lg text-center">{d.icon || '🏢'}</td>
                      <td className="px-4 py-3 font-semibold text-brand-dark">{d.name}</td>
                      <td className="px-4 py-3 text-stone text-xs">{d.tagline || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-stone">{d.slug}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => {
                          setDeptForm({ id: d.id, name: d.name, tagline: d.tagline || '', description: d.description || '', icon: d.icon || '🏢', image_url: d.image_url || '' });
                          setIsDeptModalOpen(true);
                        }} className="text-brand hover:underline text-xs font-semibold">Edit</button>
                        <button onClick={() => handleDeptDelete(d.id)} className="text-red-600 hover:underline text-xs font-semibold">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── COURSE MODAL ── */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-display text-lg text-brand-dark mb-4">{courseForm.id ? 'Edit Course' : 'Create Course'}</h3>
            <form onSubmit={handleCourseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone uppercase tracking-wider mb-1 text-[10px]">Course Name</label>
                <input required value={courseForm.name} onChange={e => setCourseForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Mechanical Engineering"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm text-brand-dark bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone uppercase tracking-wider mb-1 text-[10px]">Shortcode (Upper Case, Unique)</label>
                <input required value={courseForm.shortcode} onChange={e => setCourseForm(f => ({ ...f, shortcode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                  placeholder="e.g. MECH"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand font-mono text-sm text-brand-dark bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone uppercase tracking-wider mb-1 text-[10px]">Levels (comma separated)</label>
                <input required value={courseForm.levels} onChange={e => setCourseForm(f => ({ ...f, levels: e.target.value }))}
                  placeholder="e.g. Level 3, Level 4, Level 5"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm text-brand-dark bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone uppercase tracking-wider mb-1 text-[10px]">Department</label>
                <select required value={courseForm.department_id} onChange={e => setCourseForm(f => ({ ...f, department_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm text-brand-dark bg-white">
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={savingCourse} className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                  {savingCourse ? 'Saving…' : 'Save Course'}
                </button>
                <button type="button" onClick={() => setIsCourseModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-stone/25 text-stone hover:bg-stone/5 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DEPARTMENT MODAL ── */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-display text-lg text-brand-dark mb-4">{deptForm.id ? 'Edit Department' : 'Create Department'}</h3>
            <form onSubmit={handleDeptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone uppercase tracking-wider mb-1 text-[10px]">Department Name</label>
                <input required value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Computing & Informatics"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm text-brand-dark bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone uppercase tracking-wider mb-1 text-[10px]">Icon (Emoji)</label>
                <input required value={deptForm.icon} onChange={e => setDeptForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="e.g. 💻"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm text-brand-dark bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone uppercase tracking-wider mb-1 text-[10px]">Tagline</label>
                <input value={deptForm.tagline} onChange={e => setDeptForm(f => ({ ...f, tagline: e.target.value }))}
                  placeholder="e.g. Code the future you want"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm text-brand-dark bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone uppercase tracking-wider mb-1 text-[10px]">Description</label>
                <textarea value={deptForm.description} onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Brief description of the department..."
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm resize-none text-brand-dark bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone uppercase tracking-wider mb-1 text-[10px]">Image URL</label>
                <input value={deptForm.image_url} onChange={e => setDeptForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm text-brand-dark bg-white" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={savingDept} className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                  {savingDept ? 'Saving…' : 'Save Department'}
                </button>
                <button type="button" onClick={() => setIsDeptModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-stone/25 text-stone hover:bg-stone/5 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
