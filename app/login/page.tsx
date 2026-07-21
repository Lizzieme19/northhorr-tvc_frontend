'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, portalRoute } from '@/lib/auth';
import api from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;
      localStorage.setItem('ntvc_access_token', accessToken);
      localStorage.setItem('ntvc_refresh_token', refreshToken);
      
      if (user.mustChangePassword) {
        router.push('/change-password');
      } else {
        router.push(portalRoute(user.role));
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen grid place-items-center px-6 py-16 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-brand-dark via-brand to-brand-dark/80" />
        <div className="absolute inset-0 bg-dots opacity-20" />
      </div>

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-stone/10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-stone hover:text-brand transition mb-6">
            ← Back to website
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-brand grid place-items-center text-cream font-display font-extrabold text-lg shadow-lg">
              NT
            </div>
            <div>
              <h1 className="font-display text-2xl text-brand-dark">Portal Login</h1>
              <p className="text-xs text-stone mt-0.5">Students · Staff · Administration</p>
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
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-stone/25 bg-cream/40 px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                placeholder="e.g. student@ntvc.ac.ke"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-stone/25 bg-cream/40 px-4 py-3 pr-12 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-brand transition text-sm"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition shadow-lg shadow-brand/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <a href="#" className="text-sm text-terracotta font-medium hover:underline">
              Forgot password? Contact administration
            </a>
          </div>
        </div>

        <p className="text-center text-cream/70 text-xs mt-6">
          New student? <Link href="/application" className="text-gold font-medium hover:underline">Apply for admission →</Link>
        </p>
      </div>
    </section>
  );
}
