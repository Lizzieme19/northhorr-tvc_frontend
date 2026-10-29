'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { studentsApi, applicationsApi, departmentsApi, coursesApi, resourcesApi, newsApi, feeTypesApi, termsApi, galleryApi, termProgressionApi } from '@/lib/services';
import ChangePassword from '@/components/ChangePassword';
import ReportsExport from '@/components/ReportsExport';
import { StudentDocumentsModal, BulkIssueDocumentsModal } from '@/components/StudentDocuments';
import { StudentHistoryModal, LinkRecordModal } from '@/components/StudentHistory';
import TermInfo from '@/components/TermInfo';
import { termLabel } from '@/lib/terms';
import { toast } from 'sonner';

interface Stats { total: number; active: number; graduated: number; pendingApps: number; approvedApps: number; }
interface Application { id: string; application_no: string; surname: string; other_names: string; email: string; status: string; type: string; created_at: string; course?: { name: string }; department?: { name: string };[key: string]: any; }

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

// Registrars handle student affairs: applications, students, departments/courses and progression — never finance or system admin
const REGISTRAR_TABS = ['overview', 'applications', 'students', 'courses', 'term-progression'];

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'ADMIN';
  const [stats, setStats] = useState<Stats | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appTotal, setAppTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'overview' | 'applications' | 'students' | 'users' | 'courses' | 'resources' | 'news' | 'gallery' | 'fee-types' | 'terms' | 'billing' | 'requisitions' | 'term-progression' | 'doc-templates' | 'settings'>('overview');
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [intake, setIntake] = useState('SEPTEMBER');
  const [studentCredentials, setStudentCredentials] = useState<any>(null);
  // Set when the applicant looks like an existing student (returning for the next level)
  const [historyFor, setHistoryFor] = useState<any>(null);
  const [existingMatches, setExistingMatches] = useState<{ appId: string; matches: any[] } | null>(null);
  const [appDocFiles, setAppDocFiles] = useState({
    doc_kcpe: null as File | null,
    doc_kcse: null as File | null,
    doc_id_copy: null as File | null,
    doc_birth_cert: null as File | null,
    doc_medical: null as File | null,
  });
  const [uploadingAppDocs, setUploadingAppDocs] = useState(false);
  const [editableAppData, setEditableAppData] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', category: 'Prospectus' });
  const [news, setNews] = useState<any[]>([]);
  const [newsForm, setNewsForm] = useState({ title: '', excerpt: '', content: '', category: 'News', is_featured: false, is_published: false });
  const [newsImage, setNewsImage] = useState<File | null>(null);
  const [uploadingNews, setUploadingNews] = useState(false);
  const [gallery, setGallery] = useState<any[]>([]);
  const [galleryForm, setGalleryForm] = useState({ title: '', description: '', category: 'GENERAL', is_featured: false, display_order: 0 });
  const [galleryImage, setGalleryImage] = useState<File | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState('');
  const [feeTypeForm, setFeeTypeForm] = useState({ name: '', code: '', description: '', amount: '', is_required: false, is_disabled: false, applies_to: 'ALL', course_id: '', level: '', term_based: false });
  const [editingFeeType, setEditingFeeType] = useState<any>(null);
  const [savingFeeType, setSavingFeeType] = useState(false);
  const [terms, setTerms] = useState<any[]>([]);
  const [termForm, setTermForm] = useState({ name: '', start_date: '', end_date: '', academic_year: '', intake: '', term_cost: '', is_active: true });
  const [editingTerm, setEditingTerm] = useState<any>(null);
  const [savingTerm, setSavingTerm] = useState(false);
  const [progressionForm, setProgressionForm] = useState({ student_id: '', new_term_id: '', new_level: '', new_intake: '', new_year: '', notes: '' });
  const [lookupStudentId, setLookupStudentId] = useState('');
  const [studentBalances, setStudentBalances] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [availableTerms, setAvailableTerms] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [promotionHistory, setPromotionHistory] = useState<any[]>([]);
  const [promotionHistoryLoading, setPromotionHistoryLoading] = useState(false);
  const [promotionHistoryFilter, setPromotionHistoryFilter] = useState({ level: '', academic_year: '' });

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || !['ADMIN', 'REGISTRAR'].includes(user.role))) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    studentsApi.getStats().then(r => setStats(r.data)).catch(() => { });
  }, []);

  useEffect(() => {
    if (tab === 'resources') {
      resourcesApi.getAll().then(r => setResources(r.data || [])).catch(() => setResources([]));
    }
    if (tab === 'news') {
      newsApi.getAll().then(r => setNews(r.data.news || [])).catch(() => setNews([]));
    }
    if (tab === 'gallery') {
      galleryApi.getAll().then(r => setGallery(r.data?.items || [])).catch(() => setGallery([]));
    }
    if (tab === 'fee-types' && isAdmin) {
      feeTypesApi.getAll().then(r => setFeeTypes(r.data.fee_types || [])).catch(() => setFeeTypes([]));
    }
    if (tab === 'terms') {
      termsApi.getAll().then(r => setTerms(r.data.terms || [])).catch(() => setTerms([]));
    }
    if (tab === 'term-progression') {
      studentsApi.getAll({ page: 1, limit: 1000 }).then(r => setAvailableStudents(r.data?.students || [])).catch(() => setAvailableStudents([]));
      termsApi.getAll().then(r => setAvailableTerms(r.data.terms || [])).catch(() => setAvailableTerms([]));
      // Load promotion history
      setPromotionHistoryLoading(true);
      termProgressionApi.getAllPromotions()
        .then(r => setPromotionHistory(r.data?.progressions || []))
        .catch(() => setPromotionHistory([]))
        .finally(() => setPromotionHistoryLoading(false));
    }
    // Load fee types for payment recording
    if (isAdmin) feeTypesApi.getAll().then(r => setFeeTypes(r.data.fee_types || [])).catch(() => setFeeTypes([]));
  }, [tab, isAdmin]);

  useEffect(() => {
    const params: any = { page, limit: 15 };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    applicationsApi.getAll(params).then(r => {
      setApplications(r.data.applications);
      setAppTotal(r.data.pagination.total);
    }).catch(() => { });
  }, [page, statusFilter, search, tab]);

  useEffect(() => {
    if (selectedApp) {
      setEditableAppData({
        surname: selectedApp.surname || '',
        other_names: selectedApp.other_names || '',
        email: selectedApp.email || '',
        phone: selectedApp.phone || '',
        address: selectedApp.address || '',
        kcpe_index: selectedApp.kcpe_index || '',
        kcpe_marks: selectedApp.kcpe_marks || '',
        kcse_index: selectedApp.kcse_index || '',
        kcse_grade: selectedApp.kcse_grade || '',
        previous_school: selectedApp.previous_school || '',
        parent_names: selectedApp.parent_names || '',
        parent_relationship: selectedApp.parent_relationship || '',
        parent_phone: selectedApp.parent_phone || '',
        parent_email: selectedApp.parent_email || '',
        emergency_person: selectedApp.emergency_person || '',
        emergency_phone: selectedApp.emergency_phone || '',
        medical_conditions: selectedApp.medical_conditions || '',
        disability: selectedApp.disability || '',
      });
    } else {
      setEditableAppData(null);
    }
  }, [selectedApp]);

  // Pre-fill the intake and year of the new stage from the chosen term (or the student's current ones)
  const withStageDefaults = (f: any) => {
    const term = availableTerms.find((t: any) => t.id === f.new_term_id);
    const stu = availableStudents.find((x: any) => x.id === f.student_id);
    const termIntake = ['JANUARY', 'MAY', 'SEPTEMBER'].includes(term?.intake) ? term.intake : '';
    return {
      ...f,
      new_intake: f.new_intake || termIntake || stu?.intake || '',
      new_year: f.new_year || (term?.start_date ? String(new Date(term.start_date).getFullYear()) : stu?.year ? String(stu.year) : ''),
    };
  };

  // extra: { continue_student_id } continues an existing student; { create_new: true } confirms a brand-new student
  const handleStatus = async (id: string, status: string, extra: Record<string, any> = {}) => {
    setApproving(id);
    try {
      const response = await applicationsApi.updateStatus(id, { status, review_notes: reviewNotes, intake, year: new Date().getFullYear(), ...extra });
      setSelectedApp(null);
      setExistingMatches(null);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));

      // Display student credentials if application was approved
      if (status === 'APPROVED' && response.data.student_credentials) {
        setStudentCredentials(response.data.student_credentials);
      }
      if (response.data.continued_student) {
        const c = response.data.continued_student;
        toast.success(`Approved. Existing student continues: ${c.previous_admission_no} → ${c.admission_no} (${c.level})`, { duration: 8000 });
      }
    } catch (e: any) {
      // Looks like a returning student: let the admin choose to continue them or confirm they are new
      if (e?.response?.status === 409 && e.response.data?.code === 'EXISTING_STUDENT') {
        setExistingMatches({ appId: id, matches: e.response.data.matches || [] });
      } else {
        toast.error(e?.response?.data?.error || 'Error updating status');
      }
    } finally { setApproving(null); }
  };

  const handleResourceUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceFile || !resourceForm.title || !resourceForm.category) {
      toast.warning('Please fill in all required fields');
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

      toast.success('Resource uploaded successfully!');
      setResourceFile(null);
      setResourceForm({ title: '', description: '', category: 'Prospectus' });
      resourcesApi.getAll().then(r => setResources(r.data || []));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to upload resource');
    } finally {
      setUploading(false);
    }
  };

  const handleResourceDelete = (id: string) => {
    toast('Delete this resource? This action cannot be undone.', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await resourcesApi.delete(id);
            setResources(prev => prev.filter(r => r.id !== id));
            toast.success('Resource deleted successfully');
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to delete resource');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => { },
      },
    });
  };

  const handleNewsUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.excerpt || !newsForm.category) {
      toast.warning('Please fill in all required fields');
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

      toast.success('News created successfully!');
      setNewsForm({ title: '', excerpt: '', content: '', category: 'News', is_featured: false, is_published: false });
      setNewsImage(null);
      newsApi.getAll().then(r => setNews(r.data.news || []));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to create news');
    } finally {
      setUploadingNews(false);
    }
  };

  const handleNewsDelete = (id: string) => {
    toast('Delete this news item? This action cannot be undone.', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await newsApi.delete(id);
            setNews(prev => prev.filter(n => n.id !== id));
            toast.success('News deleted successfully');
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to delete news');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => { },
      },
    });
  };

  const handleAppDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !editableAppData) return;
    setUploadingAppDocs(true);
    try {
      const formData = new FormData();

      // Add document files
      Object.entries(appDocFiles).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      // Add editable form data
      Object.entries(editableAppData).forEach(([key, value]) => {
        if (value) formData.append(key, value.toString());
      });

      await api.patch(`/applications/${selectedApp.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Application updated successfully!');
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
      toast.error(e?.response?.data?.error || 'Failed to update application');
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
        toast.success('Fee type updated successfully');
      } else {
        const response = await feeTypesApi.create(data);
        setFeeTypes(prev => [...prev, response.data.fee_type]);
        toast.success('Fee type created successfully');
      }
      setFeeTypeForm({ name: '', code: '', description: '', amount: '', is_required: false, is_disabled: false, applies_to: 'ALL', course_id: '', level: '', term_based: false });
      setEditingFeeType(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to save fee type');
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

  const handleFeeTypeDelete = (id: string) => {
    toast('Delete this fee type? This action cannot be undone.', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await feeTypesApi.delete(id);
            setFeeTypes(prev => prev.filter(ft => ft.id !== id));
            toast.success('Fee type deleted successfully');
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to delete fee type');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => { },
      },
    });
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
        toast.success('Term updated successfully');
      } else {
        const response = await termsApi.create(data);
        setTerms(prev => [...prev, response.data.term]);
        toast.success('Term created successfully');
      }
      setTermForm({ name: '', start_date: '', end_date: '', academic_year: '', intake: '', term_cost: '', is_active: true });
      setEditingTerm(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to save term');
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
      intake: t.intake || '',
      term_cost: t.term_cost?.toString() || '',
      is_active: t.is_active,
    });
  };

  const handleTermDelete = (id: string) => {
    toast('Delete this term? This action cannot be undone.', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await termsApi.delete(id);
            setTerms(prev => prev.filter(t => t.id !== id));
            toast.success('Term deleted successfully');
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to delete term');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => { },
      },
    });
  };

  const handleTermToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/terms/${id}`, { is_active: !currentStatus });
      setTerms(prev => prev.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t));
      toast.success(`Term ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to update term status');
    }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-cream-deep">
      {/* Top bar */}
      <header className="bg-brand-dark text-cream px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gold grid place-items-center font-display font-bold text-brand-dark text-sm">NT</div>
          <span className="font-display font-semibold hidden sm:block">{isAdmin ? 'North Horr TVC Admin Portal' : 'North Horr TVC Registrar Portal'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-cream/70 text-sm hidden md:block">{user.email}</span>
          <span className="px-2 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold">{user.role}</span>
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
          { key: 'gallery', label: '🖼️ Gallery' },
          { key: 'fee-types', label: '💰 Fee Types' },
          { key: 'terms', label: '📅 Terms' },
          { key: 'billing', label: '💳 Billing' },
          { key: 'requisitions', label: '🛒 Requisitions' },
          { key: 'term-progression', label: '📈 Term Progression' },
          { key: 'doc-templates', label: '📝 Doc Templates' },
          { key: 'settings', label: '⚙️ Settings' },
        ].filter((t) => isAdmin || REGISTRAR_TABS.includes(t.key)).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${tab === t.key ? 'border-brand text-brand' : 'border-transparent text-stone hover:text-brand-dark'
              }`}
          >
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
                {isAdmin && <button onClick={() => setTab('users')} className="p-4 rounded-xl border-2 border-dashed border-purple/30 hover:border-purple hover:bg-purple/5 transition text-left">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-semibold text-brand-dark">Manage Users</div>
                  <div className="text-xs text-stone mt-1">View all system users</div>
                </button>}
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
        {tab === 'students' && <StudentsTab feeTypes={feeTypes} />}

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
                    onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Category *</label>
                  <select
                    required
                    value={resourceForm.category}
                    onChange={e => setResourceForm({ ...resourceForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                  >
                    <option value="Prospectus">Prospectus</option>
                    <option value="Fee Structure">Fee Structure</option>
                    <option value="Forms">Forms</option>
                    <option value="Timetables">Timetables</option>
                    <option value="Policies">Policies</option>
                    <option value="Tenders">Tenders</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Description</label>
                  <textarea
                    value={resourceForm.description}
                    onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">File *</label>
                  <label className="block w-full border-2 border-dashed border-brand/30 rounded-xl p-6 text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                      onChange={e => setResourceFile(e.target.files?.[0] || null)}
                    />
                    <div className="text-3xl mb-2">📁</div>
                    <div className="text-sm font-medium text-brand-dark">{resourceFile ? resourceFile.name : 'Click to upload file'}</div>
                    <div className="text-xs text-stone mt-1">PDF, Word (.doc / .docx), or Image (JPG / PNG)</div>
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
                    onChange={e => setFeeTypeForm({ ...feeTypeForm, name: e.target.value })}
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
                    onChange={e => setFeeTypeForm({ ...feeTypeForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm font-mono"
                    placeholder="e.g. TUITION"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Description</label>
                  <textarea
                    value={feeTypeForm.description}
                    onChange={e => setFeeTypeForm({ ...feeTypeForm, description: e.target.value })}
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
                    onChange={e => setFeeTypeForm({ ...feeTypeForm, amount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    placeholder="e.g. 15000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Applies To *</label>
                  <select
                    required
                    value={feeTypeForm.applies_to}
                    onChange={e => setFeeTypeForm({ ...feeTypeForm, applies_to: e.target.value })}
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
                      onChange={e => setFeeTypeForm({ ...feeTypeForm, course_id: e.target.value })}
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
                      onChange={e => setFeeTypeForm({ ...feeTypeForm, level: e.target.value })}
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
                      onChange={e => setFeeTypeForm({ ...feeTypeForm, is_required: e.target.checked })}
                      className="w-4 h-4 rounded border-stone/25"
                    />
                    <span className="text-sm text-brand-dark">Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feeTypeForm.term_based}
                      onChange={e => setFeeTypeForm({ ...feeTypeForm, term_based: e.target.checked })}
                      className="w-4 h-4 rounded border-stone/25"
                    />
                    <span className="text-sm text-brand-dark">Term-based</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feeTypeForm.is_disabled}
                      onChange={e => setFeeTypeForm({ ...feeTypeForm, is_disabled: e.target.checked })}
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
                    onChange={e => setTermForm({ ...termForm, name: e.target.value })}
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
                    onChange={e => setTermForm({ ...termForm, academic_year: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    placeholder="e.g. 2024/2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Intake *</label>
                  <select
                    required
                    value={termForm.intake}
                    onChange={e => setTermForm({ ...termForm, intake: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                  >
                    <option value="">Select Intake</option>
                    <option value="SEPTEMBER">September</option>
                    <option value="JANUARY">January</option>
                    <option value="MAY">May</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Term Cost</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={termForm.term_cost}
                    onChange={e => setTermForm({ ...termForm, term_cost: e.target.value })}
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
                      onChange={e => setTermForm({ ...termForm, start_date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">End Date *</label>
                    <input
                      type="date"
                      required
                      value={termForm.end_date}
                      onChange={e => setTermForm({ ...termForm, end_date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termForm.is_active}
                      onChange={e => setTermForm({ ...termForm, is_active: e.target.checked })}
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
                      setTermForm({ name: '', start_date: '', end_date: '', academic_year: '', intake: '', term_cost: '', is_active: true });
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
                        <div className="text-sm text-stone">{t.academic_year} • {t.intake || 'N/A'} • {new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}</div>
                        <div className="text-xs text-stone mt-1">
                          KES {t.term_cost?.toLocaleString()} • {t._count?.students || 0} students • {t._count?.student_balances || 0} balances
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
                    onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Excerpt *</label>
                  <textarea
                    required
                    value={newsForm.excerpt}
                    onChange={e => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Content</label>
                  <textarea
                    value={newsForm.content}
                    onChange={e => setNewsForm({ ...newsForm, content: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Category *</label>
                  <select
                    required
                    value={newsForm.category}
                    onChange={e => setNewsForm({ ...newsForm, category: e.target.value })}
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
                      onChange={e => setNewsForm({ ...newsForm, is_featured: e.target.checked })}
                      className="w-4 h-4 rounded border-stone/25"
                    />
                    <span className="text-sm text-brand-dark">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newsForm.is_published}
                      onChange={e => setNewsForm({ ...newsForm, is_published: e.target.checked })}
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

        {/* ── GALLERY ── */}
        {tab === 'gallery' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Gallery Item */}
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <h2 className="font-display text-lg text-brand-dark mb-5">Upload Gallery Item</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setUploadingGallery(true);
                try {
                  const formData = new FormData();
                  formData.append('title', galleryForm.title);
                  formData.append('description', galleryForm.description);
                  formData.append('category', galleryForm.category);
                  formData.append('is_featured', galleryForm.is_featured.toString());
                  formData.append('display_order', galleryForm.display_order.toString());
                  if (galleryImage) formData.append('image', galleryImage);

                  await galleryApi.create(formData);
                  toast.success('Gallery item uploaded successfully!');
                  setGalleryImage(null);
                  setGalleryForm({ title: '', description: '', category: 'GENERAL', is_featured: false, display_order: 0 });
                  galleryApi.getAll().then(r => setGallery(r.data?.items || []));
                } catch (e: any) {
                  toast.error(e?.response?.data?.error || 'Failed to upload gallery item');
                } finally {
                  setUploadingGallery(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Title *</label>
                  <input
                    type="text"
                    required
                    value={galleryForm.title}
                    onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Description</label>
                  <textarea
                    value={galleryForm.description}
                    onChange={e => setGalleryForm({ ...galleryForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Category *</label>
                  <select
                    required
                    value={galleryForm.category}
                    onChange={e => setGalleryForm({ ...galleryForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                  >
                    <option value="GENERAL">General</option>
                    <option value="EVENTS">Events</option>
                    <option value="FACILITIES">Facilities</option>
                    <option value="STUDENTS">Students</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={galleryForm.is_featured}
                      onChange={e => setGalleryForm({ ...galleryForm, is_featured: e.target.checked })}
                      className="w-4 h-4 rounded border-stone/25"
                    />
                    <span className="text-sm text-brand-dark">Featured</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={galleryForm.display_order}
                    onChange={e => setGalleryForm({ ...galleryForm, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Image *</label>
                  <label className="block w-full border-2 border-dashed border-brand/30 rounded-xl p-6 text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition">
                    <input type="file" accept="image/*" className="hidden" onChange={e => setGalleryImage(e.target.files?.[0] || null)} />
                    <div className="text-3xl mb-2">🖼️</div>
                    <div className="text-sm font-medium text-brand-dark">{galleryImage ? galleryImage.name : 'Click to upload image'}</div>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={uploadingGallery}
                  className="w-full px-4 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
                >
                  {uploadingGallery ? 'Uploading…' : 'Upload Gallery Item'}
                </button>
              </form>
            </div>

            {/* Gallery List */}
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <h2 className="font-display text-lg text-brand-dark mb-5">Gallery Items</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {gallery.length === 0 ? (
                  <p className="text-stone text-center py-8">No gallery items yet</p>
                ) : (
                  gallery.map(g => (
                    <div key={g.id} className="flex items-center justify-between p-4 bg-cream-deep/50 rounded-xl border border-stone/10">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <img src={g.image_url} alt={g.title} className="w-16 h-16 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-brand-dark truncate">{g.title}</div>
                          <div className="text-sm text-stone">{g.category} {g.is_featured && '• Featured'}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => galleryApi.toggleFeatured(g.id).then(() => galleryApi.getAll().then(r => setGallery(r.data?.items || [])))}
                          className="px-3 py-1 rounded-lg bg-yellow-100 text-yellow-800 text-sm hover:bg-yellow-200 transition"
                        >
                          {g.is_featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          onClick={() => {
                            toast('Delete this gallery item?', {
                              action: {
                                label: 'Delete',
                                onClick: async () => {
                                  try {
                                    await galleryApi.delete(g.id);
                                    setGallery(prev => prev.filter(item => item.id !== g.id));
                                    toast.success('Gallery item deleted successfully');
                                  } catch (e: any) {
                                    toast.error(e?.response?.data?.error || 'Failed to delete');
                                  }
                                },
                              },
                              cancel: { label: 'Cancel', onClick: () => { } },
                            });
                          }}
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

        {/* ── BILLING ── */}
        {tab === 'billing' && <BillingTab />}

        {/* ── REQUISITIONS ── */}
        {tab === 'requisitions' && <RequisitionsTab />}

        {/* ── TERM PROGRESSION ── */}
        {tab === 'term-progression' && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Admit Student to Term */}
              <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
                <h2 className="font-display text-lg text-brand-dark mb-5">Admit Student to New Term</h2>

                {/* Promotion warning when level changes */}
                {progressionForm.new_level && (() => {
                  const sel = availableStudents.find((s: any) => s.id === progressionForm.student_id);
                  return sel && progressionForm.new_level !== sel.level ? (
                    <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                      <span className="font-bold">⚠️ Level promotion detected.</span> A new admission number will be auto-generated
                      ({sel.admission_no?.split('/').map((p: string, i: number) => i === 1 ? progressionForm.new_level : p).join('/')}).
                      The current number <span className="font-mono font-bold">{sel.admission_no}</span> is preserved in promotion history.
                    </div>
                  ) : null;
                })()}

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const response = await termProgressionApi.admitToTerm({
                      student_id: progressionForm.student_id,
                      new_term_id: progressionForm.new_term_id,
                      new_level: progressionForm.new_level || undefined,
                      // intake and year only apply when the level changes (a new stage)
                      new_intake: progressionForm.new_level ? progressionForm.new_intake || undefined : undefined,
                      new_year: progressionForm.new_level && progressionForm.new_year ? parseInt(progressionForm.new_year) : undefined,
                      notes: progressionForm.notes,
                    });
                    const newAdmNo = response.data?.progression?.new_admission_no;
                    if (newAdmNo) {
                      toast.success(`✅ Student promoted! New admission number: ${newAdmNo}`);
                    } else {
                      toast.success('Student admitted to new term successfully!');
                    }
                    setProgressionForm({ student_id: '', new_term_id: '', new_level: '', new_intake: '', new_year: '', notes: '' });
                    // Refresh promotion history
                    termProgressionApi.getAllPromotions()
                      .then(r => setPromotionHistory(r.data?.progressions || []))
                      .catch(() => { });
                  } catch (e: any) {
                    toast.error(e?.response?.data?.error || 'Failed to admit student');
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Student *</label>
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm mb-2"
                      placeholder="Search by admission no or name..."
                    />
                    <select
                      required
                      value={progressionForm.student_id}
                      onChange={e => setProgressionForm(withStageDefaults({ ...progressionForm, student_id: e.target.value, new_intake: '', new_year: '' }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    >
                      <option value="">Select a student</option>
                      {availableStudents
                        .filter((student: any) => {
                          const searchLower = studentSearch.toLowerCase();
                          return (
                            student.admission_no?.toLowerCase().includes(searchLower) ||
                            student.application?.surname?.toLowerCase().includes(searchLower) ||
                            student.application?.other_names?.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((student: any) => (
                          <option key={student.id} value={student.id}>
                            {student.admission_no} - {student.application?.surname} {student.application?.other_names} ({student.level})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">New Term *</label>
                    <select
                      required
                      value={progressionForm.new_term_id}
                      onChange={e => setProgressionForm(withStageDefaults({ ...progressionForm, new_term_id: e.target.value, new_intake: '', new_year: '' }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    >
                      <option value="">Select a term</option>
                      {availableTerms.map((term: any) => (
                        <option key={term.id} value={term.id}>{termLabel(term)}</option>
                      ))}
                    </select>
                    <TermInfo term={availableTerms.find((t: any) => t.id === progressionForm.new_term_id)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                      New Level <span className="text-stone font-normal">(leave blank to keep current level)</span>
                    </label>
                    <select
                      value={progressionForm.new_level}
                      onChange={e => setProgressionForm(withStageDefaults({ ...progressionForm, new_level: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    >
                      <option value="">— No level change —</option>
                      {['L3', 'L4', 'L5', 'L6'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  {progressionForm.new_level && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-brand-dark mb-1.5">Intake for the new level</label>
                        <select
                          value={progressionForm.new_intake}
                          onChange={e => setProgressionForm({ ...progressionForm, new_intake: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                        >
                          <option value="">Same as current</option>
                          <option value="JANUARY">January</option>
                          <option value="MAY">May</option>
                          <option value="SEPTEMBER">September</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-brand-dark mb-1.5">Year</label>
                        <input
                          type="number"
                          value={progressionForm.new_year}
                          onChange={e => setProgressionForm({ ...progressionForm, new_year: e.target.value })}
                          placeholder="e.g. 2026"
                          className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                        />
                      </div>
                      <p className="col-span-2 text-xs text-stone -mt-2">
                        The new admission number uses this intake and year. The previous level, admission number, intake and dates are kept in the student&apos;s history.
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Notes</label>
                    <textarea
                      value={progressionForm.notes}
                      onChange={e => setProgressionForm({ ...progressionForm, notes: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                      rows={2}
                      placeholder="Optional notes about this progression"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition"
                  >
                    Admit Student
                  </button>
                </form>
              </div>

              {/* Student Balances Lookup */}
              <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
                <h2 className="font-display text-lg text-brand-dark mb-5">View Student Balances</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Search Student</label>
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm mb-2"
                      placeholder="Search by admission no or name..."
                    />
                    <select
                      value={lookupStudentId}
                      onChange={async (e) => {
                        const id = e.target.value;
                        setLookupStudentId(id);
                        if (!id) { setStudentBalances([]); return; }
                        try {
                          const response = await termProgressionApi.getBalances(id);
                          setStudentBalances(response.data || []);
                        } catch (err: any) {
                          toast.error(err?.response?.data?.error || 'Failed to fetch balances');
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    >
                      <option value="">Select a student</option>
                      {availableStudents
                        .filter((s: any) => {
                          const q = studentSearch.toLowerCase();
                          return (
                            s.admission_no?.toLowerCase().includes(q) ||
                            s.application?.surname?.toLowerCase().includes(q) ||
                            s.application?.other_names?.toLowerCase().includes(q)
                          );
                        })
                        .map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.admission_no} — {s.application?.surname} {s.application?.other_names}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {studentBalances.length === 0 ? (
                      <p className="text-stone text-center py-8">No balances found</p>
                    ) : (
                      studentBalances.map((balance: any) => (
                        <div key={balance.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10">
                          <div className="font-semibold text-brand-dark">{balance.term?.name} ({balance.term?.academic_year})</div>
                          <div className="text-sm text-stone mt-1">Level: {balance.level}</div>
                          <div className="text-sm text-stone">Total Fees: KES {balance.total_fees.toLocaleString()}</div>
                          <div className="text-sm text-stone">Amount Paid: KES {balance.amount_paid.toLocaleString()}</div>
                          <div className={`text-sm font-semibold ${balance.balance > 0 ? 'text-red-600' : balance.balance < 0 ? 'text-green-600' : 'text-brand-dark'}`}>
                            Balance: KES {balance.balance.toLocaleString()}
                          </div>
                          {balance.previous_balance_carryover !== 0 && (
                            <div className="text-xs text-stone mt-2">
                              Carry-over: KES {balance.previous_balance_carryover.toLocaleString()}
                              {balance.carryover_notes && ` (${balance.carryover_notes})`}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Promotion History ── */}
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg text-brand-dark">📈 Level Promotion History</h2>
                <div className="flex gap-3">
                  <select
                    value={promotionHistoryFilter.level}
                    onChange={e => {
                      const f = { ...promotionHistoryFilter, level: e.target.value };
                      setPromotionHistoryFilter(f);
                      setPromotionHistoryLoading(true);
                      termProgressionApi.getAllPromotions({ level: f.level, academic_year: f.academic_year })
                        .then(r => setPromotionHistory(r.data?.progressions || []))
                        .catch(() => { })
                        .finally(() => setPromotionHistoryLoading(false));
                    }}
                    className="px-3 py-2 rounded-lg border border-stone/25 text-sm bg-white"
                  >
                    <option value="">All Levels</option>
                    {['L3', 'L4', 'L5', 'L6'].map(l => <option key={l} value={l}>Promoted to {l}</option>)}
                  </select>
                  <input
                    type="text"
                    value={promotionHistoryFilter.academic_year}
                    onChange={e => {
                      const f = { ...promotionHistoryFilter, academic_year: e.target.value };
                      setPromotionHistoryFilter(f);
                    }}
                    onBlur={() => {
                      setPromotionHistoryLoading(true);
                      termProgressionApi.getAllPromotions(promotionHistoryFilter)
                        .then(r => setPromotionHistory(r.data?.progressions || []))
                        .catch(() => { })
                        .finally(() => setPromotionHistoryLoading(false));
                    }}
                    placeholder="Academic year e.g. 2026"
                    className="px-3 py-2 rounded-lg border border-stone/25 text-sm bg-white w-44"
                  />
                </div>
              </div>

              {promotionHistoryLoading ? (
                <div className="text-center py-12 text-stone">Loading promotions...</div>
              ) : promotionHistory.length === 0 ? (
                <div className="text-center py-12 text-stone">No level promotions recorded yet.</div>
              ) : (
                <div className="space-y-0">
                  {promotionHistory.map((p: any, idx: number) => (
                    <div key={p.id} className="flex gap-4 relative">
                      {/* Timeline line */}
                      {idx < promotionHistory.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-brand/20" />
                      )}
                      {/* Dot */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand/10 border-2 border-brand flex items-center justify-center text-brand font-bold text-xs mt-1">
                        {p.to_level}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="bg-cream-deep/40 rounded-xl p-4 border border-stone/10">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="font-semibold text-brand-dark">
                              {p.student?.application?.surname} {p.student?.application?.other_names}
                            </div>
                            <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full font-medium">
                              {p.term?.name} · {p.academic_year}
                            </span>
                          </div>
                          <div className="text-sm text-stone mb-2">
                            {p.student?.course?.name} · {p.student?.department?.name}
                          </div>

                          {/* Admission number change */}
                          {p.old_admission_no && p.new_admission_no ? (
                            <div className="flex items-center gap-2 flex-wrap mt-2">
                              <span className="font-mono text-xs bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded line-through">{p.old_admission_no}</span>
                              <span className="text-stone text-xs">→</span>
                              <span className="font-mono text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded font-bold">{p.new_admission_no}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-stone mt-1 font-mono">{p.student?.admission_no}</div>
                          )}

                          {(p.from_intake || p.to_intake) && (
                            <div className="text-xs text-stone mt-2">
                              Intake: <strong className="text-brand-dark">{p.from_intake ? `${p.from_intake.charAt(0)}${p.from_intake.slice(1).toLowerCase()} ${p.from_year ?? ''}` : '—'} → {p.to_intake ? `${p.to_intake.charAt(0)}${p.to_intake.slice(1).toLowerCase()} ${p.to_year ?? ''}` : '—'}</strong>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4 mt-3 text-xs text-stone">
                            {p.kind && p.kind !== 'PROMOTION' && <span className="px-2 py-0.5 rounded-full bg-cream-deep font-medium">{p.kind === 'RE_ADMISSION' ? 'Re-admitted' : p.kind === 'LINKED' ? 'Records linked' : p.kind}</span>}
                            <button type="button" onClick={() => setHistoryFor(p.student)} className="text-brand hover:underline font-medium">Full history</button>
                            <span>Level: <strong className="text-brand-dark">{p.from_level || '—'} → {p.to_level}</strong></span>
                            <span>Fees cleared: <strong className={p.fee_clearance ? 'text-green-600' : 'text-red-500'}>{p.fee_clearance ? 'Yes' : 'No'}</strong></span>
                            <span>Promoted by: <strong className="text-brand-dark">{p.promoter?.email}</strong></span>
                            <span>{new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                          {p.notes && <div className="mt-2 text-xs text-stone italic">{p.notes}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {historyFor && <StudentHistoryModal student={historyFor} onClose={() => setHistoryFor(null)} />}

      {/* Returning student prompt */}
      {existingMatches && (
        <div className="fixed inset-0 bg-brand-dark/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl my-auto">
            <h2 className="font-display text-xl text-brand-dark mb-1">Is this a returning student?</h2>
            <p className="text-sm text-stone mb-4">
              This applicant matches {existingMatches.matches.length === 1 ? 'an existing student' : 'existing students'}. Continue their record to keep one history
              (a new admission number is generated, the earlier one is kept in their history), or confirm they are a new student.
            </p>
            <div className="space-y-3 mb-5 max-h-72 overflow-y-auto">
              {existingMatches.matches.map((m: any) => (
                <div key={m.id} className="border border-stone/15 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs text-brand">{m.admission_no}</div>
                      <div className="font-medium text-brand-dark text-sm">{m.name}</div>
                      <div className="text-xs text-stone">{m.level} · {m.intake} {m.year} · {m.course} · {m.status}</div>
                      <div className="text-[11px] text-green-700 mt-1">{m.match_reasons.join(' · ')}</div>
                    </div>
                    <button
                      disabled={!!approving}
                      onClick={() => handleStatus(existingMatches.appId, 'APPROVED', { continue_student_id: m.id })}
                      className="shrink-0 text-xs px-3 py-2 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
                    >
                      Continue this student
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                disabled={!!approving}
                onClick={() => handleStatus(existingMatches.appId, 'APPROVED', { create_new: true })}
                className="flex-1 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition text-sm disabled:opacity-50"
              >
                No — create a new student
              </button>
              <button onClick={() => setExistingMatches(null)} className="px-5 py-2.5 rounded-xl text-stone hover:text-brand-dark transition text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

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

                <div className="col-span-2 mt-3 font-semibold text-brand-dark border-b border-stone/10 pb-1">Personal Information (Editable)</div>
                <div className="text-stone">Surname:</div>
                <input
                  type="text"
                  value={editableAppData?.surname || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, surname: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">Other Names:</div>
                <input
                  type="text"
                  value={editableAppData?.other_names || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, other_names: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">Email:</div>
                <input
                  type="email"
                  value={editableAppData?.email || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, email: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">Phone:</div>
                <input
                  type="text"
                  value={editableAppData?.phone || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, phone: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">Address:</div>
                <input
                  type="text"
                  value={editableAppData?.address || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, address: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">Gender:</div>
                <select
                  value={editableAppData?.gender || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, gender: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <div className="text-stone">Date of Birth:</div>
                <input
                  type="date"
                  value={editableAppData?.date_of_birth
                    ? new Date(editableAppData.date_of_birth).toISOString().split('T')[0]
                    : ''}
                  onChange={e => setEditableAppData({ ...editableAppData, date_of_birth: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />

                <div className="col-span-2 mt-3 font-semibold text-brand-dark border-b border-stone/10 pb-1">Academic Info (Editable)</div>
                <div className="text-stone">Previous School:</div>
                <input
                  type="text"
                  value={editableAppData?.previous_school || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, previous_school: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">KCPE Index:</div>
                <input
                  type="text"
                  value={editableAppData?.kcpe_index || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, kcpe_index: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">KCPE Marks:</div>
                <input
                  type="text"
                  value={editableAppData?.kcpe_marks || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, kcpe_marks: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">KCSE Index:</div>
                <input
                  type="text"
                  value={editableAppData?.kcse_index || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, kcse_index: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">KCSE Grade:</div>
                <input
                  type="text"
                  value={editableAppData?.kcse_grade || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, kcse_grade: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />

                <div className="col-span-2 mt-3 font-semibold text-brand-dark border-b border-stone/10 pb-1">Parent & Emergency Info (Editable)</div>
                <div className="text-stone">Parent Name:</div>
                <input
                  type="text"
                  value={editableAppData?.parent_names || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, parent_names: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">Parent Relationship:</div>
                <input
                  type="text"
                  value={editableAppData?.parent_relationship || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, parent_relationship: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">Parent Phone:</div>
                <input
                  type="text"
                  value={editableAppData?.parent_phone || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, parent_phone: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">Parent Email:</div>
                <input
                  type="email"
                  value={editableAppData?.parent_email || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, parent_email: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">Emergency Contact:</div>
                <input
                  type="text"
                  value={editableAppData?.emergency_person || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, emergency_person: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">Emergency Phone:</div>
                <input
                  type="text"
                  value={editableAppData?.emergency_phone || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, emergency_phone: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">Medical Conditions:</div>
                <input
                  type="text"
                  value={editableAppData?.medical_conditions || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, medical_conditions: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />
                <div className="text-stone">Disability:</div>
                <input
                  type="text"
                  value={editableAppData?.disability || ''}
                  onChange={e => setEditableAppData({ ...editableAppData, disability: e.target.value })}
                  className="px-2 py-1 rounded border border-stone/25 text-xs focus:outline-none focus:border-brand"
                />

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
                      <input type="file" accept=".pdf,image/*" onChange={e => setAppDocFiles({ ...appDocFiles, doc_kcpe: e.target.files?.[0] || null })} className="hidden" />
                      <span className="px-2 py-1 bg-brand/10 text-brand rounded cursor-pointer hover:bg-brand/20">📄 KCPE</span>
                      {appDocFiles.doc_kcpe && <span className="text-xs text-green-600">✓</span>}
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="file" accept=".pdf,image/*" onChange={e => setAppDocFiles({ ...appDocFiles, doc_kcse: e.target.files?.[0] || null })} className="hidden" />
                      <span className="px-2 py-1 bg-brand/10 text-brand rounded cursor-pointer hover:bg-brand/20">📄 KCSE</span>
                      {appDocFiles.doc_kcse && <span className="text-xs text-green-600">✓</span>}
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="file" accept=".pdf,image/*" onChange={e => setAppDocFiles({ ...appDocFiles, doc_id_copy: e.target.files?.[0] || null })} className="hidden" />
                      <span className="px-2 py-1 bg-brand/10 text-brand rounded cursor-pointer hover:bg-brand/20">📄 ID Copy</span>
                      {appDocFiles.doc_id_copy && <span className="text-xs text-green-600">✓</span>}
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="file" accept=".pdf,image/*" onChange={e => setAppDocFiles({ ...appDocFiles, doc_birth_cert: e.target.files?.[0] || null })} className="hidden" />
                      <span className="px-2 py-1 bg-brand/10 text-brand rounded cursor-pointer hover:bg-brand/20">📄 Birth Cert</span>
                      {appDocFiles.doc_birth_cert && <span className="text-xs text-green-600">✓</span>}
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="file" accept=".pdf,image/*" onChange={e => setAppDocFiles({ ...appDocFiles, doc_medical: e.target.files?.[0] || null })} className="hidden" />
                      <span className="px-2 py-1 bg-brand/10 text-brand rounded cursor-pointer hover:bg-brand/20">📄 Medical</span>
                      {appDocFiles.doc_medical && <span className="text-xs text-green-600">✓</span>}
                    </label>
                  </div>
                  <button onClick={handleAppDocUpload} disabled={uploadingAppDocs}
                    className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                    {uploadingAppDocs ? 'Saving…' : 'Save Changes & Upload Documents'}
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

      {tab === 'doc-templates' && (
        <DocTemplatesTab />
      )}

      {tab === 'settings' && <SystemSettingsTab />}
    </div>
  );
}

function StudentsTab({ feeTypes }: { feeTypes: any[] }) {
  const isAdmin = useAuth().user?.role === 'ADMIN';
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
    kcse_certificate: null as File | null,
    birth_certificate: null as File | null,
    other_documents: null as File | null,
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [currentCsvFile, setCurrentCsvFile] = useState<File | null>(null);
  const [importingCurrent, setImportingCurrent] = useState(false);
  const [importCurrentResult, setImportCurrentResult] = useState<any>(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeSummary, setFeeSummary] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState('');
  const [selectedPaymentTermId, setSelectedPaymentTermId] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [terms, setTerms] = useState<any[]>([]);
  const [showTermAssignModal, setShowTermAssignModal] = useState(false);
  const [assigningTerm, setAssigningTerm] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showBulkTermModal, setShowBulkTermModal] = useState(false);
  const [bulkTermId, setBulkTermId] = useState('');
  const [assigningBulkTerm, setAssigningBulkTerm] = useState(false);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [bulkPaymentAmount, setBulkPaymentAmount] = useState('');
  const [bulkPaymentFeeTypeId, setBulkPaymentFeeTypeId] = useState('');
  const [bulkPaymentTermId, setBulkPaymentTermId] = useState('');
  const [recordingBulkPayment, setRecordingBulkPayment] = useState(false);
  const [downloadingIDCard, setDownloadingIDCard] = useState<string | null>(null);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [showReports, setShowReports] = useState(false);
  const [docsStudent, setDocsStudent] = useState<any>(null);
  const [historyStudent, setHistoryStudent] = useState<any>(null);
  const [linkStudent, setLinkStudent] = useState<any>(null);
  const [showBulkDocs, setShowBulkDocs] = useState(false);

  const refreshStudents = () =>
    studentsApi.getAll({ page, limit: 15, search }).then(r => { setStudents(r.data.students); setTotal(r.data.pagination.total); }).catch(() => { });

  useEffect(() => {
    studentsApi.getAll({ page, limit: 15, search })
      .then(r => { setStudents(r.data.students); setTotal(r.data.pagination.total); })
      .catch(() => { });
  }, [page, search]);

  useEffect(() => {
    api.get('/terms').then(r => setTerms(r.data.terms || [])).catch(() => { });
    api.get('/courses').then(r => setCoursesList(r.data.courses || r.data || [])).catch(() => { });
  }, []);

  const handleDownloadIDCard = async (studentId: string) => {
    setDownloadingIDCard(studentId);
    try {
      const response = await api.get(`/students/${studentId}/id-card`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ID-${studentId}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to download ID card. Student must have a profile picture with white background.');
    } finally {
      setDownloadingIDCard(null);
    }
  };

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
      toast.error(e?.response?.data?.error || 'Import failed');
    } finally { setImporting(false); }
  };

  const handleCurrentStudentsImport = async () => {
    if (!currentCsvFile) return;
    setImportingCurrent(true);
    try {
      const formData = new FormData();
      formData.append('csv_file', currentCsvFile);
      const r = await api.post('/students/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportCurrentResult(r.data);
      const updated = await studentsApi.getAll({ page, limit: 15, search });
      setStudents(updated.data.students);
      setTotal(updated.data.pagination.total);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Current students import failed');
    } finally { setImportingCurrent(false); }
  };

  const handleViewFeeSummary = async (studentId: string) => {
    try {
      const r = await api.get(`/fees/students/${studentId}/summary`);
      setFeeSummary(r.data);
      setShowFeeModal(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to fetch fee summary');
    }
  };

  const handleRecordPayment = async (studentId: string, termId: string) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.warning('Please enter a valid payment amount');
      return;
    }
    if (!selectedPaymentTermId) {
      toast.warning('Please select a term to pay');
      return;
    }
    setRecordingPayment(true);
    try {
      await api.post(`/fees/students/${studentId}/terms/${selectedPaymentTermId}/payment`, {
        amount: parseFloat(paymentAmount),
        notes: paymentNotes,
      });
      toast.success('Payment recorded successfully');
      setPaymentAmount('');
      setPaymentNotes('');
      setSelectedFeeTypeId('');
      setSelectedPaymentTermId('');
      handleViewFeeSummary(studentId);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };


  // ── Delete student + Duplicates ──────────────────────────────────────
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const handleFindDuplicates = async () => {
    setLoadingDuplicates(true);
    try {
      const res = await api.get('/students/duplicates');
      setDuplicates(res.data.duplicates || []);
      setShowDuplicates(true);
      if (res.data.duplicates.length === 0) toast.success('No duplicates found! Database is clean.');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to fetch duplicates');
    } finally {
      setLoadingDuplicates(false);
    }
  };

  // Same person registered more than once: keep one record and fold the others into its history
  const handleMergeDuplicates = (group: any, keepId: string) => {
    const others = group.students.filter((x: any) => x.id !== keepId);
    toast(`Keep this record and link ${others.length} other${others.length === 1 ? '' : 's'} into its history? Only do this if they are the same person. This can't be undone.`, {
      duration: 15000,
      action: {
        label: 'Link records',
        onClick: async () => {
          try {
            for (const o of others) await studentsApi.merge(keepId, o.id);
            toast.success('Records linked into one student history');
            await refreshStudents();
            handleFindDuplicates();
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to link records');
          }
        },
      },
    });
  };

  const handleDeleteStudent = (student: any) => {
    const name = `${student.application?.surname || ''} ${student.application?.other_names || ''}`.trim();
    toast(`Permanently delete ${name} (${student.admission_no}) and all linked records? This cannot be undone.`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await api.delete(`/students/${student.id}`);
            toast.success(`${name} deleted successfully.`);
            const updated = await studentsApi.getAll({ page, limit: 15, search });
            setStudents(updated.data.students);
            if (showDuplicates) handleFindDuplicates();
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to delete student');
          }
        },
      },
    });
  };

  const handleAssignTerm = async () => {
    if (!selectedTermId) {
      toast.warning('Please select a term');
      return;
    }
    setAssigningTerm(true);
    try {
      await api.post(`/students/${selectedStudent.id}/term/${selectedTermId}`);
      toast.success('Term assigned successfully!');
      setShowTermAssignModal(false);
      setSelectedTermId('');
      const updated = await studentsApi.getAll({ page, limit: 15, search });
      setStudents(updated.data.students);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to assign term');
    } finally {
      setAssigningTerm(false);
    }
  };

  const handleBulkAssignTerm = async () => {
    if (selectedStudentIds.length === 0) {
      toast.warning('Please select at least one student');
      return;
    }
    if (!bulkTermId) {
      toast.warning('Please select a term');
      return;
    }
    setAssigningBulkTerm(true);
    try {
      const r = await api.post('/students/bulk-assign-term', { studentIds: selectedStudentIds, termId: bulkTermId });
      toast.success(`Bulk assignment completed: ${r.data.summary.successful} successful, ${r.data.summary.failed} failed`);
      if (r.data.errors.length > 0) {
        console.error('Bulk assignment errors:', r.data.errors);
      }
      setShowBulkTermModal(false);
      setSelectedStudentIds([]);
      setBulkTermId('');
      const updated = await studentsApi.getAll({ page, limit: 15, search });
      setStudents(updated.data.students);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to bulk assign term');
    } finally {
      setAssigningBulkTerm(false);
    }
  };

  const handleBulkRecordPayment = async () => {
    if (selectedStudentIds.length === 0) {
      toast.warning('Please select at least one student');
      return;
    }
    if (!bulkPaymentAmount || parseFloat(bulkPaymentAmount) <= 0) {
      toast.warning('Please enter a valid payment amount');
      return;
    }
    if (!bulkPaymentFeeTypeId) {
      toast.warning('Please select a fee type');
      return;
    }
    if (!bulkPaymentTermId) {
      toast.warning('Please select a term');
      return;
    }
    setRecordingBulkPayment(true);
    try {
      const payments = selectedStudentIds.map(studentId => ({
        studentId,
        termId: bulkPaymentTermId,
        amount: parseFloat(bulkPaymentAmount),
        fee_type_id: bulkPaymentFeeTypeId,
        notes: 'Bulk payment',
      }));
      const r = await api.post('/fees/bulk-record-payment', { payments });
      toast.success(`Bulk payment completed: ${r.data.summary.successful} successful, ${r.data.summary.failed} failed`);
      if (r.data.errors.length > 0) {
        console.error('Bulk payment errors:', r.data.errors);
      }
      setShowBulkPaymentModal(false);
      setBulkPaymentAmount('');
      setBulkPaymentFeeTypeId('');
      setBulkPaymentTermId('');
      setSelectedStudentIds([]);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to record bulk payment');
    } finally {
      setRecordingBulkPayment(false);
    }
  };

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setEditForm({
      // Academic — Admin-only fields
      admission_no: student.admission_no || '',
      course_id: student.course_id || '',
      department_id: student.department_id || '',
      level: student.level || '',
      intake: student.intake || '',
      year: student.year || '',
      status: student.status || '',
      // Contact
      phone: student.application?.phone || '',
      address: student.application?.address || '',
      id_number: student.application?.id_number || '',
      // Family
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
      if (docFiles.kcse_certificate) formData.append('kcse_certificate', docFiles.kcse_certificate);
      if (docFiles.birth_certificate) formData.append('birth_certificate', docFiles.birth_certificate);
      if (docFiles.other_documents) formData.append('other_documents', docFiles.other_documents);

      if (formData.has('id_copy_front') || formData.has('id_copy_back') ||
        formData.has('parent_id_copy_front') || formData.has('parent_id_copy_back') ||
        formData.has('kcse_certificate') ||
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
        kcse_certificate: null,
        birth_certificate: null,
        other_documents: null
      });
      toast.success('Student profile updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update student profile');
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
          {selectedStudentIds.length > 0 && (
            <>
              <button
                onClick={() => setShowBulkTermModal(true)}
                className="px-4 py-2 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition text-sm"
              >
                Assign Term ({selectedStudentIds.length})
              </button>
              <button
                onClick={() => setShowBulkDocs(true)}
                className="px-4 py-2 rounded-xl bg-terracotta text-white font-semibold hover:opacity-90 transition text-sm"
              >
                Issue Documents ({selectedStudentIds.length})
              </button>
              {isAdmin && <button
                onClick={() => setShowBulkPaymentModal(true)}
                className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition text-sm"
              >
                Record Payment ({selectedStudentIds.length})
              </button>}
            </>
          )}
          <button
            onClick={() => setShowReports(true)}
            className="px-4 py-2 rounded-xl bg-gold text-brand-dark font-semibold hover:opacity-90 transition text-sm"
          >
            ⬇ Download Reports
          </button>
          <button
            onClick={handleFindDuplicates}
            disabled={loadingDuplicates}
            className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 font-semibold hover:bg-red-100 transition text-sm disabled:opacity-50"
          >
            {loadingDuplicates ? 'Scanning…' : '🔍 Find Duplicates'}
          </button>
        </div>
      </div>

      {historyStudent && <StudentHistoryModal student={historyStudent} onClose={() => setHistoryStudent(null)} />}
      {linkStudent && <LinkRecordModal student={linkStudent} onClose={() => setLinkStudent(null)} onDone={() => { refreshStudents(); setShowDuplicates(false); }} />}
      {docsStudent && <StudentDocumentsModal student={docsStudent} onClose={() => setDocsStudent(null)} onChanged={refreshStudents} />}
      {showBulkDocs && <BulkIssueDocumentsModal studentIds={selectedStudentIds} onClose={() => setShowBulkDocs(false)} onDone={refreshStudents} />}
      {showReports && <ReportsExport onClose={() => setShowReports(false)} types={isAdmin ? ['fees', 'students'] : ['students']} initialType="students" hideFinance={!isAdmin} />}

      {/* Duplicates Panel */}
      {showDuplicates && duplicates.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base text-red-800 font-semibold">⚠️ {duplicates.length} Duplicate Group(s) Found</h3>
            <button onClick={() => setShowDuplicates(false)} className="text-xs text-red-600 hover:text-red-800">Dismiss</button>
          </div>
          <div className="space-y-4">
            {duplicates.map((group: any, gi: number) => (
              <div key={gi} className="bg-white rounded-xl border border-red-200 overflow-hidden">
                <div className="px-4 py-2 bg-red-100 text-red-800 text-sm font-semibold">{group.name} — {group.count} records</div>
                <table className="w-full text-xs">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-stone">Admission No</th>
                      <th className="px-3 py-2 text-left text-stone">Course</th>
                      <th className="px-3 py-2 text-left text-stone">Level</th>
                      <th className="px-3 py-2 text-left text-stone">Intake</th>
                      <th className="px-3 py-2 text-left text-stone">Created</th>
                      <th className="px-3 py-2 text-left text-stone">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.students.map((s: any) => (
                      <tr key={s.id} className="border-t border-red-100">
                        <td className="px-3 py-2 font-mono text-brand">{s.admission_no}</td>
                        <td className="px-3 py-2">{s.course}</td>
                        <td className="px-3 py-2">{s.level}</td>
                        <td className="px-3 py-2">{s.intake}</td>
                        <td className="px-3 py-2">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="px-3 py-2 space-x-3">
                          <button
                            onClick={() => handleMergeDuplicates(group, s.id)}
                            className="text-brand hover:text-brand-dark font-semibold transition"
                            title="Keep this record and link the others into its history"
                          >Keep &amp; link others</button>
                          {isAdmin && <button
                            onClick={() => handleDeleteStudent(students.find((st: any) => st.id === s.id) || s)}
                            className="text-red-600 hover:text-red-800 font-semibold transition"
                          >Delete</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Imports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* KUCCPS Import */}
        <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
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

        {/* Current Students Import */}
        <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
          <h2 className="font-display text-lg text-brand-dark mb-2">Current Students Import</h2>
          <p className="text-sm text-stone mb-4">Upload a CSV with columns: admission_no, surname, other_names, course, level</p>
          <label className="block w-full border-2 border-dashed border-brand/30 rounded-xl p-6 text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition">
            <input type="file" accept=".csv" className="hidden" onChange={e => setCurrentCsvFile(e.target.files?.[0] || null)} />
            <div className="text-3xl mb-2">📄</div>
            <div className="text-sm font-medium text-brand-dark">{currentCsvFile ? currentCsvFile.name : 'Click to upload CSV'}</div>
          </label>
          <button onClick={handleCurrentStudentsImport} disabled={!currentCsvFile || importingCurrent}
            className="mt-4 w-full px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50">
            {importingCurrent ? 'Importing…' : 'Import Current Students'}
          </button>
          {importCurrentResult && (
            <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm max-h-48 overflow-y-auto">
              <div className="font-semibold text-blue-800">Processed: {importCurrentResult.summary?.total}</div>
              <div className="text-green-700">Successful: {importCurrentResult.summary?.successful}</div>
              <div className="text-red-600">Failed: {importCurrentResult.summary?.failed}</div>
              {importCurrentResult.errors && importCurrentResult.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-700">
                  <div className="font-semibold mb-1">Errors:</div>
                  <ul className="list-disc pl-4">
                    {importCurrentResult.errors.map((err: any, i: number) => (
                      <li key={i}>Row {err.rowNumber}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.length === students.length && students.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudentIds(students.map(s => s.id));
                      } else {
                        setSelectedStudentIds([]);
                      }
                    }}
                    className="rounded border-stone/25"
                  />
                </th>
                <th className="px-4 py-3 text-left">Admission No.</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Level</th>
                <th className="px-4 py-3 text-left">Intake</th>
                <th className="px-4 py-3 text-left">Current Term</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Documents</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/10">
              {students.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-stone">No students enrolled yet</td></tr>}
              {students.map(s => (
                <tr key={s.id} className="hover:bg-cream-deep/50 transition">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIds([...selectedStudentIds, s.id]);
                        } else {
                          setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.id));
                        }
                      }}
                      className="rounded border-stone/25"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-brand">{s.admission_no}</td>
                  <td className="px-4 py-3 font-medium text-brand-dark">{s.application?.surname} {s.application?.other_names}</td>
                  <td className="px-4 py-3 text-stone text-xs">{s.course?.name}</td>
                  <td className="px-4 py-3 text-stone">{s.level}</td>
                  <td className="px-4 py-3 text-stone">{s.intake} {s.year}</td>
                  <td className="px-4 py-3 text-stone text-xs">{s.current_term ? `${s.current_term.name} (${s.current_term.academic_year})` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-stone/20 text-stone'}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      // Admission letters made before the documents feature still count as issued
                      const issued = (s.documents?.length || 0) + (s.admission_letter && !s.documents?.some((d: any) => d.document_type === 'ADMISSION_LETTER') ? 1 : 0);
                      return (
                        <button onClick={() => setDocsStudent(s)} className={`text-xs hover:underline ${issued >= 4 ? 'text-green-700' : 'text-terracotta'}`}>
                          {issued >= 4 ? '✓ All issued' : issued > 0 ? `${issued}/4 issued` : 'Issue'}
                        </button>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditStudent(s)} className="text-brand hover:text-brand-dark font-medium text-xs transition">Edit</button>
                      <button onClick={() => setHistoryStudent(s)} className="text-purple-700 hover:text-purple-900 font-medium text-xs transition">History</button>
                      <button onClick={() => setLinkStudent(s)} className="text-stone hover:text-brand-dark font-medium text-xs transition" title="Link this student's earlier record">Link</button>
                      {isAdmin && <button onClick={() => handleViewFeeSummary(s.id)} className="text-green-600 hover:text-green-800 font-medium text-xs transition">Fees</button>}
                      <button onClick={() => { setShowTermAssignModal(true); setSelectedStudent(s); setSelectedTermId(s.current_term_id || ''); }} className="text-blue-600 hover:text-blue-800 font-medium text-xs transition">Term</button>
                      <button onClick={() => handleDownloadIDCard(s.id)}
                        disabled={downloadingIDCard === s.id || !s.profile_picture_url}
                        className="text-orange-600 hover:text-orange-800 font-medium text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {downloadingIDCard === s.id ? 'Downloading...' : 'ID Card'}
                      </button>
                      {isAdmin && <button
                        onClick={() => handleDeleteStudent(s)}
                        className="text-red-600 hover:text-red-800 font-medium text-xs transition"
                      >Delete</button>}
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
                  {/* Admission Number */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-brand-dark mb-1">Admission Number <span className="text-red-500 text-xs">(Admin only)</span></label>
                    <input type="text" value={editForm.admission_no || ''} onChange={e => setEditForm({ ...editForm, admission_no: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50 focus:outline-none focus:border-brand text-sm font-mono"
                      placeholder="e.g. CEE/017/2023" />
                    <p className="text-xs text-amber-700 mt-1">⚠ Changing this affects the student&apos;s login email. Update their email separately if needed.</p>
                  </div>
                  {/* Course */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-brand-dark mb-1">Course <span className="text-red-500 text-xs">(Admin only)</span></label>
                    <select value={editForm.course_id || ''} onChange={e => setEditForm({ ...editForm, course_id: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm">
                      <option value="">Select Course...</option>
                      {coursesList?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.shortcode})</option>
                      ))}
                    </select>
                  </div>
                  {/* Level */}
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
                      <option value="ATTACHMENT">Attachment</option>
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
                    {selectedStudent.medical_report_url && (
                      <a href={selectedStudent.medical_report_url} target="_blank" rel="noreferrer" className="text-brand hover:underline flex items-center gap-2">
                        📄 Medical Report
                      </a>
                    )}
                    {selectedStudent.other_documents_url && (
                      <a href={selectedStudent.other_documents_url} target="_blank" rel="noreferrer" className="text-brand hover:underline flex items-center gap-2">
                        📄 Other Documents
                      </a>
                    )}
                    {!selectedStudent.id_copy_front_url && !selectedStudent.id_copy_back_url &&
                      !selectedStudent.parent_id_copy_front_url && !selectedStudent.parent_id_copy_back_url &&
                      !selectedStudent.kcse_certificate_url && !selectedStudent.medical_report_url &&
                      !selectedStudent.birth_certificate_url && !selectedStudent.other_documents_url && (
                        <p className="text-stone col-span-2">No documents uploaded yet</p>
                      )}
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-brand-dark mb-3">Upload New Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Student ID Copy (Front)</label>
                    <input type="file" accept="image/*" onChange={e => setDocFiles({ ...docFiles, id_copy_front: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Student ID Copy (Back)</label>
                    <input type="file" accept="image/*" onChange={e => setDocFiles({ ...docFiles, id_copy_back: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Parent ID Copy (Front)</label>
                    <input type="file" accept="image/*" onChange={e => setDocFiles({ ...docFiles, parent_id_copy_front: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Parent ID Copy (Back)</label>
                    <input type="file" accept="image/*" onChange={e => setDocFiles({ ...docFiles, parent_id_copy_back: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">KCSE Certificate</label>
                    <input type="file" accept=".pdf,image/*" onChange={e => setDocFiles({ ...docFiles, kcse_certificate: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Birth Certificate</label>
                    <input type="file" accept=".pdf,image/*" onChange={e => setDocFiles({ ...docFiles, birth_certificate: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Other Documents</label>
                    <input type="file" accept=".pdf,image/*" onChange={e => setDocFiles({ ...docFiles, other_documents: e.target.files?.[0] || null })}
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
                  <div className="text-2xl font-bold text-brand-dark">{feeSummary.summary.totalFees.toLocaleString()}</div>
                  <div className="text-xs text-stone">Total Fees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{feeSummary.summary.totalPaid.toLocaleString()}</div>
                  <div className="text-xs text-stone">Total Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{feeSummary.summary.totalBalance.toLocaleString()}</div>
                  <div className="text-xs text-stone">Total Balance</div>
                </div>
              </div>

              <h3 className="font-semibold text-brand-dark">Term Breakdown</h3>
              <div className="space-y-3">
                {feeSummary.termBreakdown.map((b: any) => (
                  <div key={b.term.id} className="p-4 border border-stone/10 rounded-xl bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-brand-dark">{b.term.name}</div>
                        <div className="text-xs text-stone">{b.term.academic_year} {b.term.intake ? `• ${b.term.intake}` : ''}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        b.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>{b.status}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                      <div>
                        <div className="text-stone">Term Cost</div>
                        <div className="font-medium">{b.term.term_cost.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-stone">Term Fees</div>
                        <div className="font-medium">{b.total_fees.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-stone">Brought Forward</div>
                        <div className="font-medium">{b.carryover ? b.carryover.toLocaleString() : '—'}</div>
                      </div>
                      <div>
                        <div className="text-stone">Level</div>
                        <div className="font-medium">{b.level}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-stone/10">
                      <div className="text-xs text-stone">{b.payment_count} payment(s)</div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">{b.amount_paid.toLocaleString()} paid</div>
                        <div className="text-sm font-semibold text-red-600">{b.balance.toLocaleString()} balance</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-semibold text-brand-dark">Record Payment</h3>
              {feeSummary.termBreakdown.length > 0 && feeSummary.termBreakdown.some((b: any) => b.balance > 0) && (
                <div className="space-y-3">
                  <select
                    value={selectedPaymentTermId}
                    onChange={e => { setSelectedPaymentTermId(e.target.value); }}
                    className="w-full px-3 py-2 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                  >
                    <option value="">Select term to record payment</option>
                    {feeSummary.termBreakdown.filter((b: any) => b.balance > 0).map((b: any) => (
                      <option key={b.term.id} value={b.term.id}>{termLabel(b.term, `Balance: KES ${b.balance.toLocaleString()}`)}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    placeholder="Amount received (KES)"
                    className="w-full px-3 py-2 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                  />
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    placeholder="Payment notes (optional)"
                    className="w-full px-3 py-2 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                  />
                  <p className="text-xs text-stone">💡 Tip: The Finance Officer can allocate this payment to specific fee types from the Finance Portal.</p>
                  <button
                    onClick={() => handleRecordPayment(feeSummary.student.id, feeSummary.termBreakdown[0].term.id)}
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


      {/* Term Assignment Modal */}
      {showTermAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="font-display text-xl text-brand-dark mb-1">Assign Term</h2>
            <p className="text-sm text-stone mb-6">Assign {selectedStudent.admission_no} to a term</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Select Term</label>
                <select
                  value={selectedTermId}
                  onChange={e => setSelectedTermId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                >
                  <option value="">Select Term</option>
                  {terms.map((term: any) => (
                    <option key={term.id} value={term.id}>{termLabel(term)}</option>
                  ))}
                </select>
                <TermInfo term={terms.find((t: any) => t.id === selectedTermId)} />
              </div>
              <button
                onClick={handleAssignTerm}
                disabled={assigningTerm}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {assigningTerm ? 'Assigning...' : 'Assign Term'}
              </button>
              <button
                onClick={() => { setShowTermAssignModal(false); setSelectedTermId(''); }}
                className="w-full py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Term Assignment Modal */}
      {showBulkTermModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="font-display text-xl text-brand-dark mb-1">Bulk Assign Term</h2>
            <p className="text-sm text-stone mb-6">Assign {selectedStudentIds.length} students to a term</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Select Term</label>
                <select
                  value={bulkTermId}
                  onChange={e => setBulkTermId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                >
                  <option value="">Select Term</option>
                  {terms.map((term: any) => (
                    <option key={term.id} value={term.id}>{termLabel(term)}</option>
                  ))}
                </select>
                <TermInfo term={terms.find((t: any) => t.id === bulkTermId)} />
              </div>
              <button
                onClick={handleBulkAssignTerm}
                disabled={assigningBulkTerm}
                className="w-full py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
              >
                {assigningBulkTerm ? 'Assigning...' : `Assign Term to ${selectedStudentIds.length} Students`}
              </button>
              <button
                onClick={() => { setShowBulkTermModal(false); setBulkTermId(''); setSelectedStudentIds([]); }}
                className="w-full py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Fee Payment Modal */}
      {showBulkPaymentModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="font-display text-xl text-brand-dark mb-1">Bulk Record Payment</h2>
            <p className="text-sm text-stone mb-6">Record payment for {selectedStudentIds.length} students</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Select Term</label>
                <select
                  value={bulkPaymentTermId}
                  onChange={e => setBulkPaymentTermId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                >
                  <option value="">Select Term</option>
                  {terms.map((term: any) => (
                    <option key={term.id} value={term.id}>{termLabel(term)}</option>
                  ))}
                </select>
                <TermInfo term={terms.find((t: any) => t.id === bulkPaymentTermId)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Select Fee Type</label>
                <select
                  value={bulkPaymentFeeTypeId}
                  onChange={e => setBulkPaymentFeeTypeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                >
                  <option value="">Select Fee Type</option>
                  {feeTypes.map((ft: any) => (
                    <option key={ft.id} value={ft.id}>{ft.name} ({ft.code}) - KES {ft.amount}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Payment Amount</label>
                <input
                  type="number"
                  value={bulkPaymentAmount}
                  onChange={e => setBulkPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                />
              </div>
              <button
                onClick={handleBulkRecordPayment}
                disabled={recordingBulkPayment}
                className="w-full py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {recordingBulkPayment ? 'Recording...' : `Record Payment for ${selectedStudentIds.length} Students`}
              </button>
              <button
                onClick={() => { setShowBulkPaymentModal(false); setBulkPaymentAmount(''); setBulkPaymentFeeTypeId(''); setBulkPaymentTermId(''); setSelectedStudentIds([]); }}
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

function BillingTab() {
  const [balances, setBalances] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedTermId, setSelectedTermId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/terms').then(r => setTerms(r.data.terms || [])).catch(() => { });
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [selectedTermId, selectedStatus, page]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (selectedTermId) params.termId = selectedTermId;
      if (selectedStatus) params.status = selectedStatus;

      const r = await api.get('/fees/billing/dashboard', { params });
      setBalances(r.data.balances);
      setTotal(r.data.pagination.total);
      setSummary(r.data.summary);
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-red-100 text-red-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-200 text-red-900',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-dark mb-6">Billing Dashboard</h1>

      {/* Summary Cards */}
      {summary && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-stone/10 shadow-sm">
            <div className="text-sm text-stone mb-1">Total Fees</div>
            <div className="text-2xl font-bold text-brand-dark">KES {summary.totalFees?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-stone/10 shadow-sm">
            <div className="text-sm text-stone mb-1">Total Paid</div>
            <div className="text-2xl font-bold text-green-600">KES {summary.totalPaid?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-stone/10 shadow-sm">
            <div className="text-sm text-stone mb-1">Outstanding Balance</div>
            <div className="text-2xl font-bold text-red-600">KES {summary.totalBalance?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-stone/10 shadow-sm">
            <div className="text-sm text-stone mb-1">Collection Rate</div>
            <div className="text-2xl font-bold text-blue-600">{summary.totalFees > 0 ? ((summary.totalPaid / summary.totalFees) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-stone/10 shadow-sm mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Term</label>
            <select
              value={selectedTermId}
              onChange={e => setSelectedTermId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-stone/25 focus:outline-none focus:border-brand text-sm"
            >
              <option value="">All Terms</option>
              {terms.map((t: any) => (
                <option key={t.id} value={t.id}>{termLabel(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-stone/25 focus:outline-none focus:border-brand text-sm"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Balances Table */}
      <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Admission No.</th>
                <th className="px-4 py-3 text-left">Term</th>
                <th className="px-4 py-3 text-right">Term Fees</th>
                <th className="px-4 py-3 text-right">B/F</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-stone">Loading...</td></tr>
              ) : balances.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-stone">No billing records found</td></tr>
              ) : (
                balances.map((b: any) => (
                  <tr key={b.id} className="border-t border-stone/10 hover:bg-stone/5">
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-dark">
                        {b.student.application.surname} {b.student.application.other_names}
                      </div>
                      <div className="text-xs text-stone">{b.student.course.name}</div>
                    </td>
                    <td className="px-4 py-3 text-stone">{b.student.admission_no}</td>
                    <td className="px-4 py-3 text-stone">{b.term.name}</td>
                    <td className="px-4 py-3 text-right font-medium">KES {b.total_fees?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-stone" title="Balance brought forward from earlier terms">{b.previous_balance_carryover ? `KES ${b.previous_balance_carryover.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 text-right text-green-600">KES {b.amount_paid?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">KES {b.balance?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>{b.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-stone/10 flex items-center justify-between text-sm text-stone">
          <span>Page {page} of {Math.ceil(total / 50)}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">← Prev</button>
            <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequisitionsTab() {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (statusFilter) params.status = statusFilter;
    api.get('/requisitions', { params }).then(r => {
      setRequisitions(r.data?.requisitions || []);
    }).catch(err => {
      console.error('Failed to fetch requisitions:', err);
      toast.error('Failed to load requisitions');
    }).finally(() => setLoading(false));
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      await api.patch(`/requisitions/${id}/approve`, { status: 'APPROVED' });
      setRequisitions(requisitions.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
      toast.success('Requisition approved');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to approve requisition');
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      await api.patch(`/requisitions/${rejectingId}/approve`, { status: 'REJECTED', rejection_reason: rejectionReason });
      setRequisitions(requisitions.map(r => r.id === rejectingId ? { ...r, status: 'REJECTED', rejection_reason: rejectionReason } : r));
      toast.success('Requisition rejected');
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectionReason('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to reject requisition');
    }
  };

  const handleViewDetails = (requisition: any) => {
    setSelectedRequisition(requisition);
    setShowDetailModal(true);
  };

  return (
    <><div>
      <h1 className="font-display text-2xl text-brand-dark mb-6">Purchase Requisitions</h1>

      <div className="bg-white rounded-2xl p-4 border border-stone/10 shadow-sm mb-6">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-stone/25 focus:outline-none focus:border-brand text-sm"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Requisition No.</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-stone">Loading...</td></tr>
              ) : requisitions.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-stone">No requisitions found</td></tr>
              ) : (
                requisitions.map((r: any) => (
                  <tr key={r.id} className="border-t border-stone/10 hover:bg-stone/5">
                    <td className="px-4 py-3 font-medium text-brand-dark">{r.requisition_no}</td>
                    <td className="px-4 py-3">{r.department?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{r.items?.length || 0} items</td>
                    <td className="px-4 py-3 text-right">KES {r.total_amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${r.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        r.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          r.priority === 'LOW' ? 'bg-green-100 text-green-800' :
                            'bg-stone/20 text-stone'}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        r.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                          r.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                            r.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-stone/20 text-stone'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(r)}
                          className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition"
                        >
                          View
                        </button>
                        {r.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={approving === r.id}
                              className="px-3 py-1 rounded-lg bg-green-100 text-green-800 text-sm hover:bg-green-200 transition disabled:opacity-50"
                            >
                              {approving === r.id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => { setRejectingId(r.id); setRejectionReason(''); setShowRejectModal(true); }}
                              className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requisition Detail Modal */}
      {showDetailModal && selectedRequisition && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-brand-dark">Requisition Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-stone hover:text-brand-dark text-2xl">&times;</button>
            </div>

            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-stone mb-1">Requisition No.</div>
                  <div className="font-semibold text-brand-dark">{selectedRequisition.requisition_no}</div>
                </div>
                <div>
                  <div className="text-sm text-stone mb-1">Department</div>
                  <div className="font-semibold text-brand-dark">{selectedRequisition.department?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-stone mb-1">Requested By</div>
                  <div className="font-semibold text-brand-dark">{selectedRequisition.requester?.email || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-stone mb-1">Date</div>
                  <div className="font-semibold text-brand-dark">{new Date(selectedRequisition.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="flex gap-4">
                <div>
                  <div className="text-sm text-stone mb-1">Status</div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedRequisition.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    selectedRequisition.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                      selectedRequisition.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        selectedRequisition.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-stone/20 text-stone'}`}>
                    {selectedRequisition.status}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-stone mb-1">Priority</div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedRequisition.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    selectedRequisition.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      selectedRequisition.priority === 'LOW' ? 'bg-green-100 text-green-800' :
                        'bg-stone/20 text-stone'}`}>
                    {selectedRequisition.priority}
                  </span>
                </div>
              </div>

              {/* Justification */}
              {selectedRequisition.justification && (
                <div>
                  <div className="text-sm text-stone mb-1">Justification</div>
                  <div className="bg-cream-deep/50 rounded-xl p-4 text-brand-dark">{selectedRequisition.justification}</div>
                </div>
              )}

              {/* Items */}
              <div>
                <div className="text-sm font-semibold text-brand-dark mb-3">Items ({selectedRequisition.items?.length || 0})</div>
                <div className="bg-cream-deep/50 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Item Name</th>
                        <th className="px-4 py-3 text-left">Description</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                        <th className="px-4 py-3 text-right">Unit Price</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequisition.items?.map((item: any) => (
                        <tr key={item.id} className="border-t border-stone/10">
                          <td className="px-4 py-3 font-medium">{item.item_name}</td>
                          <td className="px-4 py-3 text-stone">{item.description || '-'}</td>
                          <td className="px-4 py-3 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">KES {item.unit_price?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium">KES {item.total_price?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-cream-deep font-semibold">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right">Total</td>
                        <td className="px-4 py-3 text-right">KES {selectedRequisition.total_amount?.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Approval Info */}
              {selectedRequisition.approver && (
                <div>
                  <div className="text-sm text-stone mb-1">Approved By</div>
                  <div className="font-semibold text-brand-dark">{selectedRequisition.approver?.email}</div>
                  <div className="text-xs text-stone">{new Date(selectedRequisition.approved_at).toLocaleString()}</div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequisition.rejection_reason && (
                <div>
                  <div className="text-sm text-stone mb-1">Rejection Reason</div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">{selectedRequisition.rejection_reason}</div>
                </div>
              )}

              {/* Action Buttons in Detail Modal */}
              {selectedRequisition.status === 'PENDING_APPROVAL' && (
                <div className="flex gap-3 pt-4 border-t border-stone/10">
                  <button
                    onClick={() => { handleApprove(selectedRequisition.id); setShowDetailModal(false); }}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => { setRejectingId(selectedRequisition.id); setRejectionReason(''); setShowDetailModal(false); setShowRejectModal(true); }}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="font-display text-xl text-brand-dark mb-2">Reject Requisition</h2>
            <p className="text-sm text-stone mb-4">Please provide a reason for rejection. This will be visible to the department head.</p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-red-400 transition text-sm"
              rows={4}
              placeholder="e.g. Budget not available this quarter..." />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setShowRejectModal(false); setRejectingId(null); setRejectionReason(''); }}
                className="flex-1 py-2.5 rounded-xl border border-stone/25 text-stone font-semibold hover:bg-stone/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
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
  const [staffForm, setStaffForm] = useState({ email: '', password: '', first_name: '', last_name: '', role: 'DEPT_HEAD', department_id: '', phone: '' });
  const [departments, setDepartments] = useState<any[]>([]);
  const [savingStaff, setSavingStaff] = useState(false);
  const [staffMsg, setStaffMsg] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ email: '', role: '', department_id: '', new_password: '', confirm_password: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  useEffect(() => {
    departmentsApi.getAll().then(r => setDepartments(r.data)).catch(() => { });
  }, []);

  useEffect(() => {
    const params: any = { page, limit: 20, exclude_students: 'true' };
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;
    api.get('/auth/users', { params }).then(r => {
      // Students are excluded server-side so pagination only counts staff accounts
      setUsers(r.data.users);
      setTotal(r.data.pagination?.total ?? r.data.users.length);
    }).catch(err => {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load users. Please check your connection.');
    });
  }, [page, roleFilter, search]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setUpdating(userId);
    try {
      await api.patch(`/auth/users/${userId}`, { is_active: !currentStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
    } catch (err) {
      toast.error('Failed to update user status');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    toast('Delete this user? This action cannot be undone.', {
      action: {
        label: 'Delete',
        onClick: () => confirmDeleteUser(userId),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => { },
      },
    });
  };

  const confirmDeleteUser = async (userId: string) => {
    setUpdating(userId);
    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      setTotal(total - 1);
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error('Failed to delete user');
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
      setStaffForm({ email: '', password: '', first_name: '', last_name: '', role: 'DEPT_HEAD', department_id: '', phone: '' });
      setShowCreateForm(false);
      const updated = await api.get('/auth/users', { params: { page, limit: 20, role: roleFilter, search, exclude_students: 'true' } });
      setUsers(updated.data.users);
      setTotal(updated.data.pagination?.total ?? updated.data.users.length);
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
      const updated = await api.get('/auth/users', { params: { page, limit: 20, role: roleFilter, search, exclude_students: 'true' } });
      setUsers(updated.data.users);
      setTotal(updated.data.pagination?.total ?? updated.data.users.length);
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
    REGISTRAR: 'bg-teal-100 text-teal-800',
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
            <option value="REGISTRAR">Registrar</option>
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
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">First Name *</label>
                <input type="text" required value={staffForm.first_name} onChange={e => setStaffForm({ ...staffForm, first_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Last Name *</label>
                <input type="text" required value={staffForm.last_name} onChange={e => setStaffForm({ ...staffForm, last_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email *</label>
                <input type="email" required value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Password *</label>
                <input type="password" required value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Phone</label>
                <input type="tel" value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" placeholder="07XXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Role *</label>
                <select required value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                  <option value="ADMIN">Admin</option>
                  <option value="DEPT_HEAD">Dept Head</option>
                  <option value="FINANCE">Finance</option>
                  <option value="STAFF">Staff</option>
                  <option value="PROCUREMENT">Procurement</option>
                  <option value="HR">HR</option>
                  <option value="REGISTRAR">Registrar</option>
                </select>
              </div>
              {staffForm.role === 'DEPT_HEAD' && (
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Department</label>
                  <select value={staffForm.department_id} onChange={e => setStaffForm({ ...staffForm, department_id: e.target.value })}
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
                <input type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Role *</label>
                <select required value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm">
                  <option value="ADMIN">Admin</option>
                  <option value="DEPT_HEAD">Dept Head</option>
                  <option value="FINANCE">Finance</option>
                  <option value="STAFF">Staff</option>
                  <option value="PROCUREMENT">Procurement</option>
                  <option value="HR">HR</option>
                  <option value="REGISTRAR">Registrar</option>
                </select>
              </div>
              {editForm.role === 'DEPT_HEAD' && (
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">Department</label>
                  <select value={editForm.department_id} onChange={e => setEditForm({ ...editForm, department_id: e.target.value })}
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
                <input type="password" value={editForm.new_password} onChange={e => setEditForm({ ...editForm, new_password: e.target.value })}
                  placeholder="New password" className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm mb-3" />
                <input type="password" value={editForm.confirm_password} onChange={e => setEditForm({ ...editForm, confirm_password: e.target.value })}
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
  const isAdmin = useAuth().user?.role === 'ADMIN';
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

  // courseForm.levels is now a structured array of level objects
  type LevelObj = { name: string; entry_requirement: 'KCPE' | 'KCSE' | 'NONE'; min_kcse_grade: string; min_kcpe_marks: string; allow_progression_from: string };
  const DEFAULT_LEVEL_OBJ: LevelObj = { name: 'Level 5', entry_requirement: 'KCSE', min_kcse_grade: '', min_kcpe_marks: '', allow_progression_from: '' };
  const [courseForm, setCourseForm] = useState({ id: '', name: '', shortcode: '', department_id: '' });
  const [levelObjs, setLevelObjs] = useState<LevelObj[]>([{ ...DEFAULT_LEVEL_OBJ }]);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);

  const KCSE_GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];
  const LEVEL_OPTIONS = ['Level 3', 'Level 4', 'Level 5', 'Level 6'];
  const PROGRESSION_OPTIONS = ['Level 3', 'Level 4', 'Level 5'];

  const addLevel = () => setLevelObjs(prev => [...prev, { ...DEFAULT_LEVEL_OBJ }]);
  const removeLevel = (idx: number) => setLevelObjs(prev => prev.filter((_, i) => i !== idx));
  const updateLevel = (idx: number, patch: Partial<LevelObj>) =>
    setLevelObjs(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));

  /** Format level array into a short readable summary for the table */
  const formatLevelsSummary = (levelsArr: any[]) => {
    if (!Array.isArray(levelsArr) || levelsArr.length === 0) return '—';
    return levelsArr.map(l => {
      const name = typeof l === 'string' ? l : l.name;
      const req = l.entry_requirement;
      const prog = l.allow_progression_from ? ` / or from ${l.allow_progression_from}` : '';
      if (req === 'KCSE' && l.min_kcse_grade) return `${name} (KCSE ≥${l.min_kcse_grade}${prog})`;
      if (req === 'KCPE' && l.min_kcpe_marks) return `${name} (KCPE ≥${l.min_kcpe_marks}${prog})`;
      if (req === 'KCSE') return `${name} (KCSE${prog})`;
      if (req === 'KCPE') return `${name} (KCPE${prog})`;
      return `${name}${prog ? ` (${prog.trim()})` : ''}`;
    }).join(', ');
  };

  const fetchDepts = () => {
    departmentsApi.getAll().then(r => setDepts(r.data)).catch(() => { });
  };

  const fetchCourses = () => {
    coursesApi.getAll({ page: coursePage, limit: 15, search: courseSearch, department_id: deptFilter })
      .then(r => {
        setCourses(r.data.courses);
        setCourseTotal(r.data.pagination.total);
      }).catch(() => { });
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
      toast.error(err?.response?.data?.error || 'Failed to save department');
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeptDelete = (id: string) => {
    toast('Delete this department? This action cannot be undone.', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await departmentsApi.delete(id);
            fetchDepts();
          } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to delete department');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => { },
      },
    });
  };

  const handleCourseSubmit = async (e: any) => {
    e.preventDefault();
    if (levelObjs.length === 0) {
      toast.error('Add at least one level for the course');
      return;
    }
    setSavingCourse(true);
    try {
      const payload = {
        ...courseForm,
        levels: JSON.stringify(levelObjs.map(l => ({
          name: l.name,
          entry_requirement: l.entry_requirement,
          min_kcse_grade: l.entry_requirement === 'KCSE' ? (l.min_kcse_grade || null) : null,
          min_kcpe_marks: l.entry_requirement === 'KCPE' ? (l.min_kcpe_marks ? Number(l.min_kcpe_marks) : null) : null,
          allow_progression_from: l.allow_progression_from || null,
        }))),
      };
      if (courseForm.id) {
        await coursesApi.update(courseForm.id, payload);
      } else {
        await coursesApi.create(payload);
      }
      fetchCourses();
      setIsCourseModalOpen(false);
      setCourseForm({ id: '', name: '', shortcode: '', department_id: '' });
      setLevelObjs([{ ...DEFAULT_LEVEL_OBJ }]);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save course');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleCourseDelete = (id: string) => {
    toast('Delete this course? This action cannot be undone.', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await coursesApi.delete(id);
            fetchCourses();
          } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to delete course');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => { },
      },
    });
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
                setCourseForm({ id: '', name: '', shortcode: '', department_id: depts[0]?.id || '' });
                setLevelObjs([{ ...DEFAULT_LEVEL_OBJ }]);
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
                    <th className="px-4 py-3 text-left">Levels & Requirements</th>
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
                      <td className="px-4 py-3 text-stone text-xs max-w-xs">
                        {formatLevelsSummary(Array.isArray(c.levels) ? c.levels : [])}
                      </td>
                      <td className="px-4 py-3 text-stone text-xs">{c.department?.name}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => {
                          setCourseForm({ id: c.id, name: c.name, shortcode: c.shortcode, department_id: c.department_id });
                          // Load levels — already parsed to array by the API
                          const existing: any[] = Array.isArray(c.levels) ? c.levels : [];
                          setLevelObjs(existing.length > 0 ? existing.map((l: any) => ({
                            name: l.name || 'Level 5',
                            entry_requirement: l.entry_requirement || 'KCSE',
                            min_kcse_grade: l.min_kcse_grade || '',
                            min_kcpe_marks: l.min_kcpe_marks != null ? String(l.min_kcpe_marks) : '',
                            allow_progression_from: l.allow_progression_from || '',
                          })) : [{ ...DEFAULT_LEVEL_OBJ }]);
                          setIsCourseModalOpen(true);
                        }} className="text-brand hover:underline text-xs font-semibold">Edit</button>
                        {isAdmin && <button onClick={() => handleCourseDelete(c.id)} className="text-red-600 hover:underline text-xs font-semibold">Delete</button>}
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
                        {isAdmin && <button onClick={() => handleDeptDelete(d.id)} className="text-red-600 hover:underline text-xs font-semibold">Delete</button>}
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
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
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
                <label className="block text-xs font-semibold text-stone uppercase tracking-wider mb-1 text-[10px]">Department</label>
                <select required value={courseForm.department_id} onChange={e => setCourseForm(f => ({ ...f, department_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm text-brand-dark bg-white">
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* ── Level Builder ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-stone uppercase tracking-wider text-[10px]">Levels & Entry Requirements</label>
                  <button type="button" onClick={addLevel}
                    className="text-xs text-brand font-semibold hover:underline">+ Add Level</button>
                </div>
                <div className="space-y-3">
                  {levelObjs.map((lv, idx) => (
                    <div key={idx} className="rounded-xl border border-stone/20 bg-cream-deep/30 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={lv.name}
                          onChange={e => updateLevel(idx, { name: e.target.value })}
                          className="flex-1 px-2 py-1.5 rounded-lg border border-stone/25 text-xs text-brand-dark bg-white focus:outline-none focus:border-brand"
                        >
                          {LEVEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        {levelObjs.length > 1 && (
                          <button type="button" onClick={() => removeLevel(idx)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none px-1">×</button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-stone uppercase tracking-wider w-28 shrink-0">Entry Req.</span>
                        <select
                          value={lv.entry_requirement}
                          onChange={e => updateLevel(idx, { entry_requirement: e.target.value as any, min_kcse_grade: '', min_kcpe_marks: '' })}
                          className="flex-1 px-2 py-1.5 rounded-lg border border-stone/25 text-xs text-brand-dark bg-white focus:outline-none focus:border-brand"
                        >
                          <option value="NONE">None (Open entry)</option>
                          <option value="KCPE">KCPE</option>
                          <option value="KCSE">KCSE</option>
                        </select>
                      </div>
                      {lv.entry_requirement === 'KCSE' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-stone uppercase tracking-wider w-28 shrink-0">Min. KCSE Grade</span>
                          <select
                            value={lv.min_kcse_grade}
                            onChange={e => updateLevel(idx, { min_kcse_grade: e.target.value })}
                            className="flex-1 px-2 py-1.5 rounded-lg border border-stone/25 text-xs text-brand-dark bg-white focus:outline-none focus:border-brand"
                          >
                            <option value="">No minimum</option>
                            {KCSE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                      )}
                      {lv.entry_requirement === 'KCPE' && (
                        <div className="rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[10px] px-3 py-2">
                          ℹ️ KCPE is a binary qualifier — any student who completed primary school (Std 8) qualifies. Marks are collected for record-keeping only.
                        </div>
                      )}
                      {/* ── Progression bypass rule ── */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-stone uppercase tracking-wider w-28 shrink-0">Progression From</span>
                        <select
                          value={lv.allow_progression_from}
                          onChange={e => updateLevel(idx, { allow_progression_from: e.target.value })}
                          className="flex-1 px-2 py-1.5 rounded-lg border border-stone/25 text-xs text-brand-dark bg-white focus:outline-none focus:border-brand"
                        >
                          <option value="">— None (no progression shortcut) —</option>
                          {PROGRESSION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      {lv.allow_progression_from && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] px-3 py-2">
                          🔁 Students who completed <strong>{lv.allow_progression_from}</strong> at any institution can apply for this level without meeting the KCSE/KCPE requirement above.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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

// ─── Inline Document Templates Tab ───────────────────────────────────────────
function DocTemplatesTab() {
  const documentTypes = [
    {
      id: 'ADMISSION_LETTER',
      name: 'Admission Letter (Training)',
      vars: [
        '[STUDENT_NAME]', '[ADMISSION_NO]', '[REF_NO]', '[PROGRAMME]',
        '[REPORTING_DATE]', '[REPORTING_DEADLINE]', '[COURSE_DURATION]', '[DATE]',
      ],
    },
    {
      id: 'ACCEPTANCE_LETTER',
      name: 'Acceptance Letter',
      vars: [
        '[STUDENT_NAME]', '[ADMISSION_NO]', '[PROGRAMME]', '[DATE]',
        '[REPORTING_DATE]', '[REPORTING_DEADLINE]',
      ],
    },
    {
      id: 'TRAINING_ADMISSION',
      name: 'Training Admission Form',
      vars: ['[STUDENT_NAME]', '[ADMISSION_NO]', '[PROGRAMME]', '[DATE]', '[ACADEMIC_YEAR]'],
    },
    {
      id: 'PERSONAL_INFO',
      name: 'Personal Info Sheet',
      vars: ['[STUDENT_NAME]', '[ADMISSION_NO]', '[PROGRAMME]', '[DATE]'],
    },
    {
      id: 'LPO',
      name: 'Local Purchase Order (LPO)',
      vars: ['[SUPPLIER_NAME]', '[SUPPLIER_ADDRESS]', '[LPO_NO]', '[DATE]', '[DELIVERY_DATE]', '[TOTAL_AMOUNT]'],
    },
    {
      id: 'RFQ',
      name: 'Request for Quotation (RFQ)',
      vars: ['[RFQ_NO]', '[DATE]', '[CLOSING_DATE]', '[CONTACT_PERSON]', '[CONTACT_EMAIL]'],
    },
    {
      id: 'GRN',
      name: 'Goods Received Note (GRN)',
      vars: ['[GRN_NO]', '[DATE]', '[SUPPLIER_NAME]', '[LPO_NO]', '[RECEIVED_BY]'],
    },
    {
      id: 'SUPPLIER_INVOICE',
      name: 'Supplier Invoice',
      vars: ['[INVOICE_NO]', '[DATE]', '[SUPPLIER_NAME]', '[SUPPLIER_ADDRESS]', '[TOTAL_AMOUNT]', '[LPO_NO]'],
    },
  ];

  const defaultTextBlocks: Record<string, Record<string, string>> = {
    ADMISSION_LETTER: {
      intro: 'Following your application, I am pleased to inform you that you have been offered a chance to study [PROGRAMME] at North Horr Technical and Vocational College.',
      duration_note: 'The course will take [COURSE_DURATION] academic years. Continuance of your registration for the subsequent years will depend on evidence of your satisfactory class progress and payment of fees.',
      qualification_note: 'This offer is on the basis of your qualifications presented in your application forms which are subject to satisfactory verification by college authorities. Any information found to be false will automatically lead to your disqualification.',
      conditions_intro: 'The offer is also subject to the following conditions;',
      condition_a: 'Your acceptance to pay the required fees as per the fee structure on or before admission.',
      condition_b: 'Your agreement to adhere to the rules and regulations governing the conduct and discipline of trainees of North Horr TVC.',
      condition_c: 'Production of Original certificates on the day of registration for verification purposes.',
      condition_d: 'Please note that fee is payable at the beginning of every year or term. You are advised to apply for government scholarship, loan and bursary through www.hef.co.ke to cater for fees and other personal expenses.',
      banking_details: "You are required to pay fees in Banker's Draft or cash deposit into the college's bank account with the following details; Name: Kenya Commercial Bank, A/C No.: 127956824, A/C Name: North Horr Technical and Vocational College. The college does not accept personal cheques, money orders, postal orders or cash payments.",
      accommodation_note: 'You will arrange for your own accommodation, living expenses, transport and stationery.',
      forms_note: 'If you accept admission under these conditions, you are requested to fill and sign the following forms, which are attached to this letter, NHTVC/ADM/1, NHTVC/ADM/2 and NHTVC/ADM/3 and returned to the college on reporting.',
      closing: 'I take this opportunity to congratulate you on your admission to the college. I wish you success in your academic pursuit at North Horr TVC.',
      signatory_name: 'JOHN KIPKEMBOI CHUMBA',
      signatory_title: 'PRINCIPAL - NORTH HORR TVC',
    },
    ACCEPTANCE_LETTER: {
      intro: 'We are pleased to confirm your acceptance of the offer of admission to North Horr Technical and Vocational College for the [PROGRAMME] programme commencing [DATE].',
      reporting_instruction: 'You are required to report to the college on [REPORTING_DATE] and not later than [REPORTING_DEADLINE]. Failure to report by the deadline without prior written communication may result in forfeiture of your admission.',
      conditions_intro: 'By accepting this offer, you confirm that you agree to the following;',
      condition_1: 'You will abide by all rules, regulations, and policies of North Horr Technical and Vocational College.',
      condition_2: 'You will pay all applicable fees by the stipulated deadlines as per the college fee structure.',
      condition_3: 'You understand that continued enrolment is subject to satisfactory academic progress and conduct.',
      closing: 'We look forward to welcoming you to North Horr TVC. Should you have any queries, please contact the Admissions Office.',
      signatory_name: 'JOHN KIPKEMBOI CHUMBA',
      signatory_title: 'PRINCIPAL - NORTH HORR TVC',
    },
    TRAINING_ADMISSION: {
      header_note: 'NORTH HORR TECHNICAL AND VOCATIONAL COLLEGE',
      subheader: 'STUDENT TRAINING ADMISSION FORM',
      instruction: 'Please complete all sections of this form in BLOCK LETTERS. Attach certified copies of all supporting documents. Incomplete forms will not be processed.',
      declaration: 'I, the undersigned, declare that all information provided in this form is true, complete, and correct to the best of my knowledge. I understand that providing false information will lead to automatic disqualification and any admission offered will be withdrawn.',
      signatory_name: 'JOHN KIPKEMBOI CHUMBA',
      signatory_title: 'PRINCIPAL - NORTH HORR TVC',
    },
    PERSONAL_INFO: {
      intro: 'Please complete this Personal Information Sheet accurately. This information will be used for official college records and communication.',
      instruction: 'Fill in all fields in BLOCK LETTERS. Fields marked with (*) are mandatory. Submit this form to the Admissions Office together with all required supporting documents.',
      privacy_note: 'The information provided on this form is collected for the purpose of student registration and college administration only. It will be kept confidential and will not be shared with third parties without your consent, except as required by law.',
      signatory_name: 'JOHN KIPKEMBOI CHUMBA',
      signatory_title: 'PRINCIPAL - NORTH HORR TVC',
    },
    LPO: {
      intro: 'North Horr Technical and Vocational College hereby issues this Local Purchase Order to the supplier named above. Please supply the items listed below as per the specifications and quantities indicated.',
      terms: 'Payment Terms: Payment will be made within 30 days of delivery and receipt of a valid tax invoice. Delivery must be made to the college stores by [DELIVERY_DATE]. All goods must conform to the specifications and quantities stated herein. The college reserves the right to reject any goods that do not meet the required standards.',
      footer_note: 'This LPO is issued subject to the Public Procurement and Asset Disposal Act, 2015 and the regulations thereunder. Any variation to this order must be authorised in writing by the Principal.',
      authorized_by: 'JOHN KIPKEMBOI CHUMBA',
      authorized_title: 'PRINCIPAL - NORTH HORR TVC',
    },
    RFQ: {
      intro: 'North Horr Technical and Vocational College invites sealed quotations from eligible suppliers for the supply of goods/services as described below.',
      instructions: 'Suppliers are requested to submit their quotations in plain sealed envelopes clearly marked with the RFQ reference number to the college by [CLOSING_DATE] at 5:00 PM. Quotations received after the closing date and time will not be considered. The college is not bound to accept the lowest or any quotation.',
      requirements: 'Quotations must include: (1) Company name, PIN and VAT registration numbers; (2) Unit prices and total amounts inclusive of all taxes; (3) Delivery timeline; (4) Validity period of at least 30 days from closing date.',
      footer_note: 'For enquiries, contact the Procurement Office. The college reserves the right to accept or reject any quotation without assigning reasons.',
      authorized_by: 'JOHN KIPKEMBOI CHUMBA',
      authorized_title: 'PRINCIPAL - NORTH HORR TVC',
    },
    GRN: {
      intro: 'This Goods Received Note confirms receipt of the goods/services listed below from the supplier as specified in the Local Purchase Order referenced herein.',
      condition_note: 'The goods received have been inspected and are confirmed to be in good condition and conform to the specifications stated in the LPO, unless noted otherwise in the remarks column.',
      footer_note: 'Any discrepancies in quantity or quality must be reported to the supplier and the Procurement Officer within 48 hours of delivery. This document must be presented when submitting payment invoices.',
      received_by_title: 'STORES OFFICER - NORTH HORR TVC',
      verified_by_title: 'PRINCIPAL - NORTH HORR TVC',
    },
    SUPPLIER_INVOICE: {
      intro: 'This invoice is issued by the supplier named above to North Horr Technical and Vocational College for goods/services rendered as per the Local Purchase Order referenced herein.',
      payment_instruction: "Payment should be made within 30 days of receipt of this invoice via bank transfer to the account details provided by the supplier. Please quote the invoice number in all correspondence and payments.",
      footer_note: 'Certified correct and approved for payment. This invoice is subject to deduction of withholding tax as applicable under the Income Tax Act.',
      certified_by: 'JOHN KIPKEMBOI CHUMBA',
      certified_title: 'PRINCIPAL - NORTH HORR TVC',
    },
  };

  const textBlockKeys: Record<string, { key: string; label: string; hint: string }[]> = {
    ADMISSION_LETTER: [
      { key: 'intro', label: 'Opening Paragraph', hint: 'The first paragraph after "RE: ADMISSION FOR TRAINING". Use [PROGRAMME] for the course name.' },
      { key: 'duration_note', label: 'Course Duration Note', hint: 'Paragraph about how long the course takes. Use [COURSE_DURATION] e.g. "1/2/3".' },
      { key: 'qualification_note', label: 'Qualification Verification Notice', hint: 'Paragraph about qualifications being subject to verification.' },
      { key: 'conditions_intro', label: 'Conditions Introduction', hint: 'Short line introducing the list of conditions.' },
      { key: 'condition_a', label: 'Condition A – Fee Payment', hint: 'Condition about paying required fees before admission.' },
      { key: 'condition_b', label: 'Condition B – Rules & Regulations', hint: 'Condition about adhering to college rules and discipline.' },
      { key: 'condition_c', label: 'Condition C – Original Certificates', hint: 'Condition about producing original certificates on registration day.' },
      { key: 'condition_d', label: 'Condition D – Scholarships & Bursaries', hint: 'Advice about government scholarships, loans, and bursaries (HEF).' },
      { key: 'banking_details', label: 'Bank Payment Details', hint: 'Full paragraph with bank name, account number, and payment instructions.' },
      { key: 'accommodation_note', label: 'Accommodation Note', hint: 'Short paragraph advising students to arrange own accommodation and living expenses.' },
      { key: 'forms_note', label: 'Attached Forms Note', hint: 'Paragraph listing the forms (NHTVC/ADM/1, ADM/2, ADM/3) to be filled and returned.' },
      { key: 'closing', label: 'Closing / Congratulations', hint: 'Congratulatory closing paragraph.' },
      { key: 'signatory_name', label: 'Signatory Name', hint: 'Full name of the person signing (e.g. JOHN KIPKEMBOI CHUMBA).' },
      { key: 'signatory_title', label: 'Signatory Title', hint: 'Official title (e.g. PRINCIPAL - NORTH HORR TVC).' },
    ],
    ACCEPTANCE_LETTER: [
      { key: 'intro', label: 'Opening Paragraph', hint: 'Confirms the student has accepted the offer. Use [PROGRAMME] and [DATE].' },
      { key: 'reporting_instruction', label: 'Reporting Instructions', hint: 'When and where to report. Use [REPORTING_DATE] and [REPORTING_DEADLINE].' },
      { key: 'conditions_intro', label: 'Conditions Introduction', hint: 'Short intro line before the acceptance conditions list.' },
      { key: 'condition_1', label: 'Condition 1 – Rules & Regulations', hint: 'Agreement to abide by college rules.' },
      { key: 'condition_2', label: 'Condition 2 – Fee Payment', hint: 'Agreement to pay fees by stipulated deadlines.' },
      { key: 'condition_3', label: 'Condition 3 – Academic Progress', hint: 'Enrolment subject to satisfactory academic progress.' },
      { key: 'closing', label: 'Closing Paragraph', hint: 'Welcoming statement and contact info.' },
      { key: 'signatory_name', label: 'Signatory Name', hint: 'Full name of the person signing.' },
      { key: 'signatory_title', label: 'Signatory Title', hint: 'Official title of the signatory.' },
    ],
    TRAINING_ADMISSION: [
      { key: 'header_note', label: 'Institution Name Header', hint: 'Full institution name shown at top of the form.' },
      { key: 'subheader', label: 'Form Sub-heading', hint: 'Form title shown below the institution header.' },
      { key: 'instruction', label: 'Filling Instructions', hint: 'Instructions on how to complete the form (block letters, attach documents, etc.).' },
      { key: 'declaration', label: 'Student Declaration', hint: 'Declaration statement the student signs at the bottom.' },
      { key: 'signatory_name', label: 'Authorized Signatory Name', hint: 'Name of the authorizing official.' },
      { key: 'signatory_title', label: 'Authorized Signatory Title', hint: 'Title of the authorizing official.' },
    ],
    PERSONAL_INFO: [
      { key: 'intro', label: 'Opening / Purpose Statement', hint: 'Brief description of why this form is being collected.' },
      { key: 'instruction', label: 'Filling Instructions', hint: 'How the student should fill the form (block letters, mandatory fields, etc.).' },
      { key: 'privacy_note', label: 'Privacy / Data Notice', hint: 'Statement about how the data will be used and kept confidential.' },
      { key: 'signatory_name', label: 'Authorized Signatory Name', hint: 'Name of the official accepting the form.' },
      { key: 'signatory_title', label: 'Authorized Signatory Title', hint: 'Title of the official.' },
    ],
    LPO: [
      { key: 'intro', label: 'Opening Statement', hint: 'Opening paragraph addressing the supplier and describing the purpose of the LPO.' },
      { key: 'terms', label: 'Payment & Delivery Terms', hint: 'Full payment terms, delivery deadline, and quality requirements. Use [DELIVERY_DATE].' },
      { key: 'footer_note', label: 'Legal / Procurement Notice', hint: 'Statutory notice referencing the Public Procurement Act or other conditions.' },
      { key: 'authorized_by', label: 'Authorized By (Name)', hint: 'Name of the authorizing official.' },
      { key: 'authorized_title', label: 'Authorized By (Title)', hint: 'Title of the authorizing official.' },
    ],
    RFQ: [
      { key: 'intro', label: 'Invitation Statement', hint: 'Opening paragraph inviting suppliers to submit quotations.' },
      { key: 'instructions', label: 'Submission Instructions', hint: 'How, where, and by when to submit quotations. Use [CLOSING_DATE].' },
      { key: 'requirements', label: 'Quotation Requirements', hint: 'What must be included in the quotation (PIN, VAT, prices, timeline, etc.).' },
      { key: 'footer_note', label: 'Footer / Contact Note', hint: 'Contact information and rights reserved statement.' },
      { key: 'authorized_by', label: 'Authorized By (Name)', hint: 'Name of the authorizing official.' },
      { key: 'authorized_title', label: 'Authorized By (Title)', hint: 'Title of the authorizing official.' },
    ],
    GRN: [
      { key: 'intro', label: 'Opening Statement', hint: 'Confirmation that goods have been received from the supplier.' },
      { key: 'condition_note', label: 'Goods Condition Statement', hint: 'Confirmation that goods are in good condition and conform to LPO specifications.' },
      { key: 'footer_note', label: 'Discrepancy & Invoice Note', hint: 'Instructions on reporting discrepancies and using GRN with invoices.' },
      { key: 'received_by_title', label: 'Received By (Title)', hint: 'Title of the stores/receiving officer.' },
      { key: 'verified_by_title', label: 'Verified By (Title)', hint: 'Title of the verifying official (e.g. Principal).' },
    ],
    SUPPLIER_INVOICE: [
      { key: 'intro', label: 'Invoice Opening Statement', hint: 'Statement explaining what the invoice is for, referencing the LPO.' },
      { key: 'payment_instruction', label: 'Payment Instructions', hint: 'How and when the college should pay. Reference invoice number in correspondence.' },
      { key: 'footer_note', label: 'Certification & Tax Note', hint: 'Approval statement and withholding tax notice.' },
      { key: 'certified_by', label: 'Certified By (Name)', hint: 'Name of the certifying/approving official.' },
      { key: 'certified_title', label: 'Certified By (Title)', hint: 'Title of the certifying official.' },
    ],
  };

  const [selectedType, setSelectedType] = useState('ADMISSION_LETTER');
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ministryLogo, setMinistryLogo] = useState<File | null>(null);
  const [collegeLogo, setCollegeLogo] = useState<File | null>(null);
  const [textBlocks, setTextBlocks] = useState<any>({});
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const selectedDoc = documentTypes.find(d => d.id === selectedType)!;
  const blocks = textBlockKeys[selectedType] || [];

  useEffect(() => {
    fetchTemplate(selectedType);
  }, [selectedType]);

  const fetchTemplate = async (type: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/document-templates/${type}`);
      setTemplate(res.data);
      // Merge saved blocks over defaults so empty DB rows still show useful placeholder text
      const saved = res.data.text_blocks || {};
      const merged = { ...(defaultTextBlocks[type] || {}), ...saved };
      setTextBlocks(merged);
      setMinistryLogo(null);
      setCollegeLogo(null);
    } catch {
      setTemplate(null);
      // Fall back to defaults so the admin sees pre-filled content to edit
      setTextBlocks(defaultTextBlocks[type] || {});
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('text_blocks', JSON.stringify(textBlocks));
      if (ministryLogo) formData.append('ministry_logo', ministryLogo);
      if (collegeLogo) formData.append('college_logo', collegeLogo);
      await api.patch(`/document-templates/${selectedType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Template saved successfully!');
      fetchTemplate(selectedType);
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const copyVar = (v: string) => {
    navigator.clipboard.writeText(v);
    setCopiedVar(v);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl text-brand-dark">Document Templates</h2>
          <p className="text-sm text-stone mt-1">Customise the text content and logos used when generating official PDF documents.</p>
        </div>
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-stone/25 text-sm text-brand-dark bg-white focus:outline-none focus:border-brand shadow-sm"
        >
          {documentTypes.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Editor */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
            {/* Logos section */}
            <div className="p-6 border-b border-stone/10">
              <h3 className="font-semibold text-brand-dark mb-4">Institution Logos</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-brand-dark">Ministry Logo</label>
                  {template?.ministry_logo_url && (
                    <img src={template.ministry_logo_url} alt="Ministry" className="h-14 object-contain rounded border border-stone/10 p-1 bg-stone/5" />
                  )}
                  {!template?.ministry_logo_url && (
                    <p className="text-xs text-stone italic">Using default logo from server</p>
                  )}
                  <input
                    type="file" accept="image/png,image/jpeg"
                    onChange={e => setMinistryLogo(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-stone file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
                  />
                  {ministryLogo && <p className="text-xs text-green-600">✓ {ministryLogo.name} selected</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-brand-dark">College Logo</label>
                  {template?.college_logo_url && (
                    <img src={template.college_logo_url} alt="College" className="h-14 object-contain rounded border border-stone/10 p-1 bg-stone/5" />
                  )}
                  {!template?.college_logo_url && (
                    <p className="text-xs text-stone italic">Using default logo from server</p>
                  )}
                  <input
                    type="file" accept="image/png,image/jpeg"
                    onChange={e => setCollegeLogo(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-stone file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
                  />
                  {collegeLogo && <p className="text-xs text-green-600">✓ {collegeLogo.name} selected</p>}
                </div>
              </div>
            </div>

            {/* Text blocks section */}
            <div className="p-6 space-y-5">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-stone/10 rounded w-1/3" />
                  <div className="h-24 bg-stone/10 rounded" />
                  <div className="h-24 bg-stone/10 rounded" />
                </div>
              ) : blocks.length > 0 ? (
                <>
                  <h3 className="font-semibold text-brand-dark">Editable Text Sections</h3>
                  {blocks.map(block => (
                    <div key={block.key}>
                      <label className="block text-sm font-medium text-brand-dark mb-1">{block.label}</label>
                      <p className="text-xs text-stone mb-2">{block.hint}</p>
                      <textarea
                        rows={4}
                        value={textBlocks[block.key] || ''}
                        onChange={e => setTextBlocks({ ...textBlocks, [block.key]: e.target.value })}
                        placeholder={`Enter custom text for ${block.label.toLowerCase()}…`}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm text-brand-dark bg-white resize-none"
                      />
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-stone">
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-sm">The <strong>{selectedDoc.name}</strong> uses fully dynamic data from the database.</p>
                  <p className="text-xs mt-1">You can still upload custom logos above for this document type.</p>
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="px-6 pb-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50 text-sm"
              >
                {saving ? 'Saving…' : `Save ${selectedDoc.name} Template`}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Variables guide */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-5">
            <h3 className="font-semibold text-brand-dark mb-1">Available Variables</h3>
            <p className="text-xs text-stone mb-4">Click any variable to copy it. Paste it into the text areas and it will be replaced with real data when the PDF is generated.</p>
            <ul className="space-y-2">
              {selectedDoc.vars.map(v => (
                <li key={v}>
                  <button
                    type="button"
                    onClick={() => copyVar(v)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-brand/5 hover:bg-brand/10 border border-brand/20 transition flex items-center justify-between group"
                  >
                    <code className="text-xs font-mono text-brand">{v}</code>
                    <span className="text-xs text-stone group-hover:text-brand transition">
                      {copiedVar === v ? '✓ Copied!' : 'Copy'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="font-semibold text-amber-800 mb-2">💡 How It Works</h3>
            <ul className="text-xs text-amber-700 space-y-1.5 list-disc list-inside">
              <li>Leave a field blank to use the default text</li>
              <li>Use variables in square brackets to insert dynamic data</li>
              <li>Logo changes apply to all future PDFs immediately</li>
              <li>Financial data (fees, items) is always pulled live from the database</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── System Settings Tab ───────────────────────────────────────────────────────
function SystemSettingsTab() {
  const [deadline, setDeadline] = useState('');
  const [savedDeadline, setSavedDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [allSettings, setAllSettings] = useState<any[]>([]);

  const isoToLocal = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    api.get('/settings/student_edit_deadline')
      .then(r => { setSavedDeadline(r.data.value); setDeadline(isoToLocal(r.data.value)); })
      .catch(() => { });
    api.get('/settings')
      .then(r => setAllSettings(r.data || []))
      .catch(() => { });
  }, []);

  const handleSave = async () => {
    if (!deadline) return;
    setSaving(true);
    setStatus('idle');
    try {
      const isoValue = new Date(deadline).toISOString();
      await api.patch('/settings/student_edit_deadline', { value: isoValue });
      setSavedDeadline(isoValue);
      setStatus('success');
      toast.success('Deadline updated — takes effect immediately');
      const r = await api.get('/settings');
      setAllSettings(r.data || []);
    } catch (err: any) {
      setStatus('error');
      toast.error(err?.response?.data?.error || 'Failed to update deadline');
    } finally {
      setSaving(false);
    }
  };

  const savedDateFormatted = savedDeadline
    ? new Date(savedDeadline).toLocaleString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
      year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    })
    : '—';

  const previewDate = deadline
    ? new Date(deadline).toLocaleString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    : '';

  const isChanged = deadline && deadline !== isoToLocal(savedDeadline);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="font-display text-2xl text-brand-dark mb-1">⚙️ System Settings</h2>

      </div>

      <div className="bg-white rounded-2xl border border-stone/15 shadow-sm overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">🗓️</span>
          <div>
            <div className="font-semibold text-amber-900">Student Personal Info Edit Deadline</div>
            <div className="text-xs text-amber-700 mt-0.5">
              After this deadline, students can only change their profile photo and email.
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-stone/5 border border-stone/15">
            <span className="text-stone text-sm font-medium">Current deadline:</span>
            <span className="text-brand-dark text-sm font-semibold">{savedDateFormatted}</span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">
              New Deadline <span className="font-normal text-stone">(your local time)</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => { setDeadline(e.target.value); setStatus('idle'); }}
              className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
            />
            {isChanged && previewDate && (
              <p className="text-xs text-brand mt-1.5">
                📅 Will be set to: <strong>{previewDate}</strong>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              id="save-deadline-btn"
              onClick={handleSave}
              disabled={saving || !isChanged}
              className="px-6 py-2.5 rounded-full bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving
                ? <><span className="h-3.5 w-3.5 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />Saving...</>
                : '💾 Save Deadline'}
            </button>
            <button
              onClick={() => { setDeadline(isoToLocal(savedDeadline)); setStatus('idle'); }}
              disabled={saving || !isChanged}
              className="px-5 py-2.5 rounded-full border border-stone/25 text-stone text-sm font-medium hover:bg-stone/5 transition disabled:opacity-40"
            >
              Reset
            </button>
          </div>

          {status === 'success' && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
              ✅ Deadline updated — students will see the new date immediately on next load.
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              ❌ Failed to save. Please try again.
            </div>
          )}
        </div>
      </div>

      {allSettings.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone/15 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone/10">
            <div className="font-semibold text-brand-dark">All System Settings</div>
            <div className="text-xs text-stone mt-0.5">Full key-value store</div>
          </div>
          <div className="divide-y divide-stone/10">
            {allSettings.map((s: any) => (
              <div key={s.key} className="px-6 py-3 flex flex-wrap items-center gap-4 text-sm">
                <span className="font-mono text-xs bg-stone/10 text-stone px-2 py-0.5 rounded">{s.key}</span>
                <span className="text-brand-dark font-medium flex-1 truncate">{s.value}</span>
                <span className="text-xs text-stone flex-shrink-0">
                  Updated: {new Date(s.updated_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
