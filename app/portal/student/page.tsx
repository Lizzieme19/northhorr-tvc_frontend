'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function StudentDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'STUDENT')) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      api.get('/students/me').then(r => setProfile(r.data)).catch(console.error);
    }
  }, [user]);

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
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm text-cream/60 hover:text-cream transition">Logout</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
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
              <h2 className="text-sm font-semibold text-terracotta uppercase tracking-widest mb-4">Admissions & Fees</h2>
              
              <div className="bg-cream-deep rounded-xl p-5 mb-4 border border-stone/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-brand-dark">Admission Letter</span>
                  {profile.admission_letter ? (
                    <a href={profile.admission_letter.letter_url} target="_blank" className="text-xs px-3 py-1 bg-brand text-cream rounded-full hover:bg-brand-dark transition">Download PDF</a>
                  ) : (
                    <span className="text-xs px-3 py-1 bg-stone/20 text-stone rounded-full">Pending Generation</span>
                  )}
                </div>
                <p className="text-xs text-stone">Please download, print, and carry this letter on reporting day.</p>
              </div>

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
