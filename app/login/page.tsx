'use client';

import { useState, FormEvent, useEffect } from 'react';
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
  const [shake, setShake] = useState(false);

  // Trigger shake animation every time a new error arrives
  useEffect(() => {
    if (error) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const { data } = await api.get('/auth/me');
      if (data.mustChangePassword) {
        router.push('/change-password');
      } else {
        router.push(portalRoute(data.role));
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid credentials. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Shake keyframe injected once */}
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-6px); }
          30%      { transform: translateX(6px); }
          45%      { transform: translateX(-4px); }
          60%      { transform: translateX(4px); }
          75%      { transform: translateX(-2px); }
          90%      { transform: translateX(2px); }
        }
        .shake { animation: shake 0.55s ease; }
      `}</style>

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

            {/* ── Persistent error banner ── */}
            {error && (
              <div
                role="alert"
                className={`mb-5 rounded-2xl border-2 border-red-300 bg-red-50 p-4 ${shake ? 'shake' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">🚫</span>
                  <div className="flex-1">
                    <p className="font-semibold text-red-800 text-sm">Login failed</p>
                    <p className="text-red-700 text-sm mt-0.5">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError('')}
                    aria-label="Dismiss error"
                    className="text-red-400 hover:text-red-700 transition text-lg leading-none flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-red-500 mt-2 pl-9">
                  💡 Students can use their <strong>Admission Number</strong> (e.g. NTVC/2026/001) or email address.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                  Email or Admission Number
                </label>
                <input
                  id="login-email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-stone/25 bg-cream/40 px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm"
                  placeholder="e.g. NTVC/2026/001 or your email"
                />
                <p className="text-xs text-stone mt-1">Students may use their admission number or email.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
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
     </>
  );
}
