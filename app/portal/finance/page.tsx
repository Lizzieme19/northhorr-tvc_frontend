'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { financeApi, feeTypesApi } from '@/lib/services';
import ChangePassword from '@/components/ChangePassword';

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
  const [selectedStudentBalance, setSelectedStudentBalance] = useState<any>(null);
  const [editingStudentFees, setEditingStudentFees] = useState<any>(null);
  const [studentFeeForm, setStudentFeeForm] = useState({ full_year_paid: false, fee_adjustment: '' });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'FINANCE')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    financeApi.getReports().then(r => setSummary(r.data)).catch(() => {});
    feeTypesApi.getAll({ is_active: 'true' }).then(r => setFeeTypes(r.data.fee_types || [])).catch(() => {});
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

  const markPaid = async (studentId: string, feeTypeId: string, amount?: number) => {
    setProcessing(`${studentId}-${feeTypeId}`);
    try {
      await api.patch(`/finance/students/${studentId}/fees`, { fee_type_id: feeTypeId, amount });
      // Refresh student list
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (feeCleared !== '') params.fee_cleared = feeCleared;
      const r = await financeApi.getFeeRecords(params);
      setStudents(r.data.students);
      // Update summary
      financeApi.getReports().then(r => setSummary(r.data));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to update fee');
    } finally { setProcessing(null); }
  };

  const viewStudentBalance = async (studentId: string) => {
    try {
      const r = await api.get(`/finance/students/${studentId}/balance`);
      setSelectedStudentBalance(r.data);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to fetch balance');
    }
  };

  const editStudentFees = (student: any) => {
    setEditingStudentFees(student);
    setStudentFeeForm({
      full_year_paid: student.full_year_paid || false,
      fee_adjustment: student.fee_adjustment?.toString() || '',
    });
  };

  const saveStudentFees = async () => {
    try {
      await api.patch(`/finance/students/${editingStudentFees.id}/fees`, {
        full_year_paid: studentFeeForm.full_year_paid,
        fee_adjustment: parseFloat(studentFeeForm.fee_adjustment) || 0,
      });
      alert('Student fee settings updated');
      setEditingStudentFees(null);
      // Refresh student list
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (feeCleared !== '') params.fee_cleared = feeCleared;
      const r = await financeApi.getFeeRecords(params);
      setStudents(r.data.students);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to update student fees');
    }
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
            { label: 'Total Collected', value: `KES ${summary?.totalCollected ?? 0}`, icon: '�' },
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
                  <th className="px-4 py-3 text-left">Admission</th>
                  <th className="px-4 py-3 text-left">Student ID</th>
                  <th className="px-4 py-3 text-left">KUCCPS</th>
                  <th className="px-4 py-3 text-left">Tuition</th>
                  <th className="px-4 py-3 text-left">Balance</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                  <th className="px-4 py-3 text-left">Print ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/10">
                {students.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-stone">No records found</td></tr>}
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-cream-deep/50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-brand">{s.admission_no}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-dark">{s.application.surname} {s.application.other_names}</div>
                      <div className="text-xs text-stone">{s.course.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      {s.admission_fee_paid ? <span className="text-green-600 font-medium">Paid</span> : (
                        <button onClick={() => {
                          const admissionFeeType = feeTypes.find(ft => ft.code === 'ADMISSION');
                          if (admissionFeeType) markPaid(s.id, admissionFeeType.id, admissionFeeType.amount);
                        }} disabled={!!processing}
                          className="text-xs px-3 py-1 rounded-full bg-brand/10 text-brand hover:bg-brand hover:text-white transition disabled:opacity-50">
                          {processing === `${s.id}-ADMISSION` ? '...' : 'Mark Paid'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.student_id_fee_paid ? <span className="text-green-600 font-medium">Paid</span> : (
                        <button onClick={() => {
                          const idFeeType = feeTypes.find(ft => ft.code === 'STUDENT_ID');
                          if (idFeeType) markPaid(s.id, idFeeType.id, idFeeType.amount);
                        }} disabled={!!processing}
                          className="text-xs px-3 py-1 rounded-full bg-brand/10 text-brand hover:bg-brand hover:text-white transition disabled:opacity-50">
                          {processing === `${s.id}-STUDENT_ID` ? '...' : 'Mark Paid'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.application.type === 'KUCCPS' ? <span className="text-stone text-xs border border-stone/20 px-2 py-0.5 rounded-full">N/A</span> : 
                        s.kuccps_fee_paid ? <span className="text-green-600 font-medium">Paid</span> : (
                          <button onClick={() => {
                            const kuccpsFeeType = feeTypes.find(ft => ft.code === 'KUCCPS');
                            if (kuccpsFeeType) markPaid(s.id, kuccpsFeeType.id, kuccpsFeeType.amount);
                          }} disabled={!!processing}
                            className="text-xs px-3 py-1 rounded-full bg-brand/10 text-brand hover:bg-brand hover:text-white transition disabled:opacity-50">
                            {processing === `${s.id}-KUCCPS` ? '...' : 'Mark Paid'}
                          </button>
                        )
                      }
                    </td>
                    <td className="px-4 py-3">
                      {s.tuition_fee_paid ? <span className="text-green-600 font-medium">Paid</span> : (
                        <button onClick={() => {
                          const tuitionFeeType = feeTypes.find(ft => ft.code === 'TUITION');
                          if (tuitionFeeType) markPaid(s.id, tuitionFeeType.id, tuitionFeeType.amount);
                        }} disabled={!!processing}
                          className="text-xs px-3 py-1 rounded-full bg-brand/10 text-brand hover:bg-brand hover:text-white transition disabled:opacity-50">
                          {processing === `${s.id}-TUITION` ? '...' : 'Mark Paid'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => viewStudentBalance(s.id)} className="text-xs text-brand hover:underline">View Balance</button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => editStudentFees(s)} className="text-xs text-brand hover:underline">Edit Fees</button>
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

        {/* Student Balance Modal */}
        {selectedStudentBalance && (
          <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="font-display text-xl text-brand-dark mb-4">Student Balance</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <span className="text-stone">Admission No:</span>
                  <span className="font-medium text-brand-dark">{selectedStudentBalance.student.admission_no}</span>
                </div>
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <span className="text-stone">Course:</span>
                  <span className="font-medium text-brand-dark">{selectedStudentBalance.student.course}</span>
                </div>
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <span className="text-stone">Total Fees:</span>
                  <span className="font-medium text-brand-dark">KES {selectedStudentBalance.total_fees}</span>
                </div>
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <span className="text-stone">Amount Paid:</span>
                  <span className="font-medium text-green-600">KES {selectedStudentBalance.amount_paid}</span>
                </div>
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <span className="text-stone">Balance:</span>
                  <span className={`font-bold ${selectedStudentBalance.balance <= 0 ? 'text-green-600' : 'text-red-600'}`}>KES {selectedStudentBalance.balance}</span>
                </div>
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <span className="text-stone">Status:</span>
                  <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                    selectedStudentBalance.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    selectedStudentBalance.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>{selectedStudentBalance.status}</span>
                </div>
                {selectedStudentBalance.fee_records && selectedStudentBalance.fee_records.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-brand-dark mb-2">Recent Payments</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedStudentBalance.fee_records.map((record: any) => (
                        <div key={record.id} className="text-xs bg-stone/5 p-2 rounded">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{record.feeType?.name || record.fee_type}</div>
                            <div className="text-stone font-mono text-[10px]">{record.reference_code || ''}</div>
                          </div>
                          <div className="text-stone">KES {record.amount} • {new Date(record.paid_at).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedStudentBalance(null)} className="mt-6 w-full py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Edit Student Fees Modal */}
        {editingStudentFees && (
          <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="font-display text-xl text-brand-dark mb-4">Edit Student Fee Settings</h2>
              <div className="space-y-4 text-sm">
                <div className="border-b border-stone/10 pb-2">
                  <span className="text-stone">Admission No:</span>
                  <span className="font-medium text-brand-dark ml-2">{editingStudentFees.admission_no}</span>
                </div>
                <div className="border-b border-stone/10 pb-2">
                  <span className="text-stone">Student:</span>
                  <span className="font-medium text-brand-dark ml-2">{editingStudentFees.application.surname} {editingStudentFees.application.other_names}</span>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={studentFeeForm.full_year_paid}
                      onChange={e => setStudentFeeForm({...studentFeeForm, full_year_paid: e.target.checked})}
                      className="w-4 h-4 rounded border-stone/25"
                    />
                    <span className="text-brand-dark">Full Year Paid</span>
                  </label>
                  <p className="text-xs text-stone mt-1">Mark if student has paid for the full academic year</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Fee Adjustment (KES)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={studentFeeForm.fee_adjustment}
                    onChange={e => setStudentFeeForm({...studentFeeForm, fee_adjustment: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
                    placeholder="e.g. 5000"
                  />
                  <p className="text-xs text-stone mt-1">Discount or waiver amount to apply</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={saveStudentFees} className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition">
                  Save Changes
                </button>
                <button onClick={() => setEditingStudentFees(null)} className="flex-1 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
