'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { applicationsApi, studentsApi } from '@/lib/services';
import ChangePassword from '@/components/ChangePassword';

export default function DeptHeadDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [appTotal, setAppTotal] = useState(0);
  const [studentTotal, setStudentTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'applications' | 'students'>('applications');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'DEPT_HEAD')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (tab === 'applications') {
      applicationsApi.getAll({ page, limit: 15 })
        .then(r => { setApplications(r.data.applications); setAppTotal(r.data.pagination.total); })
        .catch(() => {});
    } else {
      studentsApi.getAll({ page, limit: 15 })
        .then(r => { setStudents(r.data.students); setStudentTotal(r.data.pagination.total); })
        .catch(() => {});
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
    </div>
  );
}
