'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { leavesApi } from '@/lib/services';
import ChangePassword from '@/components/ChangePassword';

export default function StaffDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leave_type: '', start_date: '', end_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'STAFF')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'STAFF') {
      api.get('/staff/me').then(r => setProfile(r.data)).catch(() => {});
      leavesApi.getAll().then(r => setLeaves(r.data || [])).catch(() => setLeaves([]));
    }
  }, [user]);

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await leavesApi.create(leaveForm);
      setShowLeaveForm(false);
      setLeaveForm({ leave_type: '', start_date: '', end_date: '', reason: '' });
      leavesApi.getAll().then(r => setLeaves(r.data || []));
      alert('Leave request submitted successfully');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-cream-deep">
      <header className="bg-brand-dark text-cream px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gold grid place-items-center font-display font-bold text-brand-dark text-sm">NT</div>
          <span className="font-display font-semibold hidden sm:block">Staff Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-cream/70 text-sm hidden md:block">{user.email}</span>
          <span className="px-2 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold">STAFF</span>
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="text-sm text-cream/60 hover:text-cream transition">Change Password</button>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm text-cream/60 hover:text-cream transition">Logout</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {showPasswordChange && (
          <div className="bg-white rounded-2xl p-6 mb-6 border border-stone/10 shadow-sm">
            <h2 className="font-display text-xl text-brand-dark mb-4">Change Password</h2>
            <ChangePassword />
            <button onClick={() => setShowPasswordChange(false)} className="mt-4 text-sm text-stone hover:text-brand transition">Cancel</button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone/10 mb-6">
          <div className="bg-brand p-6 text-cream">
            <h1 className="font-display text-2xl font-bold">Welcome, {profile?.name || 'Staff Member'}</h1>
            <p className="text-cream/80">{profile?.designation?.title || 'Staff'} • {profile?.department?.name || 'General'}</p>
          </div>
          <div className="p-6 grid sm:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-terracotta uppercase tracking-widest mb-4">Personal Information</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <dt className="text-stone">Email</dt>
                  <dd className="font-medium text-brand-dark">{profile?.email}</dd>
                </div>
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <dt className="text-stone">Phone</dt>
                  <dd className="font-medium text-brand-dark">{profile?.phone}</dd>
                </div>
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <dt className="text-stone">Employee ID</dt>
                  <dd className="font-medium text-brand-dark">{profile?.employee_id}</dd>
                </div>
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <dt className="text-stone">Date Hired</dt>
                  <dd className="font-medium text-brand-dark">{profile?.date_hired ? new Date(profile.date_hired).toLocaleDateString() : '—'}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-terracotta uppercase tracking-widest mb-4">Leave Balance</h2>
              <div className="bg-cream-deep rounded-xl p-5 border border-stone/10">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-brand-dark">Annual Leave</span>
                  <span className="font-bold text-brand">{profile?.leave_balance || 0} days</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-brand-dark">Sick Leave</span>
                  <span className="font-bold text-brand">{profile?.sick_leave_balance || 0} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-brand-dark">Leave Requests</h2>
            <button onClick={() => setShowLeaveForm(!showLeaveForm)} className="px-4 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition">
              {showLeaveForm ? 'Cancel' : '+ New Request'}
            </button>
          </div>

          {showLeaveForm && (
            <form onSubmit={handleLeaveSubmit} className="mb-6 p-4 bg-cream-deep/50 rounded-xl border border-stone/10">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">Leave Type</label>
                  <select value={leaveForm.leave_type} onChange={e => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" required>
                    <option value="">Select type</option>
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="MATERNITY">Maternity Leave</option>
                    <option value="PATERNITY">Paternity Leave</option>
                    <option value="COMPASSIONATE">Compassionate Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">Start Date</label>
                  <input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">End Date</label>
                  <input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" required />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-dark mb-1">Reason</label>
                <textarea value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  rows={2} className="w-full px-3 py-2 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm resize-none" required />
              </div>
              <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {leaves.length === 0 ? <p className="text-stone">No leave requests found</p> :
              leaves.map(l => (
                <div key={l.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-brand-dark">{l.type}</div>
                      <div className="text-sm text-stone">{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.status === 'APPROVED' ? 'bg-green-100 text-green-800' : l.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : l.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-stone/20 text-stone'}`}>
                      {l.status}
                    </span>
                  </div>
                  {l.reason && <div className="text-xs text-stone mt-2">{l.reason}</div>}
                </div>
              ))
            }
          </div>
        </div>
      </main>
    </div>
  );
}
