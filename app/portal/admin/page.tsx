'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

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
  const [applications, setApplications] = useState<Application[]>([]);
  const [appTotal, setAppTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'overview' | 'applications' | 'students' | 'staff' | 'courses'>('overview');
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [intake, setIntake] = useState('SEPTEMBER');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    api.get('/students/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params: any = { page, limit: 15 };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    api.get('/applications', { params }).then(r => {
      setApplications(r.data.applications);
      setAppTotal(r.data.pagination.total);
    }).catch(() => {});
  }, [page, statusFilter, search, tab]);

  const handleStatus = async (id: string, status: string) => {
    setApproving(id);
    try {
      await api.patch(`/applications/${id}/status`, { status, review_notes: reviewNotes, intake, year: new Date().getFullYear() });
      setSelectedApp(null);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Error updating status');
    } finally { setApproving(null); }
  };

  const handleKuccpsImport = async () => {
    if (!csvFile) return;
    setImporting(true);
    const fd = new FormData();
    fd.append('csv_file', csvFile);
    try {
      const r = await api.post('/applications/import/kuccps', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult(r.data);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Import failed');
    } finally { setImporting(false); }
  };

  const generateLetter = async (studentId: string) => {
    try {
      const r = await api.post(`/admissions/generate/${studentId}`);
      alert('Admission letter generated! URL: ' + r.data.letter_url);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to generate letter');
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
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm text-cream/60 hover:text-cream transition">Logout</button>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="bg-white border-b border-stone/15 px-6 flex gap-1 overflow-x-auto">
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'applications', label: '📋 Applications' },
          { key: 'students', label: '🎓 Students' },
          { key: 'courses', label: '📚 Dept & Courses' },
          { key: 'staff', label: '👥 Staff & Import' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-5 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.key ? 'border-brand text-brand' : 'border-transparent text-stone hover:text-brand-dark'}`}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">

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
                <button onClick={() => setTab('staff')} className="p-4 rounded-xl border-2 border-dashed border-gold/30 hover:border-gold hover:bg-gold/5 transition text-left">
                  <div className="text-2xl mb-2">📥</div>
                  <div className="font-semibold text-brand-dark">Import KUCCPS</div>
                  <div className="text-xs text-stone mt-1">Upload CSV file</div>
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

        {/* ── COURSES & DEPTS ── */}
        {tab === 'courses' && <CoursesTab />}

        {/* ── STAFF & KUCCPS ── */}
        {tab === 'staff' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Create Staff */}
            <div className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <h2 className="font-display text-lg text-brand-dark mb-5">Create Staff Account</h2>
              <CreateStaffForm />
            </div>
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
          </div>
        )}
      </main>

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

  useEffect(() => {
    api.get('/students', { params: { page, limit: 15, search } })
      .then(r => { setStudents(r.data.students); setTotal(r.data.pagination.total); })
      .catch(() => {});
  }, [page, search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl text-brand-dark">Students ({total})</h1>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search admission no, name…"
          className="px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand w-56" />
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
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/10">
              {students.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-stone">No students enrolled yet</td></tr>}
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
    </div>
  );
}

function CreateStaffForm() {
  const [form, setForm] = useState({ email: '', password: '', role: 'DEPT_HEAD', department_id: '' });
  const [departments, setDepartments] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { api.get('/departments').then(r => setDepartments(r.data)).catch(() => {}); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.post('/auth/create-staff', form);
      setMsg('✅ Staff account created successfully!');
      setForm({ email: '', password: '', role: 'DEPT_HEAD', department_id: '' });
    } catch (e: any) { setMsg('❌ ' + (e?.response?.data?.error || 'Error')); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg && <div className={`p-3 rounded-xl text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{msg}</div>}
      <div>
        <label className="block text-sm font-medium text-brand-dark mb-1">Email</label>
        <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" placeholder="staff@ntvc.ac.ke" />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-dark mb-1">Temporary Password</label>
        <input type="text" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" placeholder="Temp@1234" />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-dark mb-1">Role</label>
        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm">
          <option value="ADMIN">Admin</option>
          <option value="DEPT_HEAD">Department Head</option>
          <option value="FINANCE">Finance</option>
        </select>
      </div>
      {form.role === 'DEPT_HEAD' && (
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">Department</label>
          <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm">
            <option value="">Select department…</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      )}
      <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
        {saving ? 'Creating…' : 'Create Account'}
      </button>
    </form>
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
    api.get('/departments').then(r => setDepts(r.data)).catch(() => {});
  };

  const fetchCourses = () => {
    api.get('/courses', {
      params: { page: coursePage, limit: 15, search: courseSearch, department_id: deptFilter }
    }).then(r => {
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
        await api.put(`/departments/${deptForm.id}`, deptForm);
      } else {
        await api.post('/departments', deptForm);
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
      await api.delete(`/departments/${id}`);
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
        await api.put(`/courses/${courseForm.id}`, courseForm);
      } else {
        await api.post('/courses', courseForm);
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
      await api.delete(`/courses/${id}`);
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
                        }} className="text-brand hover:underline font-medium text-xs font-semibold">Edit</button>
                        <button onClick={() => handleCourseDelete(c.id)} className="text-red-600 hover:underline font-medium text-xs font-semibold">Delete</button>
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
                        }} className="text-brand hover:underline font-medium text-xs font-semibold">Edit</button>
                        <button onClick={() => handleDeptDelete(d.id)} className="text-red-600 hover:underline font-medium text-xs font-semibold">Delete</button>
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
