'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { applicationsApi, studentsApi, requisitionsApi, departmentsApi } from '@/lib/services';
import ChangePassword from '@/components/ChangePassword';

export default function DeptHeadDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [appTotal, setAppTotal] = useState(0);
  const [studentTotal, setStudentTotal] = useState(0);
  const [reqTotal, setReqTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'applications' | 'students' | 'requisitions'>('applications');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [updating, setUpdating] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqForm, setReqForm] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'DEPT_HEAD')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (tab === 'applications') {
      applicationsApi.getAll({ page, limit: 15 })
        .then(r => { setApplications(r.data.applications); setAppTotal(r.data.pagination.total); })
        .catch(() => {});
    } else if (tab === 'students') {
      studentsApi.getAll({ page, limit: 15 })
        .then(r => { setStudents(r.data.students); setStudentTotal(r.data.pagination.total); })
        .catch(() => {});
    } else if (tab === 'requisitions') {
      requisitionsApi.getAll()
        .then(r => { setRequisitions(r.data?.requisitions || []); setReqTotal(r.data?.requisitions?.length || 0); })
        .catch(() => {});
      departmentsApi.getAll()
        .then(r => setDepartments(Array.isArray(r.data) ? r.data : []))
        .catch(() => setDepartments([]));
    }
  }, [page, tab]);

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
    });
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await studentsApi.update(selectedStudent.id, editForm);
      const updated = await studentsApi.getAll({ page, limit: 15 });
      setStudents(updated.data.students);
      setStudentTotal(updated.data.pagination.total);
      setSelectedStudent(null);
      alert('Student profile updated successfully');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update student profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateRequisition = () => {
    setReqForm({ department_id: '', priority: 'MEDIUM', justification: '', items: [{ item_name: '', description: '', quantity: 1, unit_price: 0 }] });
    setShowReqModal(true);
  };

  const handleReqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const items = reqForm.items || [];
      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity || 0), 0);
      await requisitionsApi.create({
        department_id: reqForm.department_id,
        priority: reqForm.priority,
        justification: reqForm.justification,
        items: items.map((item: any) => ({
          item_name: item.item_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });
      setShowReqModal(false);
      requisitionsApi.getAll().then(r => { setRequisitions(r.data?.requisitions || []); setReqTotal(r.data?.requisitions?.length || 0); });
      alert('Requisition created successfully');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to create requisition');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReqItemChange = (index: number, field: string, value: any) => {
    const newItems = [...(reqForm.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setReqForm({ ...reqForm, items: newItems });
  };

  const handleAddReqItem = () => {
    setReqForm({ ...reqForm, items: [...(reqForm.items || []), { item_name: '', description: '', quantity: 1, unit_price: 0 }] });
  };

  const handleRemoveReqItem = (index: number) => {
    const newItems = [...(reqForm.items || [])];
    newItems.splice(index, 1);
    setReqForm({ ...reqForm, items: newItems });
  };

  const handleSubmitRequisition = async (id: string) => {
    try {
      await requisitionsApi.submit(id);
      requisitionsApi.getAll().then(r => { setRequisitions(r.data?.requisitions || []); setReqTotal(r.data?.requisitions?.length || 0); });
      alert('Requisition submitted for approval');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to submit requisition');
    }
  };

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
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="text-sm text-cream/60 hover:text-cream transition">Change Password</button>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm text-cream/60 hover:text-cream transition">Logout</button>
        </div>
      </header>

      <nav className="bg-white border-b border-stone/15 px-6 flex gap-1 overflow-x-auto">
        {[
          { key: 'applications', label: `📋 Department Applications (${appTotal})` },
          { key: 'students', label: `🎓 Enrolled Students (${studentTotal})` },
          { key: 'requisitions', label: `🛒 Purchase Requisitions (${reqTotal})` },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key as any); setPage(1); }}
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
            ) : tab === 'students' ? (
              <table className="w-full text-sm">
                <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Admission No.</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Course</th>
                    <th className="px-4 py-3 text-left">Level</th>
                    <th className="px-4 py-3 text-left">Intake</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/10">
                  {students.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-stone">No students enrolled yet.</td></tr>}
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
                        <button onClick={() => handleEditStudent(s)} className="text-brand hover:text-brand-dark font-medium text-xs transition">Edit Profile</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-brand-dark">Purchase Requisitions</h3>
                  <button onClick={handleCreateRequisition} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark transition">+ Create Requisition</button>
                </div>
                <div className="space-y-3">
                  {requisitions.length === 0 && <p className="text-stone text-center py-10">No requisitions found.</p>}
                  {requisitions.map(r => (
                    <div key={r.id} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-brand-dark">{r.requisition_no}</div>
                        <div className="text-sm text-stone">{r.department?.name} • {r.items?.length || 0} items • KES {r.total_amount?.toLocaleString()}</div>
                        <div className="text-xs mt-1">
                          <span className={`px-2 py-0.5 rounded-full ${r.status === 'APPROVED' ? 'bg-green-100 text-green-800' : r.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' : r.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : 'bg-stone/20 text-stone'}`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {r.status === 'DRAFT' && (
                          <button onClick={() => handleSubmitRequisition(r.id)} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 transition">
                            Submit
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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

      {/* Student Profile Edit Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
            <h2 className="font-display text-xl text-brand-dark mb-1">Edit Student Profile</h2>
            <p className="text-sm text-stone mb-4">{selectedStudent.admission_no} — {selectedStudent.application?.surname} {selectedStudent.application?.other_names}</p>
            
            <form onSubmit={handleUpdateStudent} className="flex-1 overflow-y-auto mb-5 pr-2 space-y-6">
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

              {/* Document Uploads - Only show when student has reported (ACTIVE status) */}
              {selectedStudent.status === 'ACTIVE' && (
                <div>
                  <h3 className="font-semibold text-brand-dark mb-3 border-b border-stone/10 pb-2">Document Uploads</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Student ID Copy (Front)</label>
                      <input type="file" accept="image/*" 
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Student ID Copy (Back)</label>
                      <input type="file" accept="image/*"
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Parent ID Copy (Front)</label>
                      <input type="file" accept="image/*"
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Parent ID Copy (Back)</label>
                      <input type="file" accept="image/*"
                        className="w-full px-3 py-2.5 rounded-xl border border-stone/25 focus:outline-none focus:border-brand text-sm" />
                    </div>
                  </div>
                </div>
              )}
            </form>

            <div className="flex gap-3 pt-4 border-t border-stone/10">
              <button type="submit" disabled={updating} onClick={handleUpdateStudent}
                className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setSelectedStudent(null)} className="flex-1 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requisition Creation Modal */}
      {showReqModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <h2 className="font-display text-xl text-brand-dark mb-4">Create Purchase Requisition</h2>
            <form onSubmit={handleReqSubmit} className="flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Department *</label>
                <select name="department_id" required value={reqForm.department_id || ''} onChange={(e) => setReqForm({...reqForm, department_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Priority</label>
                <select name="priority" value={reqForm.priority || 'MEDIUM'} onChange={(e) => setReqForm({...reqForm, priority: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Justification</label>
                <textarea name="justification" value={reqForm.justification || ''} onChange={(e) => setReqForm({...reqForm, justification: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" rows={3} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-brand-dark">Items</label>
                  <button type="button" onClick={handleAddReqItem} className="text-sm text-brand hover:text-brand-dark transition">+ Add Item</button>
                </div>
                {(reqForm.items || []).map((item: any, index: number) => (
                  <div key={index} className="p-4 bg-cream-deep/50 rounded-xl border border-stone/10 space-y-3 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-brand-dark">Item {index + 1}</span>
                      {index > 0 && <button type="button" onClick={() => handleRemoveReqItem(index)} className="text-sm text-red-600 hover:text-red-800 transition">Remove</button>}
                    </div>
                    <div>
                      <label className="block text-sm text-brand-dark mb-1">Item Name *</label>
                      <input type="text" required value={item.item_name || ''} onChange={(e) => handleReqItemChange(index, 'item_name', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone/25 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-brand-dark mb-1">Description</label>
                      <input type="text" value={item.description || ''} onChange={(e) => handleReqItemChange(index, 'description', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone/25 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-brand-dark mb-1">Quantity *</label>
                        <input type="number" required min="1" value={item.quantity || 1} onChange={(e) => handleReqItemChange(index, 'quantity', parseInt(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-stone/25 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm text-brand-dark mb-1">Unit Price (KES) *</label>
                        <input type="number" required min="0" value={item.unit_price || 0} onChange={(e) => handleReqItemChange(index, 'unit_price', parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-stone/25 text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </form>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setShowReqModal(false)} className="flex-1 py-2.5 rounded-xl border border-stone/25 text-stone hover:bg-stone/50 transition">Cancel</button>
              <button onClick={handleReqSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark transition disabled:opacity-50">{submitting ? 'Creating...' : 'Create Requisition'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
