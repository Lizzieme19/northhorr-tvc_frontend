'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { staffApi, designationsApi, leavesApi } from '@/lib/services';
import ChangePassword from '@/components/ChangePassword';

export default function HRDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [tab, setTab] = useState<'staff' | 'designations' | 'leaves'>('staff');
  const [staff, setStaff] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'HR')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    staffApi.getAll().then(r => setStaff(r.data?.staff || r.data || [])).catch(() => {});
    designationsApi.getAll().then(r => setDesignations(r.data || [])).catch(() => {});
    leavesApi.getAll().then(r => setLeaves(r.data || [])).catch(() => {});
  }, []);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id: string, api: any) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(id);
      if (tab === 'staff') staffApi.getAll().then(r => setStaff(r.data?.staff || r.data || []));
      if (tab === 'designations') designationsApi.getAll().then(r => setDesignations(r.data || []));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (tab === 'staff') {
        if (editingItem) {
          await staffApi.update(editingItem.id, formData);
        } else {
          await staffApi.create(formData);
        }
        staffApi.getAll().then(r => setStaff(r.data || []));
      } else if (tab === 'designations') {
        if (editingItem) {
          await designationsApi.update(editingItem.id, formData);
        } else {
          await designationsApi.create(formData);
        }
        designationsApi.getAll().then(r => setDesignations(r.data || []));
      }
      setShowModal(false);
      setFormData({});
      setEditingItem(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveAction = async (id: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      if (action === 'approve') {
        await leavesApi.approve(id, { notes });
      } else {
        await leavesApi.reject(id, { notes });
      }
      leavesApi.getAll().then(r => setLeaves(r.data || []));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update leave request');
    }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-cream-deep">
      <header className="bg-brand-dark text-cream px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gold grid place-items-center font-display font-bold text-brand-dark text-sm">NT</div>
          <span className="font-display font-semibold hidden sm:block">HR Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-cream/70 text-sm hidden md:block">{user.email}</span>
          <span className="px-2 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold">HR</span>
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="text-sm text-cream/60 hover:text-cream transition">Change Password</button>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm text-cream/60 hover:text-cream transition">Logout</button>
        </div>
      </header>

      <nav className="bg-white border-b border-stone/15 px-6 flex gap-1 overflow-x-auto">
        {[
          { key: 'staff', label: `👥 Staff (${staff.length})` },
          { key: 'designations', label: `📋 Designations (${designations.length})` },
          { key: 'leaves', label: `🏖️ Leave Requests (${leaves.length})` },
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

        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-brand-dark capitalize">{tab}</h2>
            {(tab === 'staff' || tab === 'designations') && (
              <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition">
                + Add New
              </button>
            )}
          </div>
          {tab === 'staff' && (
            <div className="space-y-4">
              {staff.length === 0 ? <p className="text-stone">No staff members found</p> :
                staff.map(s => (
                  <div key={s.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-brand-dark">{s.first_name} {s.last_name}</div>
                      <div className="text-sm text-stone">{s.email} • {s.phone}</div>
                      <div className="text-xs mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand">{s.designation?.title || 'No designation'}</span>
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-gold/10 text-gold">{s.department?.name || 'No department'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(s)} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(s.id, staffApi)} className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          {tab === 'designations' && (
            <div className="space-y-4">
              {designations.length === 0 ? <p className="text-stone">No designations found</p> :
                designations.map(d => (
                  <div key={d.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-brand-dark">{d.title}</div>
                      <div className="text-sm text-stone">Grade: {d.grade} • Salary Range: KES {d.min_salary} - {d.max_salary}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(d)} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(d.id, designationsApi)} className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          {tab === 'leaves' && (
            <div className="space-y-4">
              {leaves.length === 0 ? <p className="text-stone">No leave requests found</p> :
                leaves.map(l => (
                  <div key={l.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-brand-dark">{l.staff?.first_name} {l.staff?.last_name || 'Unknown'}</div>
                      <div className="text-sm text-stone">{l.type} • {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</div>
                      <div className="text-xs mt-1">
                        <span className={`px-2 py-0.5 rounded-full ${l.status === 'APPROVED' ? 'bg-green-100 text-green-800' : l.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : l.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-stone/20 text-stone'}`}>
                          {l.status}
                        </span>
                      </div>
                    </div>
                    {l.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleLeaveAction(l.id, 'approve')} className="px-3 py-1 rounded-lg bg-green-100 text-green-800 text-sm hover:bg-green-200 transition">
                          Approve
                        </button>
                        <button onClick={() => handleLeaveAction(l.id, 'reject')} className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-sm hover:bg-red-200 transition">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <h2 className="font-display text-xl text-brand-dark mb-4">{editingItem ? 'Edit' : 'Create'} {tab.slice(0, -1)}</h2>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
              {tab === 'staff' && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">First Name *</label>
                      <input name="first_name" required value={formData.first_name || ''} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Last Name *</label>
                      <input name="last_name" required value={formData.last_name || ''} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Employee Number *</label>
                    <input name="employee_number" required value={formData.employee_number || ''} onChange={(e) => setFormData({...formData, employee_number: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email *</label>
                    <input name="email" type="email" required value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Phone</label>
                    <input name="phone" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Designation ID</label>
                    <input name="designation_id" value={formData.designation_id || ''} onChange={(e) => setFormData({...formData, designation_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Department ID</label>
                    <input name="department_id" value={formData.department_id || ''} onChange={(e) => setFormData({...formData, department_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Employment Type</label>
                      <select name="employment_type" value={formData.employment_type || ''} onChange={(e) => setFormData({...formData, employment_type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                        <option value="">Select...</option>
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Employment Date</label>
                      <input name="employment_date" type="date" value={formData.employment_date || ''} onChange={(e) => setFormData({...formData, employment_date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Salary</label>
                    <input name="salary" type="number" value={formData.salary || ''} onChange={(e) => setFormData({...formData, salary: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                </>
              )}
              {tab === 'designations' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Title *</label>
                    <input name="title" required value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Grade</label>
                    <input name="grade" value={formData.grade || ''} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Min Salary</label>
                      <input name="min_salary" type="number" value={formData.min_salary || ''} onChange={(e) => setFormData({...formData, min_salary: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Max Salary</label>
                      <input name="max_salary" type="number" value={formData.max_salary || ''} onChange={(e) => setFormData({...formData, max_salary: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Description</label>
                    <textarea name="description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" rows={3} />
                  </div>
                </>
              )}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-stone/25 text-stone font-semibold hover:bg-stone/5 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                  {submitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
