'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import ChangePassword from '@/components/ChangePassword';

export default function StudentDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'STUDENT')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      api.get('/students/me').then(r => {
        setProfile(r.data);
        setEditForm({
          phone: r.data.application?.phone || '',
          address: r.data.application?.address || '',
          id_number: r.data.application?.id_number || '',
          emergency_contact_name: r.data.application?.emergency_person || '',
          emergency_contact_phone: r.data.application?.emergency_phone || '',
        });
      }).catch(console.error);
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.patch('/students/me', editForm);
      const updated = await api.get('/students/me');
      setProfile(updated.data);
      setShowProfileEdit(false);
      alert('Profile updated successfully');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !user || !profile) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-cream-deep">
      <header className="bg-brand-dark text-cream px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gold grid place-items-center font-display font-bold text-brand-dark text-sm">NT</div>
          <span className="font-display font-semibold">Student Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-2 py-1 rounded-full bg-cream/20 text-cream text-xs font-semibold">{profile.admission_no}</span>
          <button onClick={() => setShowProfileEdit(!showProfileEdit)} className="text-sm text-cream/60 hover:text-cream transition">Edit Profile</button>
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="text-sm text-cream/60 hover:text-cream transition">Change Password</button>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm text-cream/60 hover:text-cream transition">Logout</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {showProfileEdit && (
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 border border-stone/10">
            <h2 className="font-display text-2xl text-brand-dark mb-6">Edit Profile</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">ID Number</label>
                <input
                  type="text"
                  value={editForm.id_number}
                  onChange={(e) => setEditForm({ ...editForm, id_number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Emergency Contact Name</label>
                <input
                  type="text"
                  value={editForm.emergency_contact_name}
                  onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Emergency Contact Phone</label>
                <input
                  type="text"
                  value={editForm.emergency_contact_phone}
                  onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-brand/20 transition text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-3 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition shadow-lg disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="px-6 py-3 rounded-full text-brand font-semibold hover:bg-brand/10 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {showPasswordChange && (
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 border border-stone/10">
            <h2 className="font-display text-2xl text-brand-dark mb-6">Change Password</h2>
            <ChangePassword />
            <button
              onClick={() => setShowPasswordChange(false)}
              className="mt-4 text-sm text-stone hover:text-brand transition"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone/10">
          <div className="bg-brand p-8 text-cream relative">
            <div className="absolute top-0 right-0 p-8 opacity-20 text-6xl">🎓</div>
            <h1 className="font-display text-3xl font-bold mb-2">Welcome, {profile.application.surname} {profile.application.other_names}</h1>
            <p className="text-cream/80">{profile.course.name} • {profile.level}</p>
          </div>

          <div className="p-8 grid sm:grid-cols-2 gap-8">
            <div>
              <h2 className="text-sm font-semibold text-terracotta uppercase tracking-widest mb-4">Academic Profile</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <dt className="text-stone">Admission Number</dt>
                  <dd className="font-medium text-brand-dark">{profile.admission_no}</dd>
                </div>
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <dt className="text-stone">Department</dt>
                  <dd className="font-medium text-brand-dark">{profile.department.name}</dd>
                </div>
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <dt className="text-stone">Intake</dt>
                  <dd className="font-medium text-brand-dark">{profile.intake} {profile.year}</dd>
                </div>
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <dt className="text-stone">Status</dt>
                  <dd className="font-medium text-green-600">{profile.status}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-terracotta uppercase tracking-widest mb-4">Documents</h2>
              
              <div className="space-y-3">
                {/* Pre-admission documents - always available */}
                <div className="bg-cream-deep rounded-xl p-4 border border-stone/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-brand-dark text-sm">Admission for Training Form</span>
                    <a href="/Admission for Training.docx" download className="text-xs px-3 py-1 bg-brand text-cream rounded-full hover:bg-brand-dark transition">Download</a>
                  </div>
                  <p className="text-xs text-stone">Required for all applicants - fill and submit with your application.</p>
                </div>

                <div className="bg-cream-deep rounded-xl p-4 border border-stone/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-brand-dark text-sm">Fee Structure</span>
                    <a href="/FEE STRUCTURE.docx" download className="text-xs px-3 py-1 bg-brand text-cream rounded-full hover:bg-brand-dark transition">Download</a>
                  </div>
                  <p className="text-xs text-stone">Current fee structure for all programs.</p>
                </div>

                <div className="bg-cream-deep rounded-xl p-4 border border-stone/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-brand-dark text-sm">Medical Examination Form</span>
                    <a href="/STUDENTS ENTRANCE MEDICAL EXAMINATION FORM.docx" download className="text-xs px-3 py-1 bg-brand text-cream rounded-full hover:bg-brand-dark transition">Download</a>
                  </div>
                  <p className="text-xs text-stone">Required medical examination form for all students.</p>
                </div>

                {/* Post-admission documents - only available after admission */}
                <div className="bg-cream-deep rounded-xl p-4 border border-stone/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-brand-dark text-sm">Letter of Acceptance</span>
                    {profile.admission_letter ? (
                      <a href={profile.admission_letter.letter_url} target="_blank" className="text-xs px-3 py-1 bg-green-600 text-cream rounded-full hover:bg-green-700 transition">Download PDF</a>
                    ) : (
                      <span className="text-xs px-3 py-1 bg-stone/20 text-stone rounded-full">Pending Admission</span>
                    )}
                  </div>
                  <p className="text-xs text-stone">Official admission letter - available after admission approval.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-terracotta uppercase tracking-widest mb-4">Fee Status</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <dt className="text-stone">Admission Fee (1500)</dt>
                  <dd className="font-medium">{profile.admission_fee_paid ? <span className="text-green-600">Paid ✅</span> : <span className="text-red-500">Pending</span>}</dd>
                </div>
                <div className="flex justify-between border-b border-stone/10 pb-2">
                  <dt className="text-stone">Student ID Fee (500)</dt>
                  <dd className="font-medium">{profile.student_id_fee_paid ? <span className="text-green-600">Paid ✅</span> : <span className="text-red-500">Pending</span>}</dd>
                </div>
                {profile.application.type === 'DIRECT' && (
                  <div className="flex justify-between border-b border-stone/10 pb-2">
                    <dt className="text-stone">KUCCPS Fee (500)</dt>
                    <dd className="font-medium">{profile.kuccps_fee_paid ? <span className="text-green-600">Paid ✅</span> : <span className="text-red-500">Pending</span>}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-xl text-xs border border-blue-100">
                ℹ️ Fee payments are processed at the Finance Office on campus. Present your HELB application evidence there as well.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
