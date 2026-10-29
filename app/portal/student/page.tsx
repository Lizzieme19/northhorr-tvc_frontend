'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import ChangePassword from '@/components/ChangePassword';
import { downloadStudentDocument } from '@/components/StudentDocuments';
import { StudentHistoryPanel } from '@/components/StudentHistory';
import { termDates, termFee, termState } from '@/lib/terms';
import { studentDocumentsApi } from '@/lib/services';
import { toast } from 'sonner';

export default function StudentDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [updating, setUpdating] = useState(false);
  const [terms, setTerms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [downloadingIDCard, setDownloadingIDCard] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [feeSummary, setFeeSummary] = useState<any>(null);
  const [loadingFeeSummary, setLoadingFeeSummary] = useState(false);
  const [showFeeSummary, setShowFeeSummary] = useState(false);
  const [userNeedsPasswordChange, setUserNeedsPasswordChange] = useState(false);
  const [withinWindow, setWithinWindow] = useState(true);
  const [windowEnd, setWindowEnd] = useState<Date | null>(null);

  // Document upload state
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({
    medical_report: null,
    kcse_certificate: null,
    birth_certificate: null,
    other_documents: null,
  });
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);

  // Documents the college has issued to this student; the rest stay locked until issued
  const [issuedDocs, setIssuedDocs] = useState<any[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);

  useEffect(() => {
    if (!profile) return;
    studentDocumentsApi.getMine()
      .then(r => setIssuedDocs(r.data.documents || []))
      .catch(() => { })
      .finally(() => setDocsLoaded(true));
  }, [profile?.id]);

  const handleDownloadDocument = async (slug: string, mode: 'download' | 'view' = 'download') => {
    setDownloadingDoc(`${slug}:${mode}`);
    try {
      await downloadStudentDocument(profile.id, slug, `${slug}_${profile.admission_no}.pdf`, { mode });
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handleDownloadIDCard = async () => {
    setDownloadingIDCard(true);
    try {
      const response = await api.get('/students/me/id-card', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ID-${profile.admission_no}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to download ID card. Please ensure you have uploaded a profile picture with white background.');
    } finally {
      setDownloadingIDCard(false);
    }
  };

  const handleProfilePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePhoto) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', profilePhoto);

      const response = await api.patch('/students/me/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updated = await api.get('/students/me');
      setProfile(updated.data);
      setProfilePhoto(null);
      toast.success('Profile picture uploaded successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to upload profile picture. Please ensure it has a white background.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== 'STUDENT')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'STUDENT' && !user.mustChangePassword) {
      api.get('/students/me').then(r => {
        setProfile(r.data);
        setEditForm({
          // Personal identity
          email: r.data.user?.email || '',
          surname: r.data.application?.surname || '',
          other_names: r.data.application?.other_names || '',
          gender: r.data.application?.gender || '',
          date_of_birth: r.data.application?.date_of_birth
            ? new Date(r.data.application.date_of_birth).toISOString().split('T')[0]
            : '',
          // Contact
          phone: r.data.application?.phone || '',
          address: r.data.application?.address || '',
          id_number: r.data.application?.id_number || '',
          // Emergency
          emergency_contact_name: r.data.application?.emergency_person || '',
          emergency_contact_phone: r.data.application?.emergency_phone || '',
          // Father
          father_name: r.data.application?.father_name || '',
          father_phone: r.data.application?.father_phone || '',
          father_email: r.data.application?.father_email || '',
          father_occupation: r.data.application?.father_occupation || '',
          father_present: r.data.application?.father_present ?? true,
          // Mother
          mother_name: r.data.application?.mother_name || '',
          mother_phone: r.data.application?.mother_phone || '',
          mother_email: r.data.application?.mother_email || '',
          mother_occupation: r.data.application?.mother_occupation || '',
          mother_present: r.data.application?.mother_present ?? true,
          // Guardian (fallback)
          parent_names: r.data.application?.parent_names || '',
          parent_phone: r.data.application?.parent_phone || '',
          parent_email: r.data.application?.parent_email || '',
          parent_relationship: r.data.application?.parent_relationship || '',
        });
        // Fetch editing deadline from DB (admin can change without redeploy)
        api.get('/settings/student_edit_deadline').then(s => {
          const wEnd = new Date(s.data.value);
          setWindowEnd(wEnd);
          setWithinWindow(new Date() <= wEnd);
        }).catch(() => {
          // Fallback if setting endpoint fails
          const wEnd = new Date('2026-10-30T20:59:59.000Z');
          setWindowEnd(wEnd);
          setWithinWindow(new Date() <= wEnd);
        });
      }).catch(console.error);

      // Fetch active terms
      api.get('/terms').then(r => {
        const list = r.data.terms || r.data;
        setTerms(Array.isArray(list) ? list.filter((t: any) => t.is_active) : []);
      }).catch(console.error);

      // Fetch current enrollments
      api.get('/fees/students/me/enrollments').then(r => {
        setEnrollments(Array.isArray(r.data) ? r.data : []);
      }).catch(console.error);
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await api.patch('/students/me', editForm);
      // Server may update withinWindow status
      if (res.data.windowEnd) {
        const wEnd = new Date(res.data.windowEnd);
        setWindowEnd(wEnd);
        setWithinWindow(new Date() <= wEnd);
      }
      const updated = await api.get('/students/me');
      setProfile(updated.data);
      setShowProfileEdit(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      if (err?.response?.status === 403 && err?.response?.data?.windowExpired) {
        toast.error(err.response.data.error);
        setWithinWindow(false);
      } else {
        toast.error(err?.response?.data?.error || 'Failed to update profile');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleEnrollTerm = async (termId: string) => {
    if (!confirm('Are you sure you want to enroll in this term? This may have fee implications.')) return;
    setEnrolling(termId);
    try {
      await api.post(`/students/me/enroll/${termId}`);
      toast.success('Enrolled successfully!');

      // Refresh enrollments
      const updated = await api.get('/students/me/enrollments');
      setEnrollments(Array.isArray(updated.data) ? updated.data : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to enroll in term');
    } finally {
      setEnrolling(null);
    }
  };

  const handlePasswordChanged = () => {
    setUserNeedsPasswordChange(false);
    // Reload user data to get updated mustChangePassword status
    api.get('/auth/me').then(r => {
      // Update user state through auth context would be ideal, but for now reload page
      setTimeout(() => {
        router.refresh();
      }, 500);
    }).catch(console.error);
  };

  const handleViewFeeSummary = async () => {
    setLoadingFeeSummary(true);
    try {
      const r = await api.get(`/fees/students/${profile.id}/summary`);
      setFeeSummary(r.data);
      setShowFeeSummary(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to fetch fee summary');
    } finally {
      setLoadingFeeSummary(false);
    }
  };

  const handleUploadDocuments = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasFiles = Object.values(docFiles).some(f => f !== null);
    if (!hasFiles) {
      toast.warning('Please select at least one document to upload');
      return;
    }
    setUploadingDocs(true);
    try {
      const formData = new FormData();
      Object.entries(docFiles).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });
      await api.patch('/students/me/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = await api.get('/students/me');
      setProfile(updated.data);
      setDocFiles({ medical_report: null, kcse_certificate: null, birth_certificate: null, other_documents: null });
      setShowDocUpload(false);
      toast.success('Documents uploaded successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to upload documents');
    } finally {
      setUploadingDocs(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" /></div>;

  // Show password change screen if required
  if (user.mustChangePassword) {
    return (
      <div className="min-h-screen bg-cream-deep flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-stone/10">
          <div className="text-center mb-6">
            <div className="h-16 w-16 rounded-full bg-brand/10 grid place-items-center mx-auto mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="font-display text-2xl text-brand-dark mb-2">Change Your Password</h1>
            <p className="text-stone text-sm">You must change your password before accessing your student portal.</p>
          </div>
          <ChangePassword onPasswordChanged={handlePasswordChanged} />
        </div>
      </div>
    );
  }

  if (!profile) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-cream-deep">
      <header className="bg-brand-dark text-cream px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          {profile.profile_picture_url ? (
            <img
              src={profile.profile_picture_url}
              alt="Profile"
              className="h-9 w-9 rounded-xl object-cover border-2 border-gold/50"
            />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-gold grid place-items-center font-display font-bold text-brand-dark text-sm">NT</div>
          )}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-brand-dark">Edit Profile</h2>
              {windowEnd && (
                withinWindow ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-amber-600 text-lg">⏳</span>
                    <div>
                      <div className="text-xs font-semibold text-amber-800">Editing window open</div>
                      <div className="text-xs text-amber-700">
                        Closes {windowEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200">
                    <span className="text-red-500 text-lg">🔒</span>
                    <div>
                      <div className="text-xs font-semibold text-red-800">Personal info locked</div>
                      <div className="text-xs text-red-600">Only photo &amp; email editable</div>
                    </div>
                  </div>
                )
              )}
            </div>

            {!withinWindow && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex gap-3">
                <span className="text-red-500 text-xl mt-0.5">🔒</span>
                <div>
                  <div className="font-semibold text-red-800 mb-1">Editing deadline has passed</div>
                  <p className="text-sm text-red-700">
                    The deadline to update personal and parent details was <strong>{windowEnd?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                    Only your <strong>profile photo</strong> and <strong>email address</strong> can still be changed.
                    For any other corrections, please visit the <strong>Registrar's Office</strong>.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-6">

              {/* ── Profile Photo (always editable) ── */}
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Profile Photo <span className="text-xs font-normal text-green-600">(always editable)</span></label>
                <div className="space-y-2">
                  {profile.profile_picture_url && (
                    <img src={profile.profile_picture_url} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-stone/20" />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                    />
                    {profilePhoto && (
                      <button
                        type="button"
                        onClick={handleProfilePhotoUpload}
                        disabled={uploadingPhoto}
                        className="mt-2 px-4 py-2 rounded-full bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition disabled:opacity-50"
                      >
                        {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-stone">Passport-style photo with white background (min 300×300 px, max 5 MB)</p>
                </div>
              </div>

              {/* ── Email (always editable) ── */}
              {editForm.email?.endsWith('@northhorrtvc.ac.ke') && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex gap-2">
                  <span>⚠️</span>
                  <span>Your login email is an auto-generated placeholder. Please update it to your real email so you can receive notifications.</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email Address <span className="text-xs font-normal text-green-600">(always editable)</span></label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                  placeholder="yourname@example.com"
                />
                <p className="text-xs text-stone mt-1">This becomes your login email. Must be unique.</p>
              </div>

              {/* ── Personal Info (window-gated) ── */}
              <fieldset disabled={!withinWindow} className="space-y-4 disabled:opacity-50">
                <legend className="font-display text-base font-semibold text-brand-dark flex items-center gap-2 mb-3">
                  Personal Information
                  {!withinWindow && <span className="text-xs font-normal px-2 py-0.5 bg-red-100 text-red-600 rounded-full">🔒 Locked</span>}
                </legend>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">First Name</label>
                    <input
                      type="text"
                      value={editForm.surname || ''}
                      onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm disabled:bg-stone/10"
                      placeholder="e.g. Abdi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Other Names</label>
                    <input
                      type="text"
                      value={editForm.other_names || ''}
                      onChange={(e) => setEditForm({ ...editForm, other_names: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                      placeholder="e.g. Roba Hassan"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Gender</label>
                    <select
                      value={editForm.gender || ''}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.date_of_birth || ''}
                      onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Phone Number</label>
                    <input type="text" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">ID Number</label>
                    <input type="text" value={editForm.id_number || ''} onChange={(e) => setEditForm({ ...editForm, id_number: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">Address</label>
                  <input type="text" value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Emergency Contact Name</label>
                    <input type="text" value={editForm.emergency_contact_name || ''} onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1.5">Emergency Contact Phone</label>
                    <input type="text" value={editForm.emergency_contact_phone || ''} onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                  </div>
                </div>

                {/* ── Father / Guardian ── */}
                <div className="pt-2 border-t border-stone/10">
                  <div className="font-semibold text-sm text-brand-dark mb-3">👨 Father / Male Guardian</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Full Name</label>
                      <input type="text" value={editForm.father_name || ''} onChange={(e) => setEditForm({ ...editForm, father_name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" placeholder="e.g. Mohammed Abdi" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Phone</label>
                      <input type="text" value={editForm.father_phone || ''} onChange={(e) => setEditForm({ ...editForm, father_phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email</label>
                      <input type="email" value={editForm.father_email || ''} onChange={(e) => setEditForm({ ...editForm, father_email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Occupation</label>
                      <input type="text" value={editForm.father_occupation || ''} onChange={(e) => setEditForm({ ...editForm, father_occupation: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 mt-3 text-sm text-brand-dark">
                    <input type="checkbox" checked={!!editForm.father_present} onChange={(e) => setEditForm({ ...editForm, father_present: e.target.checked })} className="rounded" />
                    Father is alive / present
                  </label>
                </div>

                {/* ── Mother / Guardian ── */}
                <div className="pt-2 border-t border-stone/10">
                  <div className="font-semibold text-sm text-brand-dark mb-3">👩 Mother / Female Guardian</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Full Name</label>
                      <input type="text" value={editForm.mother_name || ''} onChange={(e) => setEditForm({ ...editForm, mother_name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" placeholder="e.g. Fatuma Hassan" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Phone</label>
                      <input type="text" value={editForm.mother_phone || ''} onChange={(e) => setEditForm({ ...editForm, mother_phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email</label>
                      <input type="email" value={editForm.mother_email || ''} onChange={(e) => setEditForm({ ...editForm, mother_email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-dark mb-1.5">Occupation</label>
                      <input type="text" value={editForm.mother_occupation || ''} onChange={(e) => setEditForm({ ...editForm, mother_occupation: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 mt-3 text-sm text-brand-dark">
                    <input type="checkbox" checked={!!editForm.mother_present} onChange={(e) => setEditForm({ ...editForm, mother_present: e.target.checked })} className="rounded" />
                    Mother is alive / present
                  </label>
                </div>

              </fieldset>

              <div className="flex gap-3 pt-2">
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

          <div className="p-8 grid lg:grid-cols-2 gap-8">
            <div className="lg:col-span-2">
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

            <div className="lg:col-span-2">
              <h2 className="text-sm font-semibold text-terracotta uppercase tracking-widest mb-4">Documents</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Documents issued by the college. Locked until the registrar/admin issues them. */}
                {!docsLoaded && <p className="text-xs text-stone sm:col-span-2">Loading your documents…</p>}
                {issuedDocs.map((d: any) => (
                  <div key={d.slug} className="bg-cream-deep rounded-xl p-4 border border-stone/10">
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <span className="font-medium text-brand-dark text-sm">{d.label}</span>
                      {d.issued ? (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleDownloadDocument(d.slug, 'view')}
                            disabled={downloadingDoc !== null}
                            className="text-xs px-3 py-1 border border-stone/25 text-brand rounded-full hover:bg-stone/5 transition disabled:opacity-50"
                          >
                            {downloadingDoc === `${d.slug}:view` ? 'Opening...' : 'View'}
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(d.slug)}
                            disabled={downloadingDoc !== null}
                            className="text-xs px-3 py-1 bg-brand text-cream rounded-full hover:bg-brand-dark transition disabled:opacity-50"
                          >
                            {downloadingDoc === `${d.slug}:download` ? 'Downloading...' : 'Download'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs px-3 py-1 bg-stone/20 text-stone rounded-full shrink-0">Not yet issued</span>
                      )}
                    </div>
                    <p className="text-xs text-stone">
                      {d.issued
                        ? `Issued ${new Date(d.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`
                        : 'The college has not issued this document yet. It will appear here once it is ready.'}
                    </p>
                  </div>
                ))}

                {/* Student ID Card */}
                <div className="bg-cream-deep rounded-xl p-4 border border-stone/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-brand-dark text-sm">Student ID Card</span>
                    {profile.profile_picture_url ? (
                      <button
                        onClick={handleDownloadIDCard}
                        disabled={downloadingIDCard}
                        className="text-xs px-3 py-1 bg-brand text-cream rounded-full hover:bg-brand-dark transition disabled:opacity-50"
                      >
                        {downloadingIDCard ? 'Downloading...' : 'Download'}
                      </button>
                    ) : (
                      <span className="text-xs px-3 py-1 bg-stone/20 text-stone rounded-full">Upload Photo First</span>
                    )}
                  </div>
                  <p className="text-xs text-stone">Your student ID card - requires profile photo.</p>
                </div>
              </div>
            </div>

            {/* ── Academic history: every level, admission number and intake ── */}
            <div className="lg:col-span-2">
              <h2 className="text-sm font-semibold text-terracotta uppercase tracking-widest mb-4">My Academic History</h2>
              <StudentHistoryPanel studentId={profile.id} />
            </div>

            {/* ── Uploaded Supporting Documents ── */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-terracotta uppercase tracking-widest">My Uploaded Documents</h2>
                <button
                  onClick={() => setShowDocUpload(!showDocUpload)}
                  className="text-xs px-4 py-1.5 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition"
                >
                  {showDocUpload ? 'Cancel' : '+ Upload Documents'}
                </button>
              </div>

              {/* Upload Form */}
              {showDocUpload && (
                <form onSubmit={handleUploadDocuments} className="bg-cream-deep rounded-2xl p-5 border border-stone/10 mb-4 space-y-4">
                  <p className="text-sm text-stone">Upload your required supporting documents below. Accepted formats: PDF, JPG, PNG (max 10MB each).</p>
                  {[
                    { key: 'medical_report', label: '🏥 Medical Report', hint: 'Medical clearance or health form' },
                    { key: 'kcse_certificate', label: '📜 KCSE Certificate / Result Slip', hint: 'Your KCSE or equivalent qualification document' },
                    { key: 'birth_certificate', label: '📋 Birth Certificate', hint: 'Official birth certificate' },
                    { key: 'other_documents', label: '📎 Other Documents', hint: 'Any other supporting documents' },
                  ].map(({ key, label, hint }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-brand-dark mb-1">{label}</label>
                      <p className="text-xs text-stone mb-1.5">{hint}</p>
                      <input
                        type="file"
                        accept=".pdf,image/jpeg,image/jpg,image/png"
                        onChange={e => setDocFiles(prev => ({ ...prev, [key]: e.target.files?.[0] || null }))}
                        className="w-full text-sm text-stone file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:bg-brand/10 file:text-brand file:font-semibold hover:file:bg-brand hover:file:text-cream transition"
                      />
                      {docFiles[key as keyof typeof docFiles] && (
                        <p className="text-xs text-green-600 mt-1">✓ {(docFiles[key as keyof typeof docFiles] as File).name}</p>
                      )}
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={uploadingDocs}
                    className="w-full py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
                  >
                    {uploadingDocs ? 'Uploading...' : 'Upload Selected Documents'}
                  </button>
                </form>
              )}

              {/* Uploaded Document Status */}
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'medical_report_url', label: '🏥 Medical Report', url: profile.medical_report_url },
                  { key: 'kcse_certificate_url', label: '📜 KCSE Certificate', url: profile.kcse_certificate_url },
                  { key: 'birth_certificate_url', label: '📋 Birth Certificate', url: profile.birth_certificate_url },
                  { key: 'other_documents_url', label: '📎 Other Documents', url: profile.other_documents_url },
                ].map(({ key, label, url }) => (
                  <div key={key} className={`rounded-xl p-4 border flex items-center justify-between ${url ? 'bg-green-50 border-green-200' : 'bg-cream-deep border-stone/10'
                    }`}>
                    <div>
                      <div className="text-sm font-medium text-brand-dark">{label}</div>
                      <div className={`text-xs mt-0.5 ${url ? 'text-green-600' : 'text-stone'}`}>
                        {url ? '✅ Uploaded' : 'Not yet uploaded'}
                      </div>
                    </div>
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
                      >
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {/* Current Enrollments */}
              {enrollments.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="font-medium text-green-800 text-sm mb-2">Current Enrollments</div>
                  {enrollments.map((enrollment: any) => (
                    <div key={enrollment.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-green-700">{enrollment.term.name} ({enrollment.term.academic_year})</span>
                      <span className="text-xs px-2 py-0.5 bg-green-600 text-white rounded-full">Enrolled</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Available Terms for Enrollment */}
              {terms.length > 0 && (
                <div className="bg-cream-deep rounded-xl p-4 border border-stone/10">
                  <div className="font-medium text-brand-dark text-sm mb-2">Available Terms</div>
                  <div className="space-y-2">
                    {terms.filter((t: any) => !enrollments.some((e: any) => e.term_id === t.id)).map((term: any) => (
                      <div key={term.id} className="flex items-center justify-between text-sm py-2 border-b border-stone/10 last:border-0">
                        <div>
                          <div className="font-medium text-brand-dark">{term.name}</div>
                          <div className="text-xs text-stone">
                            {[term.academic_year, term.intake ? `${term.intake.charAt(0)}${term.intake.slice(1).toLowerCase()} intake` : '', termDates(term), termFee(term) && `Fee ${termFee(term)}`, termState(term)].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEnrollTerm(term.id)}
                          disabled={enrolling === term.id}
                          className="px-3 py-1 bg-brand text-cream rounded-full text-xs hover:bg-brand-dark transition disabled:opacity-50"
                        >
                          {enrolling === term.id ? 'Enrolling...' : 'Enroll'}
                        </button>
                      </div>
                    ))}
                    {terms.filter((t: any) => !enrollments.some((e: any) => e.term_id === t.id)).length === 0 && (
                      <div className="text-xs text-stone italic">No new terms available for enrollment</div>
                    )}
                  </div>
                </div>
              )}

              {terms.length === 0 && (
                <div className="bg-stone/50 rounded-xl p-4 border border-stone/20 text-center">
                  <p className="text-sm text-stone">No active terms available for enrollment</p>
                </div>
              )}
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
              <button
                onClick={handleViewFeeSummary}
                disabled={loadingFeeSummary}
                className="mt-4 w-full px-4 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50 text-sm"
              >
                {loadingFeeSummary ? 'Loading...' : 'View Detailed Fee Summary'}
              </button>
              <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-xl text-xs border border-blue-100">
                ℹ️ Fee payments are processed at the Finance Office on campus. Present your HELB application evidence there as well.
              </div>
            </div>
          </div>
        </div>

        {/* Fee Summary Modal */}
        {showFeeSummary && feeSummary && (
          <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-10">
            <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl text-brand-dark">Fee Summary</h2>
                <button
                  onClick={() => setShowFeeSummary(false)}
                  className="text-stone hover:text-brand transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Overall Summary */}
                <div className="bg-cream-deep rounded-xl p-4 border border-stone/10">
                  <h3 className="font-semibold text-brand-dark mb-3">Overall Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-stone text-xs mb-1">Total Fees</div>
                      <div className="font-medium text-brand-dark">KES {feeSummary.totalFees?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <div className="text-stone text-xs mb-1">Total Paid</div>
                      <div className="font-medium text-green-600">KES {feeSummary.totalPaid?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <div className="text-stone text-xs mb-1">Balance</div>
                      <div className="font-medium text-red-500">KES {feeSummary.totalBalance?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Per-Term Breakdown */}
                {feeSummary.termBreakdown && feeSummary.termBreakdown.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-3">Term Breakdown</h3>
                    <div className="space-y-3">
                      {feeSummary.termBreakdown.map((term: any) => (
                        <div key={term.term.id} className="bg-white rounded-xl p-4 border border-stone/10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-brand-dark">{term.term.name}</div>
                            <div className="text-xs text-stone">{term.term.academic_year}</div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-stone text-xs mb-1">Total</div>
                              <div className="font-medium">KES {term.total_fees?.toLocaleString() || 0}</div>
                            </div>
                            <div>
                              <div className="text-stone text-xs mb-1">Paid</div>
                              <div className="font-medium text-green-600">KES {term.amount_paid?.toLocaleString() || 0}</div>
                            </div>
                            <div>
                              <div className="text-stone text-xs mb-1">Balance</div>
                              <div className="font-medium text-red-500">KES {term.balance?.toLocaleString() || 0}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fee Records */}
                {feeSummary.paymentHistory && feeSummary.paymentHistory.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-3">Payment History</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {feeSummary.paymentHistory.map((record: any) => (
                        <div key={record.id} className="bg-cream-deep rounded-xl p-3 border border-stone/10 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-brand-dark">{record.feeType?.name}</div>
                              <div className="text-xs text-stone">{new Date(record.paid_at).toLocaleDateString()}</div>
                            </div>
                            <div className="font-medium text-green-600">KES {record.amount?.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowFeeSummary(false)}
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
