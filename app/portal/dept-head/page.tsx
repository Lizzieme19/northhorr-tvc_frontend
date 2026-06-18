'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function DeptHeadDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [appTotal, setAppTotal] = useState(0);
  const [studentTotal, setStudentTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'applications' | 'students'>('applications');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'DEPT_HEAD')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (tab === 'applications') {
      api.get('/applications', { params: { page, limit: 15 } })
        .then(r => { setApplications(r.data.applications); setAppTotal(r.data.pagination.total); })
        .catch(() => {});
    } else {
      api.get('/students', { params: { page, limit: 15 } })
        .then(r => { setStudents(r.data.students); setStudentTotal(r.data.pagination.total); })
        .catch(() => {});
    }
  }, [page, tab]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-cream-deep">
      <header className="bg-brand-dark text-cream px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gold grid place-items-center font-display font-bold text-brand-dark text-sm">NT</div>
          <span className="font-display font-semibold hidden sm:block">Department Head Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-cream/70 text-sm hidden md:block">{user.email}</span>
          <span className="px-2 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold">DEPT HEAD</span>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm text-cream/60 hover:text-cream transition">Logout</button>
        </div>
      </header>

      <nav className="bg-white border-b border-stone/15 px-6 flex gap-1 overflow-x-auto">
        {[
          { key: 'applications', label: `📋 Department Applications (${appTotal})` },
          { key: 'students', label: `🎓 Enrolled Students (${studentTotal})` },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key as any); setPage(1); }}
            className={`px-5 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.key ? 'border-brand text-brand' : 'border-transparent text-stone hover:text-brand-dark'}`}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {tab === 'applications' ? (
              <table className="w-full text-sm">
                <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Ref No.</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Course</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/10">
                  {applications.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-stone">No applications found for your department.</td></tr>}
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-cream-deep/50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-brand">{app.application_no}</td>
                      <td className="px-4 py-3 font-medium text-brand-dark">{app.surname} {app.other_names}</td>
                      <td className="px-4 py-3 text-stone text-xs">{app.course?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone/10 text-stone-700 border border-stone/20">{app.status}</span>
                      </td>
                      <td className="px-4 py-3 text-stone text-xs">{new Date(app.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Admission No.</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Course</th>
                    <th className="px-4 py-3 text-left">Level</th>
                    <th className="px-4 py-3 text-left">Intake</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/10">
                  {students.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-stone">No students enrolled yet.</td></tr>}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-4 py-3 border-t border-stone/10 flex items-center justify-between text-sm text-stone">
            <span>Page {page} of {Math.ceil((tab === 'applications' ? appTotal : studentTotal) / 15) || 1}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">← Prev</button>
              <button disabled={page >= Math.ceil((tab === 'applications' ? appTotal : studentTotal) / 15)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">Next →</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
