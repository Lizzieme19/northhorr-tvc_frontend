'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      alert('Password changed successfully');
      router.push(user ? `/portal/${user.role.toLowerCase().replace('_', '-')}` : '/login');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen grid place-items-center px-6 py-16 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-brand-dark via-brand to-brand-dark/80" />
        <div className="absolute inset-0 bg-dots opacity-20" />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-stone/10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-brand grid place-items-center text-cream font-display font-extrabold text-lg shadow-lg">
              NT
            </div>
            <div>
              <h1 className="font-display text-2xl text-brand-dark">Change Password</h1>
              <p className="text-xs text-stone mt-0.5">Secure your account</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-stone/25 bg-cream/40 px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-stone/25 bg-cream/40 px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                placeholder="Enter new password (min 8 characters)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-stone/25 bg-cream/40 px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition shadow-lg shadow-brand/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
                  Changing...
                </>
              ) : 'Change Password'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-stone hover:text-brand transition"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
