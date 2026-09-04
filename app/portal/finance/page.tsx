'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { financeApi, feeTypesApi } from '@/lib/services';
import ChangePassword from '@/components/ChangePassword';
import { toast } from 'sonner';

export default function FinanceDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [feeCleared, setFeeCleared] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [showBillingDashboard, setShowBillingDashboard] = useState(false);
  const [billingData, setBillingData] = useState<any>(null);
  const [billingTermId, setBillingTermId] = useState('');
  const [billingStatus, setBillingStatus] = useState('');
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [terms, setTerms] = useState<any[]>([]);

  // Record Payment modal state
  const [recordPaymentStudent, setRecordPaymentStudent] = useState<any>(null);
  const [recordPaymentTermId, setRecordPaymentTermId] = useState('');
  const [recordPaymentAmount, setRecordPaymentAmount] = useState('');
  const [recordPaymentNotes, setRecordPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [studentTerms, setStudentTerms] = useState<any[]>([]);
  const [loadingStudentTerms, setLoadingStudentTerms] = useState(false);

  // Allocate Funds modal state
  const [allocatingStudent, setAllocatingStudent] = useState<any>(null);
  const [allocatingTermId, setAllocatingTermId] = useState('');
  const [allocationBreakdown, setAllocationBreakdown] = useState<any>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});
  const [submittingAllocation, setSubmittingAllocation] = useState(false);
  const [allocationNotes, setAllocationNotes] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'FINANCE')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    financeApi.getReports().then(r => setSummary(r.data)).catch(() => {});
    feeTypesApi.getAll({ is_active: 'true' }).then(r => setFeeTypes(r.data.fee_types || [])).catch(() => {});
    api.get('/terms').then(r => setTerms(r.data.terms || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const params: any = { page, limit: 15 };
    if (search) params.search = search;
    if (feeCleared !== '') params.fee_cleared = feeCleared;
    financeApi.getFeeRecords().then(r => {
      setStudents(r.data.students);
      setTotal(r.data.pagination.total);
    }).catch(() => {});
  }, [page, search, feeCleared]);

  const refreshStudents = async () => {
    const params: any = { page, limit: 15 };
    if (search) params.search = search;
    if (feeCleared !== '') params.fee_cleared = feeCleared;
    const r = await financeApi.getFeeRecords(params);
    setStudents(r.data.students);
    financeApi.getReports().then(r => setSummary(r.data));
  };

  // ── Record Payment modal ──
  const openRecordPayment = async (student: any) => {
    setRecordPaymentStudent(student);
    setRecordPaymentTermId('');
    setRecordPaymentAmount('');
    setRecordPaymentNotes('');
    setLoadingStudentTerms(true);
    try {
      const r = await api.get(`/fees/students/${student.id}/summary`);
      const termBalances = r.data.termBreakdown || [];
      setStudentTerms(termBalances);
    } catch {
      toast.error('Failed to load student terms');
    } finally {
      setLoadingStudentTerms(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!recordPaymentAmount || parseFloat(recordPaymentAmount) <= 0) {
      toast.warning('Please enter a valid amount');
      return;
    }
    if (!recordPaymentTermId) {
      toast.warning('Please select a term');
      return;
    }
    setRecordingPayment(true);
    try {
      await api.post(`/fees/students/${recordPaymentStudent.id}/terms/${recordPaymentTermId}/payment`, {
        amount: parseFloat(recordPaymentAmount),
        notes: recordPaymentNotes || undefined,
      });
      toast.success('Payment recorded! You can now allocate it to specific fee types.');
      setRecordPaymentStudent(null);
      await refreshStudents();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  // ── Allocate Funds modal ──
  const openAllocateFunds = async (student: any, termId?: string) => {
    setAllocatingStudent(student);
    setAllocationInputs({});
    setAllocationNotes('');

    // Determine the term to allocate for
    let resolvedTermId = termId;
    if (!resolvedTermId && student.current_term_id) resolvedTermId = student.current_term_id;

    if (!resolvedTermId) {
      // try to pick first term that has unallocated funds by fetching summary
      try {
        const r = await api.get(`/fees/students/${student.id}/summary`);
        const termsWithBalance = (r.data.termBreakdown || []).filter((b: any) => b.amount_paid > 0);
        if (termsWithBalance.length > 0) resolvedTermId = termsWithBalance[0].term.id;
      } catch {}
    }

    if (resolvedTermId) {
      setAllocatingTermId(resolvedTermId);
      await loadAllocationBreakdown(student.id, resolvedTermId);
    } else {
      setAllocatingTermId('');
      setAllocationBreakdown(null);
    }
  };

  const loadAllocationBreakdown = async (studentId: string, termId: string) => {
    setLoadingBreakdown(true);
    try {
      const r = await api.get(`/fees/students/${studentId}/terms/${termId}/allocations`);
      setAllocationBreakdown(r.data);
      // Pre-fill zero values for all fee types
      const inputs: Record<string, string> = {};
      (r.data.feeTypeBreakdown || []).forEach((ft: any) => {
        inputs[ft.fee_type.id] = '';
      });
      setAllocationInputs(inputs);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to load allocation breakdown');
      setAllocationBreakdown(null);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const handleSubmitAllocation = async () => {
    const allocations = Object.entries(allocationInputs)
      .filter(([, v]) => v && parseFloat(v) > 0)
      .map(([fee_type_id, amount]) => ({ fee_type_id, amount: parseFloat(amount) }));

    if (allocations.length === 0) {
      toast.warning('Please enter at least one allocation amount');
      return;
    }

    const totalAllocating = allocations.reduce((sum, a) => sum + a.amount, 0);
    const available = allocationBreakdown?.totalUnallocated || 0;

    if (totalAllocating > available + 0.01) {
      toast.error(`Cannot allocate KES ${totalAllocating.toLocaleString()}. Only KES ${available.toLocaleString()} available.`);
      return;
    }

    setSubmittingAllocation(true);
    try {
      await api.post(`/fees/students/${allocatingStudent.id}/terms/${allocatingTermId}/allocate`, {
        allocations,
        notes: allocationNotes || undefined,
      });
      toast.success('Funds allocated successfully!');
      await loadAllocationBreakdown(allocatingStudent.id, allocatingTermId);
      await refreshStudents();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to allocate funds');
    } finally {
      setSubmittingAllocation(false);
    }
  };

  const handleLoadBillingDashboard = async () => {
    setLoadingBilling(true);
    try {
      const params: any = { page: 1, limit: 50 };
      if (billingTermId) params.termId = billingTermId;
      if (billingStatus) params.status = billingStatus;
      const r = await api.get('/fees/billing/dashboard', { params });
      setBillingData(r.data);
      setShowBillingDashboard(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to load billing dashboard');
    } finally {
      setLoadingBilling(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" /></div>;

  const statusBadge = (s: string) => {
    const cls: Record<string, string> = {
      PAID: 'bg-green-100 text-green-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      PENDING: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls[s] || 'bg-gray-100 text-gray-700'}`}>{s}</span>;
  };

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
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="text-sm text-cream/60 hover:text-cream transition">Change Password</button>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm text-cream/60 hover:text-cream transition">Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showPasswordChange && (
          <div className="bg-white rounded-2xl p-6 mb-6 border border-stone/10 shadow-sm">
            <h2 className="font-display text-xl text-brand-dark mb-4">Change Password</h2>
            <ChangePassword />
            <button onClick={() => setShowPasswordChange(false)} className="mt-4 text-sm text-stone hover:text-brand transition">Cancel</button>
          </div>
        )}

        <h1 className="font-display text-2xl text-brand-dark mb-6">Fee Overview</h1>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          {[
            { label: 'Total Enrolled', value: summary?.totalStudents ?? '—', icon: '🎓' },
            { label: 'Admission Paid', value: summary?.admissionPaid ?? '—', icon: '✅' },
            { label: 'Student IDs Paid', value: summary?.studentIdPaid ?? '—', icon: '🪪' },
            { label: 'Tuition Paid', value: summary?.tuitionPaid ?? '—', icon: '💰' },
            { label: 'Total Collected', value: `KES ${(summary?.totalCollected ?? 0).toLocaleString()}`, icon: '🏦' },
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
            <button
              onClick={() => setShowBillingDashboard(true)}
              className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition text-sm"
            >
              Billing Dashboard
            </button>
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
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Course</th>
                  <th className="px-4 py-3 text-right">Total Fees</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/10">
                {students.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-stone">No records found</td></tr>}
                {students.map(s => {
                  // Use current term balance if available
                  const currentBalance = s.student_balances?.find((b: any) => b.term_id === s.current_term_id) || s.student_balances?.[0];
                  return (
                    <tr key={s.id} className="hover:bg-cream-deep/50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-brand">{s.admission_no}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-brand-dark">{s.application?.surname} {s.application?.other_names}</div>
                        <div className="text-xs text-stone">{s.level}</div>
                      </td>
                      <td className="px-4 py-3 text-stone text-xs">{s.course?.name}</td>
                      <td className="px-4 py-3 text-right font-medium">KES {currentBalance?.total_fees?.toLocaleString() ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">KES {currentBalance?.amount_paid?.toLocaleString() ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">KES {currentBalance?.balance?.toLocaleString() ?? '—'}</td>
                      <td className="px-4 py-3">{currentBalance ? statusBadge(currentBalance.status) : <span className="text-xs text-stone">No term</span>}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => openRecordPayment(s)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-brand text-cream hover:bg-brand-dark transition font-medium"
                          >
                            💵 Record Payment
                          </button>
                          <button
                            onClick={() => openAllocateFunds(s)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition font-medium"
                          >
                            🏷️ Allocate Funds
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-stone/10 flex items-center justify-between text-sm text-stone">
            <span>Page {page} of {Math.max(1, Math.ceil(total / 15))}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">← Prev</button>
              <button disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border border-stone/25 disabled:opacity-40 hover:border-brand transition">Next →</button>
            </div>
          </div>
        </div>

        {/* ── Record Payment Modal ── */}
        {recordPaymentStudent && (
          <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="font-display text-xl text-brand-dark mb-1">Record Payment</h2>
              <p className="text-sm text-stone mb-5">
                {recordPaymentStudent.admission_no} — {recordPaymentStudent.application?.surname} {recordPaymentStudent.application?.other_names}
              </p>
              <div className="space-y-4">
                {loadingStudentTerms ? (
                  <div className="text-center py-4 text-stone text-sm">Loading terms…</div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Term *</label>
                      <select
                        value={recordPaymentTermId}
                        onChange={e => setRecordPaymentTermId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                      >
                        <option value="">Select term</option>
                        {studentTerms.map((b: any) => (
                          <option key={b.term.id} value={b.term.id}>
                            {b.term.name} ({b.term.academic_year}) — Balance: KES {b.balance.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Amount Received (KES) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={recordPaymentAmount}
                        onChange={e => setRecordPaymentAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full px-4 py-3 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Notes (optional)</label>
                      <input
                        type="text"
                        value={recordPaymentNotes}
                        onChange={e => setRecordPaymentNotes(e.target.value)}
                        placeholder="e.g. Cash payment, Receipt #1234"
                        className="w-full px-4 py-3 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                      />
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                      💡 After recording, use <strong>Allocate Funds</strong> to specify how this payment is distributed across fee types (Admission, Tuition, etc.)
                    </div>
                  </>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleRecordPayment}
                  disabled={recordingPayment || loadingStudentTerms}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
                >
                  {recordingPayment ? 'Recording…' : 'Record Payment'}
                </button>
                <button onClick={() => setRecordPaymentStudent(null)} className="flex-1 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Allocate Funds Modal ── */}
        {allocatingStudent && (
          <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-6 overflow-y-auto">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl my-auto">
              <h2 className="font-display text-xl text-brand-dark mb-1">Allocate Funds</h2>
              <p className="text-sm text-stone mb-5">
                {allocatingStudent.admission_no} — {allocatingStudent.application?.surname} {allocatingStudent.application?.other_names}
              </p>

              {/* Term selector */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Term</label>
                <select
                  value={allocatingTermId}
                  onChange={async e => {
                    setAllocatingTermId(e.target.value);
                    if (e.target.value) await loadAllocationBreakdown(allocatingStudent.id, e.target.value);
                    else setAllocationBreakdown(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                >
                  <option value="">Select a term</option>
                  {terms.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.academic_year})</option>
                  ))}
                </select>
              </div>

              {loadingBreakdown && <div className="text-center py-6 text-stone text-sm">Loading breakdown…</div>}

              {allocationBreakdown && !loadingBreakdown && (
                <>
                  {/* Summary bar */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-cream-deep rounded-xl p-3 text-center">
                      <div className="text-xs text-stone mb-1">Total Paid</div>
                      <div className="font-bold text-brand-dark text-sm">KES {allocationBreakdown.totalPaid.toLocaleString()}</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <div className="text-xs text-stone mb-1">Allocated</div>
                      <div className="font-bold text-green-700 text-sm">KES {allocationBreakdown.totalAllocated.toLocaleString()}</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <div className="text-xs text-stone mb-1">Unallocated</div>
                      <div className="font-bold text-amber-700 text-sm">KES {allocationBreakdown.totalUnallocated.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Fee type breakdown */}
                  <h3 className="font-semibold text-brand-dark mb-3 text-sm">Fee Type Allocation</h3>
                  {allocationBreakdown.feeTypeBreakdown.length === 0 ? (
                    <p className="text-stone text-sm text-center py-4">No applicable fee types configured</p>
                  ) : (
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                      {allocationBreakdown.feeTypeBreakdown.map((ft: any) => (
                        <div key={ft.fee_type.id} className="border border-stone/15 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <span className="font-medium text-sm text-brand-dark">{ft.fee_type.name}</span>
                              <span className="text-xs text-stone ml-2">({ft.fee_type.code})</span>
                            </div>
                            {statusBadge(ft.status)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-stone mb-2">
                            <span>Required: KES {ft.required_amount.toLocaleString()}</span>
                            <span>•</span>
                            <span className="text-green-700">Paid: KES {ft.amount_paid.toLocaleString()}</span>
                            <span>•</span>
                            <span className="text-red-600">Balance: KES {ft.balance.toLocaleString()}</span>
                          </div>
                          {ft.balance > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-stone whitespace-nowrap">Allocate KES:</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                max={Math.min(ft.balance, allocationBreakdown.totalUnallocated)}
                                value={allocationInputs[ft.fee_type.id] || ''}
                                onChange={e => setAllocationInputs(prev => ({ ...prev, [ft.fee_type.id]: e.target.value }))}
                                placeholder={`Max ${Math.min(ft.balance, allocationBreakdown.totalUnallocated).toLocaleString()}`}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-stone/25 focus:outline-none focus:border-brand text-sm"
                              />
                              <button
                                onClick={() => setAllocationInputs(prev => ({
                                  ...prev,
                                  [ft.fee_type.id]: String(Math.min(ft.balance, allocationBreakdown.totalUnallocated))
                                }))}
                                className="text-xs px-2 py-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand hover:text-white transition"
                              >
                                Max
                              </button>
                            </div>
                          )}
                          {ft.balance <= 0 && <p className="text-xs text-green-600 mt-1">✓ Fully paid</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total being allocated preview */}
                  <div className="flex items-center justify-between text-sm mb-3 bg-stone/5 rounded-xl px-4 py-2">
                    <span className="text-stone">Total allocating:</span>
                    <span className="font-bold text-brand-dark">
                      KES {Object.values(allocationInputs).reduce((s, v) => s + (parseFloat(v as string) || 0), 0).toLocaleString()}
                    </span>
                  </div>

                  {allocationBreakdown.totalUnallocated === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-800 mb-3">
                      ✅ All received payments have been fully allocated.
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Allocation Notes (optional)</label>
                    <input
                      type="text"
                      value={allocationNotes}
                      onChange={e => setAllocationNotes(e.target.value)}
                      placeholder="e.g. September term allocation"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                    />
                  </div>
                </>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSubmitAllocation}
                  disabled={submittingAllocation || !allocationBreakdown || allocationBreakdown.totalUnallocated === 0}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {submittingAllocation ? 'Saving…' : 'Save Allocation'}
                </button>
                <button
                  onClick={() => { setAllocatingStudent(null); setAllocationBreakdown(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Billing Dashboard Modal ── */}
        {showBillingDashboard && (
          <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
            <div className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl text-brand-dark">Billing Dashboard</h2>
                <button onClick={() => setShowBillingDashboard(false)} className="text-stone hover:text-brand transition">✕</button>
              </div>

              <div className="space-y-6">
                {/* Filters */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Filter by Term</label>
                    <select
                      value={billingTermId}
                      onChange={e => setBillingTermId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                    >
                      <option value="">All Terms</option>
                      {terms.map((term: any) => (
                        <option key={term.id} value={term.id}>{term.name} ({term.academic_year})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Filter by Status</label>
                    <select
                      value={billingStatus}
                      onChange={e => setBillingStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm"
                    >
                      <option value="">All Status</option>
                      <option value="PAID">Paid</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleLoadBillingDashboard}
                      disabled={loadingBilling}
                      className="px-6 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
                    >
                      {loadingBilling ? 'Loading...' : 'Apply Filters'}
                    </button>
                  </div>
                </div>

                {/* Summary Cards */}
                {billingData && (
                  <div className="grid sm:grid-cols-4 gap-4">
                    <div className="bg-cream-deep rounded-xl p-4 border border-stone/10">
                      <div className="text-sm text-stone mb-1">Total Students</div>
                      <div className="font-display text-2xl font-bold text-brand-dark">{billingData.totalStudents || 0}</div>
                    </div>
                    <div className="bg-cream-deep rounded-xl p-4 border border-stone/10">
                      <div className="text-sm text-stone mb-1">Total Fees</div>
                      <div className="font-display text-xl font-bold text-brand-dark">KES {(billingData.totalFees || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-cream-deep rounded-xl p-4 border border-stone/10">
                      <div className="text-sm text-stone mb-1">Total Paid</div>
                      <div className="font-display text-xl font-bold text-green-600">KES {(billingData.totalPaid || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-cream-deep rounded-xl p-4 border border-stone/10">
                      <div className="text-sm text-stone mb-1">Total Balance</div>
                      <div className="font-display text-xl font-bold text-red-500">KES {(billingData.totalBalance || 0).toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {/* Student Balances Table */}
                {billingData && billingData.balances && billingData.balances.length > 0 && (
                  <div className="bg-white rounded-xl border border-stone/10 overflow-hidden">
                    <h3 className="font-semibold text-brand-dark p-4 border-b border-stone/10">Student Balances</h3>
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left">Admission No.</th>
                            <th className="px-4 py-3 text-left">Student</th>
                            <th className="px-4 py-3 text-left">Term</th>
                            <th className="px-4 py-3 text-left">Total Fees</th>
                            <th className="px-4 py-3 text-left">Paid</th>
                            <th className="px-4 py-3 text-left">Balance</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone/10">
                          {billingData.balances.map((balance: any) => (
                            <tr key={balance.id} className="hover:bg-cream-deep/50 transition">
                              <td className="px-4 py-3 font-mono text-xs text-brand">{balance.student?.admission_no || '-'}</td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-brand-dark">{balance.student?.application?.surname} {balance.student?.application?.other_names}</div>
                              </td>
                              <td className="px-4 py-3 text-stone">{balance.term?.name}</td>
                              <td className="px-4 py-3">KES {balance.total_fees?.toLocaleString()}</td>
                              <td className="px-4 py-3 text-green-600">KES {balance.amount_paid?.toLocaleString()}</td>
                              <td className="px-4 py-3 text-red-500">KES {balance.balance?.toLocaleString()}</td>
                              <td className="px-4 py-3">{statusBadge(balance.status)}</td>
                              <td className="px-4 py-3">
                                {balance.student && (
                                  <button
                                    onClick={() => {
                                      setShowBillingDashboard(false);
                                      openAllocateFunds(balance.student, balance.term_id);
                                    }}
                                    className="text-xs px-2 py-1 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white transition"
                                  >
                                    🏷️ Allocate
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowBillingDashboard(false)}
                  className="w-full py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
