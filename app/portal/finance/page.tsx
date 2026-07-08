'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function FinanceDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [feeCleared, setFeeCleared] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'FINANCE')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    api.get('/finance/summary').then(r => setSummary(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params: any = { page, limit: 15 };
    if (search) params.search = search;
    if (feeCleared !== '') params.fee_cleared = feeCleared;
    api.get('/finance/students', { params })
      .then(r => { setStudents(r.data.students); setTotal(r.data.pagination.total); })
      .catch(() => {});
  }, [page, search, feeCleared]);

  const markPaid = async (studentId: string, feeType: string) => {
    setProcessing(`${studentId}-${feeType}`);
    try {
      await api.patch(`/finance/students/${studentId}/fees`, { fee_type: feeType });
      // Update local state
      setStudents(prev => prev.map(s => {
        if (s.id !== studentId) return s;
        if (feeType === 'ADMISSION') s.admission_fee_paid = true;
        if (feeType === 'STUDENT_ID') s.student_id_fee_paid = true;
        if (feeType === 'KUCCPS') s.kuccps_fee_paid = true;
        return { ...s };
      }));
      // Update summary briefly
      api.get('/finance/summary').then(r => setSummary(r.data));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to update fee');
    } finally { setProcessing(null); }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-cream-deep">
      <header className="bg-brand-dark text-cream px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gold grid place-items-center font-display font-bold text-brand-dark text-sm">NT</div>
          <span className="font-display font-semibold hidden sm:block">Finance Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-cream/70 text-sm hidden md:block">{user.email}</span>
          <span className="px-2 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold">FINANCE</span>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm text-cream/60 hover:text-cream transition">Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl text-brand-dark mb-6">Fee Overview</h1>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { label: 'Total Enrolled', value: summary?.totalStudents ?? '—', icon: '🎓' },
            { label: 'Admission Paid', value: summary?.admissionPaid ?? '—', icon: '✅' },
            { label: 'Student IDs Paid', value: summary?.studentIdPaid ?? '—', icon: '🪪' },
            { label: 'Total Collected', value: `KES ${summary?.totalCollected ?? 0}`, icon: '💰' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl p-6 border border-stone/10 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-stone">{card.label}</div>
                <div className="text-xl">{card.icon}</div>
              </div>
              <div className="font-display text-2xl font-bold text-brand-dark">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="font-display text-xl text-brand-dark">Fee Clearance List</h2>
          <div className="flex gap-2">
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search admission no, name…"
              className="px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand w-56" />
            <select value={feeCleared} onChange={e => { setFeeCleared(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand">
              <option value="">All Students</option>
              <option value="true">Cleared Basic Fees</option>
              <option value="false">Pending Fees</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Admission No.</th>
                  <th className="px-4 py-3 text-left">Student Details</th>
                  <th className="px-4 py-3 text-left">Admission (1500)</th>
                  <th className="px-4 py-3 text-left">Student ID (500)</th>
                  <th className="px-4 py-3 text-left">KUCCPS (500)</th>
                  <th className="px-4 py-3 text-left">Print ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/10">
                {students.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-stone">No records found</td></tr>}
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-cream-deep/50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-brand">{s.admission_no}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-dark">{s.application.surname} {s.application.other_names}</div>
                      <div className="text-xs text-stone">{s.course.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      {s.admission_fee_paid ? <span className="text-green-600 font-medium">Paid</span> : (
                        <button onClick={() => markPaid(s.id, 'ADMISSION')} disabled={!!processing}
                          className="text-xs px-3 py-1 rounded-full bg-brand/10 text-brand hover:bg-brand hover:text-white transition disabled:opacity-50">
                          {processing === `${s.id}-ADMISSION` ? '...' : 'Mark Paid'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.student_id_fee_paid ? <span className="text-green-600 font-medium">Paid</span> : (
                        <button onClick={() => markPaid(s.id, 'STUDENT_ID')} disabled={!!processing}
                          className="text-xs px-3 py-1 rounded-full bg-brand/10 text-brand hover:bg-brand hover:text-white transition disabled:opacity-50">
                          {processing === `${s.id}-STUDENT_ID` ? '...' : 'Mark Paid'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.application.type === 'KUCCPS' ? <span className="text-stone text-xs border border-stone/20 px-2 py-0.5 rounded-full">N/A</span> : 
                        s.kuccps_fee_paid ? <span className="text-green-600 font-medium">Paid</span> : (
                          <button onClick={() => markPaid(s.id, 'KUCCPS')} disabled={!!processing}
                            className="text-xs px-3 py-1 rounded-full bg-brand/10 text-brand hover:bg-brand hover:text-white transition disabled:opacity-50">
                            {processing === `${s.id}-KUCCPS` ? '...' : 'Mark Paid'}
                          </button>
                        )
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button disabled={!s.student_id_fee_paid} onClick={() => alert('Student ID printing queue triggered.')}
                        className="text-xs px-3 py-1.5 rounded bg-stone-100 border border-stone-200 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1">
                        🖨️ Print ID
                      </button>
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
      </main>
    </div>
  );
}
